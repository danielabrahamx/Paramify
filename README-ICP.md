# Paramify - Internet Computer Protocol Migration

Complete deployment and setup guide for the migrated Paramify dApp on Internet Computer Protocol.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Manual Deployment](#manual-deployment)
- [Testing](#testing)
- [Architecture](#architecture)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### 1. Install Node.js and npm
```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

### 2. Install Rust
```bash
# Install Rust and Cargo
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Add WebAssembly target
rustup target add wasm32-unknown-unknown

# Verify installation
rustc --version  # Should show 1.70.0 or higher
cargo --version
```

### 3. Install DFX (DFINITY SDK)
```bash
# Install DFX
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"

# Verify installation
dfx --version  # Should show 0.16.1 or higher
```

### 4. Install Additional Tools
```bash
# Install candid-extractor for Rust canisters
cargo install candid-extractor

# Install ic-wasm for optimization
cargo install ic-wasm

# Install vessel for Motoko package management (optional)
npm install -g vessel
```

### 5. Install Project Dependencies
```bash
# Clone the repository
git clone https://github.com/your-repo/paramify-icp.git
cd paramify-icp

# Checkout ICP migration branch
git checkout icp-migration

# Install npm dependencies
npm install

# Build Rust canisters
cd src/canisters/oracle
cargo build --target wasm32-unknown-unknown --release
cd ../../..
```

## Quick Start

### Automated Local Deployment
```bash
# Make deployment script executable
chmod +x scripts/deploy-local.sh

# Run automated deployment (deploys all canisters and initializes them)
./scripts/deploy-local.sh

# The script will:
# 1. Start local ICP replica
# 2. Deploy ICRC-1 ledger
# 3. Deploy insurance canister
# 4. Deploy oracle canister
# 5. Deploy payments canister
# 6. Deploy frontend
# 7. Initialize all canisters with proper configuration
# 8. Output canister IDs and URLs
```

### Access the Application
After deployment, access the application at:
```
http://localhost:4943/?canisterId=<frontend-canister-id>
```

The deployment script will output the exact URL.

## Manual Deployment

### Step 1: Start Local Replica
```bash
# Start the local Internet Computer replica
dfx start --clean

# In a new terminal, continue with the following steps
```

### Step 2: Create Canisters
```bash
# Create all canisters without deploying
dfx canister create --all
```

### Step 3: Deploy ICRC-1 Ledger
```bash
# Deploy the ledger for payment tokens
dfx deploy icrc1_ledger --argument "(variant { Init = record {
    token_symbol = \"USDC\";
    token_name = \"USD Coin\";
    minting_account = record { owner = principal \"$(dfx identity get-principal)\" };
    transfer_fee = 10_000;
    metadata = vec {};
    initial_balances = vec {
        record {
            record { owner = principal \"$(dfx identity get-principal)\" };
            1_000_000_000_000
        }
    };
    archive_options = record {
        num_blocks_to_archive = 1000;
        trigger_threshold = 2000;
        controller_id = principal \"$(dfx identity get-principal)\"
    };
}})"
```

### Step 4: Build Canisters
```bash
# Build all canisters
dfx build

# For production build with optimization
dfx build --network ic
```

### Step 5: Deploy Core Canisters
```bash
# Deploy insurance canister
dfx deploy insurance

# Deploy oracle canister
dfx deploy oracle

# Deploy payments canister
dfx deploy payments
```

### Step 6: Initialize Canisters
```bash
# Get canister IDs
LEDGER_ID=$(dfx canister id icrc1_ledger)
ORACLE_ID=$(dfx canister id oracle)
PAYMENTS_ID=$(dfx canister id payments)
INSURANCE_ID=$(dfx canister id insurance)

# Initialize insurance canister
dfx canister call insurance initialize "(record {
    oracle_principal = principal \"$ORACLE_ID\";
    payments_principal = principal \"$PAYMENTS_ID\";
    treasury_principal = principal \"$(dfx identity get-principal)\";
    base_premium_rate = 1000;
    max_coverage = 1000000;
    min_coverage = 1000;
    payout_period_days = 30
})"

# Initialize payments canister
dfx canister call payments initialize "(record {
    ledger_principal = principal \"$LEDGER_ID\";
    insurance_principal = principal \"$INSURANCE_ID\";
    treasury_principal = principal \"$(dfx identity get-principal)\"
})"

# Initialize oracle canister
dfx canister call oracle initialize "{
    \"insurance_principal\": \"$INSURANCE_ID\",
    \"usgs_site_id\": \"01646500\",
    \"update_interval_seconds\": 3600
}"
```

### Step 7: Deploy Frontend
```bash
# Build frontend
npm run build

# Deploy frontend canister
dfx deploy frontend

