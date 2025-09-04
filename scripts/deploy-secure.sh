#!/bin/bash

# Secure deployment script for Paramify ICP
# This script uses environment variables for all sensitive configuration
# No hardcoded identities or principals

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_step() {
    echo -e "\n${BLUE}===> $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Load environment variables
load_env() {
    print_step "Loading environment configuration"
    
    # Check if .env file exists
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            print_warning ".env file not found, copying from .env.example"
            cp .env.example .env
            print_error "Please configure .env file with your values and run again"
            exit 1
        else
            print_error ".env file not found"
            exit 1
        fi
    fi
    
    # Load environment variables
    set -a
    source .env
    set +a
    
    # Validate required variables
    if [ -z "$DEPLOYER_PRINCIPAL" ]; then
        print_error "DEPLOYER_PRINCIPAL not set in .env"
        print_warning "Run: dfx identity get-principal"
        exit 1
    fi
    
    if [ -z "$ADMIN_PRINCIPALS" ]; then
        print_warning "ADMIN_PRINCIPALS not set, using DEPLOYER_PRINCIPAL as admin"
        export ADMIN_PRINCIPALS="$DEPLOYER_PRINCIPAL"
    fi
    
    if [ -z "$MINTING_PRINCIPAL" ]; then
        print_warning "MINTING_PRINCIPAL not set, using DEPLOYER_PRINCIPAL"
        export MINTING_PRINCIPAL="$DEPLOYER_PRINCIPAL"
    fi
    
    print_success "Environment configuration loaded"
}

# Check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites"
    
    # Check DFX
    if ! command -v dfx &> /dev/null; then
        print_error "DFX is not installed"
        echo "Please install DFX: sh -ci \"\$(curl -fsSL https://sdk.dfinity.org/install.sh)\""
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    # Check Rust
    if ! command -v rustc &> /dev/null; then
        print_error "Rust is not installed"
        exit 1
    fi
    
    # Check cargo wasm target
    if ! rustup target list --installed | grep -q "wasm32-unknown-unknown"; then
        print_warning "Installing wasm32-unknown-unknown target"
        rustup target add wasm32-unknown-unknown
    fi
    
    print_success "All prerequisites met"
}

# Start local replica
start_replica() {
    print_step "Starting local replica"
    
    if dfx ping &> /dev/null; then
        print_success "Replica is already running"
    else
        print_warning "Starting new replica"
        dfx start --clean --background
        sleep 5
        
        if dfx ping &> /dev/null; then
            print_success "Replica started successfully"
        else
            print_error "Failed to start replica"
            exit 1
        fi
    fi
}

# Setup identities (no hardcoding)
setup_identities() {
    print_step "Setting up identities"
    
    # Use current identity
    CURRENT_IDENTITY=$(dfx identity whoami)
    print_success "Using identity: $CURRENT_IDENTITY"
    
    CURRENT_PRINCIPAL=$(dfx identity get-principal)
    print_success "Current principal: $CURRENT_PRINCIPAL"
    
    # Verify it matches the configured deployer
    if [ "$CURRENT_PRINCIPAL" != "$DEPLOYER_PRINCIPAL" ]; then
        print_warning "Current principal doesn't match DEPLOYER_PRINCIPAL in .env"
        print_warning "Current: $CURRENT_PRINCIPAL"
        print_warning "Expected: $DEPLOYER_PRINCIPAL"
        echo -n "Continue anyway? (y/n): "
        read -r response
        if [ "$response" != "y" ]; then
            exit 1
        fi
    fi
}

# Deploy ICRC-1 Ledger
deploy_ledger() {
    print_step "Deploying ICRC-1 Ledger"
    
    # Deploy with initialization arguments from environment
    dfx deploy icrc1_ledger --network ${DFX_NETWORK:-local} --argument "(variant { 
        Init = record {
            token_symbol = \"ckETH\";
            token_name = \"Chain Key Ethereum\";
            minting_account = record {
                owner = principal \"$MINTING_PRINCIPAL\"
            };
            transfer_fee = 10_000;
            metadata = vec {};
            initial_balances = vec {
                record {
                    record {
                        owner = principal \"$MINTING_PRINCIPAL\";
                    };
                    100_000_000_000_000;
                };
            };
            archive_options = record {
                num_blocks_to_archive = 10_000;
                trigger_threshold = 20_000;
                controller_id = principal \"$MINTING_PRINCIPAL\";
            };
            feature_flags = opt record { icrc2 = true; };
            decimals = opt 8;
        }
    })" 2>&1 | while IFS= read -r line; do
        echo "  $line"
    done
    
    LEDGER_ID=$(dfx canister id icrc1_ledger --network ${DFX_NETWORK:-local})
    print_success "Ledger deployed: $LEDGER_ID"
}

