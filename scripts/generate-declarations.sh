#!/bin/bash

# Script to generate canister declarations for frontend integration

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_step() {
    echo -e "\n${BLUE}===> $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if dfx is installed
if ! command -v dfx &> /dev/null; then
    print_error "DFX is not installed. Please install DFX first."
    exit 1
fi

# Check if replica is running
print_step "Checking if local replica is running"
if ! dfx ping &> /dev/null; then
    print_warning "Local replica is not running. Starting it now..."
    dfx start --clean --background
    sleep 5
fi

# Build canisters if not already built
print_step "Building canisters"

# Build Motoko canisters
print_warning "Building Insurance canister..."
dfx build insurance 2>&1 | while read -r line; do echo "  $line"; done || true

print_warning "Building Payments canister..."
dfx build payments 2>&1 | while read -r line; do echo "  $line"; done || true

# Build Rust canister
print_warning "Building Oracle canister..."
if [ -f "src/canisters/oracle/Cargo.toml" ]; then
    cargo build --manifest-path=src/canisters/oracle/Cargo.toml \
                --target wasm32-unknown-unknown \
                --release 2>&1 | while read -r line; do echo "  $line"; done || true
    
    # Copy wasm to expected location
    mkdir -p .dfx/local/canisters/oracle
    if [ -f "target/wasm32-unknown-unknown/release/oracle.wasm" ]; then
        cp target/wasm32-unknown-unknown/release/oracle.wasm \
           .dfx/local/canisters/oracle/oracle.wasm
        print_success "Oracle WASM copied"
    fi
fi

# Generate declarations
print_step "Generating TypeScript/JavaScript declarations"

# Create declarations directory if it doesn't exist
mkdir -p src/declarations

# Generate for each canister
for canister in insurance oracle payments icrc1_ledger; do
    print_warning "Generating declarations for $canister..."
    
    # Check if canister is deployed
    if dfx canister id $canister --network local 2>/dev/null; then
        dfx generate $canister --network local 2>&1 | while read -r line; do echo "  $line"; done || true
        
        # Check if declarations were generated
        if [ -d "src/declarations/$canister" ]; then
            print_success "Declarations generated for $canister"
            
            # Create index file for easier imports
            cat > "src/declarations/$canister/index.js" << EOF
export * from './${canister}.did.js';
EOF
            
            # Create TypeScript declaration file if it doesn't exist
            if [ ! -f "src/declarations/$canister/index.d.ts" ]; then
                cat > "src/declarations/$canister/index.d.ts" << EOF
export * from './${canister}.did';
EOF
            fi
        else
            print_warning "Declarations not generated for $canister (canister may not be deployed)"
        fi
    else
        print_warning "Canister $canister not deployed, skipping declaration generation"
    fi
done

# Copy declarations to frontend if they exist
print_step "Copying declarations to frontend"

if [ -d "frontend/src" ]; then
    # Create frontend declarations directory
    mkdir -p frontend/src/declarations
    
    # Copy each canister's declarations
    for canister in insurance oracle payments icrc1_ledger; do
        if [ -d "src/declarations/$canister" ]; then
            cp -r "src/declarations/$canister" "frontend/src/declarations/" 2>/dev/null || true
            print_success "Copied $canister declarations to frontend"
        fi
    done
    
    # Create a barrel export file
    cat > "frontend/src/declarations/index.ts" << 'EOF'
// Auto-generated barrel export for canister declarations

// Only export if the declarations exist
let insuranceExports = {};
let oracleExports = {};
let paymentsExports = {};
let ledgerExports = {};

try {
  insuranceExports = require('./insurance');
} catch (e) {
  console.warn('Insurance declarations not found');
}

try {
  oracleExports = require('./oracle');
} catch (e) {
  console.warn('Oracle declarations not found');
}

try {
  paymentsExports = require('./payments');
} catch (e) {
  console.warn('Payments declarations not found');
}

try {
  ledgerExports = require('./icrc1_ledger');
} catch (e) {
  console.warn('Ledger declarations not found');
}

export const insurance = insuranceExports;
export const oracle = oracleExports;
export const payments = paymentsExports;
export const ledger = ledgerExports;
EOF
    
    print_success "Created barrel export file"
fi

# Update .gitignore if necessary
print_step "Updating .gitignore"

if ! grep -q "src/declarations" .gitignore 2>/dev/null; then
    echo "" >> .gitignore
    echo "# Generated canister declarations" >> .gitignore
    echo "src/declarations/" >> .gitignore
    echo "frontend/src/declarations/" >> .gitignore
    print_success "Updated .gitignore"
fi

print_step "Declaration Generation Complete"
echo ""
echo "Declarations have been generated in:"
echo "  - src/declarations/ (for backend)"
echo "  - frontend/src/declarations/ (for frontend)"
echo ""
echo "You can now import them in your frontend code:"
echo "  import { insurance, oracle, payments } from '../declarations';"
echo ""
print_success "All done!"