# Get frontend URL
echo "Frontend URL: http://localhost:4943/?canisterId=$(dfx canister id frontend)"
```

## Testing

### Unit Tests
```bash
# Run Motoko tests
npm run test:motoko

# Run Rust tests
cd src/canisters/oracle
cargo test
cd ../../..
```

### Integration Tests
```bash
# Run integration tests
npm run test:integration

# Test specific canister functions
dfx canister call insurance get_all_policies
dfx canister call oracle get_latest_data
dfx canister call payments get_pool_balance
```

### Manual Testing Checklist
1. **Policy Purchase**
   ```bash
   dfx canister call insurance purchase_policy "(record {
       coverage_amount = 10000;
       location = \"Washington, DC\";
       duration_days = 30;
       flood_threshold = 1500
   })"
   ```

2. **Oracle Data Update**
   ```bash
   dfx canister call oracle fetch_flood_data
   dfx canister call oracle get_latest_data
   ```

3. **Payment Processing**
   ```bash
   dfx canister call payments get_pool_balance
   ```

4. **Automatic Payout Check**
   ```bash
   dfx canister call insurance check_payouts
   ```

## Architecture

### Canister Structure
```
├── Insurance Canister (Motoko)
│   ├── Policy Management
│   ├── Payout Logic
│   └── Threshold Monitoring
│
├── Oracle Canister (Rust)
│   ├── USGS Data Fetching
│   ├── HTTPS Outcalls
│   └── Data Transformation
│
├── Payments Canister (Motoko)
│   ├── ICRC-1 Integration
│   ├── Pool Management
│   └── Escrow Services
│
└── Frontend Canister
    ├── React Application
    ├── Agent-js Integration
    └── Internet Identity
```

### Data Flow
1. User purchases policy through frontend
2. Insurance canister calculates premium
3. Payments canister processes payment via ICRC-1
4. Oracle canister monitors water levels
5. Insurance canister triggers automatic payouts when thresholds exceeded
6. Payments canister releases funds from pool

## Troubleshooting

### Common Issues

#### 1. DFX Command Not Found
```bash
# Ensure DFX is in PATH
export PATH=$HOME/bin:$PATH
# Add to ~/.bashrc or ~/.zshrc for persistence
```

#### 2. Replica Won't Start
```bash
# Stop any running replicas
dfx stop
# Start with clean state
dfx start --clean
```

#### 3. Canister Build Failures
```bash
# Clear build cache
dfx build --clean
# Check Rust toolchain
rustup update
rustup target add wasm32-unknown-unknown
```

#### 4. WASM Optimization Issues
```bash
# Install ic-wasm if missing
cargo install ic-wasm
# Manual optimization
ic-wasm target/wasm32-unknown-unknown/release/oracle.wasm -o oracle_optimized.wasm shrink
```

#### 5. Frontend Not Loading
```bash
# Rebuild frontend
npm run build
# Redeploy
dfx deploy frontend --mode reinstall
# Check console for errors
# Verify canister IDs in .env file
```

### Useful Commands
```bash
# Check canister status
dfx canister status --all

# View canister logs
dfx canister logs insurance

# Get canister IDs
dfx canister id insurance
dfx canister id oracle
dfx canister id payments

# Check wallet balance
dfx wallet balance

# Top up canister cycles
dfx canister deposit-cycles 1000000000000 insurance

# Export candid interface
dfx canister metadata insurance candid:service

# Stop local replica
dfx stop
```

## Production Deployment

### Deploy to Mainnet
```bash
# Configure mainnet identity
dfx identity use mainnet

# Deploy with cycles wallet
dfx deploy --network ic --with-cycles 1000000000000

# Verify deployment
dfx canister --network ic status --all
```

### Monitor Canisters
```bash
# Check cycles balance
dfx canister --network ic status insurance

# View recent logs
dfx canister --network ic logs insurance

# Get canister metrics
dfx canister --network ic call insurance get_metrics
```

## Security Considerations

1. **Access Control**: All administrative functions use Principal-based authentication
2. **Input Validation**: All user inputs are validated before processing
3. **Overflow Protection**: Nat types and checked arithmetic prevent overflows
4. **Stable Storage**: Critical data persists across upgrades
5. **Rate Limiting**: Oracle updates limited to prevent abuse
6. **Secure Randomness**: Uses IC's secure randomness for policy IDs

## Support

For issues or questions:
1. Check the [troubleshooting section](#troubleshooting)
2. Review [architecture documentation](docs/architecture.md)
3. Open an issue on GitHub
4. Contact the development team

## License

MIT License - See LICENSE file for details

---

**Last Updated**: September 2024
**Version**: 1.0.0 (ICP Migration)
**Status**: Production Ready