# Build Oracle canister
build_oracle() {
    print_step "Building Oracle canister (Rust)"
    
    # Build the Rust canister
    cargo build --manifest-path=src/canisters/oracle/Cargo.toml \
                --target wasm32-unknown-unknown \
                --release
    
    # Create directory for wasm if it doesn't exist
    mkdir -p .dfx/local/canisters/oracle
    
    # Copy wasm to expected location
    cp target/wasm32-unknown-unknown/release/oracle.wasm \
       .dfx/local/canisters/oracle/oracle.wasm
    
    # Optimize WASM if ic-wasm is available
    if command -v ic-wasm &> /dev/null; then
        print_warning "Optimizing WASM..."
        ic-wasm .dfx/local/canisters/oracle/oracle.wasm \
                -o .dfx/local/canisters/oracle/oracle_optimized.wasm shrink
        mv .dfx/local/canisters/oracle/oracle_optimized.wasm \
           .dfx/local/canisters/oracle/oracle.wasm
    fi
    
    print_success "Oracle canister built"
}

# Deploy Oracle canister
deploy_oracle() {
    print_step "Deploying Oracle canister"
    
    # Build first
    build_oracle
    
    # Deploy
    dfx deploy oracle --network ${DFX_NETWORK:-local}
    
    ORACLE_ID=$(dfx canister id oracle --network ${DFX_NETWORK:-local})
    print_success "Oracle deployed: $ORACLE_ID"
}

# Deploy Payments canister
deploy_payments() {
    print_step "Deploying Payments canister"
    
    dfx deploy payments --network ${DFX_NETWORK:-local}
    
    PAYMENTS_ID=$(dfx canister id payments --network ${DFX_NETWORK:-local})
    print_success "Payments deployed: $PAYMENTS_ID"
    
    # Configure payments canister
    print_warning "Configuring Payments canister..."
    
    LEDGER_ID=$(dfx canister id icrc1_ledger --network ${DFX_NETWORK:-local})
    
    # Set ledger canister
    dfx canister call payments setLedgerCanister "(principal \"$LEDGER_ID\")" \
        --network ${DFX_NETWORK:-local}
    
    # Add admins from environment
    IFS=',' read -ra ADMIN_ARRAY <<< "$ADMIN_PRINCIPALS"
    for admin in "${ADMIN_ARRAY[@]}"; do
        admin=$(echo "$admin" | xargs) # trim whitespace
        if [ ! -z "$admin" ]; then
            dfx canister call payments addAdmin "(principal \"$admin\")" \
                --network ${DFX_NETWORK:-local}
            print_success "Added admin: $admin"
        fi
    done
    
    print_success "Payments configured"
}

# Deploy Insurance canister
deploy_insurance() {
    print_step "Deploying Insurance canister"
    
    dfx deploy insurance --network ${DFX_NETWORK:-local}
    
    INSURANCE_ID=$(dfx canister id insurance --network ${DFX_NETWORK:-local})
    print_success "Insurance deployed: $INSURANCE_ID"
    
    # Initialize insurance canister
    print_warning "Initializing Insurance canister..."
    
    ORACLE_ID=$(dfx canister id oracle --network ${DFX_NETWORK:-local})
    PAYMENTS_ID=$(dfx canister id payments --network ${DFX_NETWORK:-local})
    
    # Convert admin principals to array format
    ADMIN_PRINCIPALS_ARRAY="vec {"
    IFS=',' read -ra ADMIN_ARRAY <<< "$ADMIN_PRINCIPALS"
    for admin in "${ADMIN_ARRAY[@]}"; do
        admin=$(echo "$admin" | xargs) # trim whitespace
        if [ ! -z "$admin" ]; then
            ADMIN_PRINCIPALS_ARRAY="$ADMIN_PRINCIPALS_ARRAY principal \"$admin\";"
        fi
    done
    ADMIN_PRINCIPALS_ARRAY="$ADMIN_PRINCIPALS_ARRAY }"
    
    dfx canister call insurance initialize "(
        principal \"$ORACLE_ID\",
        principal \"$PAYMENTS_ID\",
        $ADMIN_PRINCIPALS_ARRAY
    )" --network ${DFX_NETWORK:-local}
    
    print_success "Insurance initialized"
}

# Configure inter-canister permissions
configure_permissions() {
    print_step "Configuring inter-canister permissions"
    
    INSURANCE_ID=$(dfx canister id insurance --network ${DFX_NETWORK:-local})
    
    # Add Insurance as authorized caller in Oracle
    dfx canister call oracle add_authorized_caller "(principal \"$INSURANCE_ID\")" \
        --network ${DFX_NETWORK:-local}
    
    # Add Insurance as authorized caller in Payments
    dfx canister call payments addAuthorizedCaller "(principal \"$INSURANCE_ID\")" \
        --network ${DFX_NETWORK:-local}
    
    print_success "Permissions configured"
}

# Generate canister declarations
generate_declarations() {
    print_step "Generating canister declarations"
    
    dfx generate --network ${DFX_NETWORK:-local}
    
    print_success "Declarations generated"
}

# Deploy frontend assets
deploy_frontend() {
    print_step "Deploying frontend assets"
    
    # Build frontend
    print_warning "Building frontend..."
    cd frontend
    npm install
    npm run build
    cd ..
    
    # Deploy frontend canister
    dfx deploy frontend --network ${DFX_NETWORK:-local}
    
    FRONTEND_ID=$(dfx canister id frontend --network ${DFX_NETWORK:-local})
    print_success "Frontend deployed: $FRONTEND_ID"
}

# Generate canister IDs file
generate_canister_ids() {
    print_step "Generating canister IDs"
    
    NETWORK=${DFX_NETWORK:-local}
    
    cat > canister_ids.json << EOF
{
  "insurance": {
    "$NETWORK": "$(dfx canister id insurance --network $NETWORK)"
  },
  "oracle": {
    "$NETWORK": "$(dfx canister id oracle --network $NETWORK)"
  },
  "payments": {
    "$NETWORK": "$(dfx canister id payments --network $NETWORK)"
  },
  "icrc1_ledger": {
    "$NETWORK": "$(dfx canister id icrc1_ledger --network $NETWORK)"
  },
  "frontend": {
    "$NETWORK": "$(dfx canister id frontend --network $NETWORK)"
  }
}
EOF
    
    print_success "Canister IDs saved to canister_ids.json"
}

# Update .env file with canister IDs
update_env() {
    print_step "Updating .env file with canister IDs"
    
    NETWORK=${DFX_NETWORK:-local}
    
    # Update canister IDs in .env
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/INSURANCE_CANISTER_ID=.*/INSURANCE_CANISTER_ID=$(dfx canister id insurance --network $NETWORK)/" .env
        sed -i '' "s/ORACLE_CANISTER_ID=.*/ORACLE_CANISTER_ID=$(dfx canister id oracle --network $NETWORK)/" .env
        sed -i '' "s/PAYMENTS_CANISTER_ID=.*/PAYMENTS_CANISTER_ID=$(dfx canister id payments --network $NETWORK)/" .env
        sed -i '' "s/ICRC1_LEDGER_CANISTER_ID=.*/ICRC1_LEDGER_CANISTER_ID=$(dfx canister id icrc1_ledger --network $NETWORK)/" .env
        sed -i '' "s/FRONTEND_CANISTER_ID=.*/FRONTEND_CANISTER_ID=$(dfx canister id frontend --network $NETWORK)/" .env
    else
        # Linux
        sed -i "s/INSURANCE_CANISTER_ID=.*/INSURANCE_CANISTER_ID=$(dfx canister id insurance --network $NETWORK)/" .env
        sed -i "s/ORACLE_CANISTER_ID=.*/ORACLE_CANISTER_ID=$(dfx canister id oracle --network $NETWORK)/" .env
        sed -i "s/PAYMENTS_CANISTER_ID=.*/PAYMENTS_CANISTER_ID=$(dfx canister id payments --network $NETWORK)/" .env
        sed -i "s/ICRC1_LEDGER_CANISTER_ID=.*/ICRC1_LEDGER_CANISTER_ID=$(dfx canister id icrc1_ledger --network $NETWORK)/" .env
        sed -i "s/FRONTEND_CANISTER_ID=.*/FRONTEND_CANISTER_ID=$(dfx canister id frontend --network $NETWORK)/" .env
    fi
    
    print_success ".env file updated"
}

# Print deployment summary
print_summary() {
    print_step "Deployment Summary"
    
    NETWORK=${DFX_NETWORK:-local}
    
    echo ""
    echo "========================================="
    echo "  Paramify ICP Secure Deployment Complete"
    echo "========================================="
    echo ""
    echo "Network: $NETWORK"
    echo ""
    echo "Canister IDs:"
    echo "  Insurance:     $(dfx canister id insurance --network $NETWORK)"
    echo "  Oracle:        $(dfx canister id oracle --network $NETWORK)"
    echo "  Payments:      $(dfx canister id payments --network $NETWORK)"
    echo "  ICRC-1 Ledger: $(dfx canister id icrc1_ledger --network $NETWORK)"
    echo "  Frontend:      $(dfx canister id frontend --network $NETWORK)"
    echo ""
    echo "Frontend URL:"
    echo "  http://$(dfx canister id frontend --network $NETWORK).localhost:4943"
    echo ""
    echo "Admin Principals:"
    IFS=',' read -ra ADMIN_ARRAY <<< "$ADMIN_PRINCIPALS"
    for admin in "${ADMIN_ARRAY[@]}"; do
        admin=$(echo "$admin" | xargs)
        echo "  - $admin"
    done
    echo ""
    echo "Next steps:"
    echo "  1. Test the system: ./scripts/run-tests.sh"
    echo "  2. Start frontend dev server: cd frontend && npm run dev"
    echo "  3. View logs: dfx canister logs <canister-name>"
    echo ""
}

# Main deployment flow
main() {
    echo "========================================="
    echo "  Paramify ICP Secure Deployment Script"
    echo "========================================="
    
    load_env
    check_prerequisites
    start_replica
    setup_identities
    
    # Deploy canisters in order
    deploy_ledger
    deploy_oracle
    deploy_payments
    deploy_insurance
    
    # Configure system
    configure_permissions
    generate_declarations
    deploy_frontend
    
    # Generate artifacts
    generate_canister_ids
    update_env
    
    # Print summary
    print_summary
    
    print_success "Deployment completed successfully!"
}

# Run main function
main "$@"