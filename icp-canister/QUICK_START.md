# Paramify ICP Canister - Quick Start Guide

## Overview

This guide provides a quick path to deploy and test the Paramify insurance system on ICP for the hackathon.

## Prerequisites

1. **Install DFX (DFINITY SDK)**:
   ```bash
   sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
   ```

2. **Install Rust**:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   rustup target add wasm32-unknown-unknown
   ```

3. **Install Node.js** (for frontend/backend)

## Step 1: Deploy the Canister

```bash
# Navigate to canister directory
cd icp-canister

# Start local ICP replica
dfx start --clean --background

# Deploy the canister
dfx deploy

# Note the canister ID that's displayed
```

## Step 2: Initial Setup

```bash
# Get your principal (you're the admin)
dfx identity get-principal

# Check deployment
dfx canister call paramify_insurance get_admin

# Set initial threshold (optional, default is 12 feet)
dfx canister call paramify_insurance set_flood_threshold '(1500000000000)' # 15 feet
```

## Step 3: Test Basic Functions

```bash
# Create a test policy
dfx canister call paramify_insurance create_policy '(1000000000, 10000000000)'

# Check policy stats
dfx canister call paramify_insurance get_policy_stats

# Get policy by ID
dfx canister call paramify_insurance get_policy '(1)'

# Set flood level (as oracle)
dfx canister call paramify_insurance set_flood_level '(1600000000000)' # 16 feet

# Check if payout eligible
dfx canister call paramify_insurance is_payout_eligible "(principal \"$(dfx identity get-principal)\")"

# Trigger payout
dfx canister call paramify_insurance trigger_payout
```

## Step 4: Frontend Integration (Basic)

1. **Update frontend environment**:
   ```bash
   cd ../frontend
   echo "REACT_APP_CANISTER_ID=<your-canister-id>" > .env
   echo "REACT_APP_NETWORK=local" >> .env
   ```

2. **Install ICP dependencies**:
   ```bash
   npm install @dfinity/agent @dfinity/principal @dfinity/auth-client
   ```

3. **Create basic integration** (see FRONTEND_ADAPTATION_GUIDE.md)

## Step 5: Backend Oracle Setup (Basic)

1. **Generate oracle identity**:
   ```javascript
   // Run this Node.js script once
   const { Ed25519KeyIdentity } = require('@dfinity/identity');
   const identity = Ed25519KeyIdentity.generate();
   console.log('Oracle Principal:', identity.getPrincipal().toText());
   console.log('Private Key:', Buffer.from(identity.getKeyPair().secretKey).toString('hex'));
   ```

2. **Add oracle to canister**:
   ```bash
   dfx canister call paramify_insurance add_oracle_updater '(principal "oracle-principal-here")'
   ```

3. **Update backend .env**:
   ```bash
   cd ../backend
   echo "ICP_CANISTER_ID=<your-canister-id>" > .env
   echo "ICP_NETWORK=local" >> .env
   echo "ORACLE_PRIVATE_KEY=<private-key-from-step-1>" >> .env
   ```

## Key Differences from Ethereum Version

| Feature | Ethereum | ICP |
|---------|----------|-----|
| Identity | MetaMask addresses | Internet Identity principals |
| Storage | NFT metadata | Canister stable memory |
| Fees | Gas in ETH | Cycles (abstracted) |
| Updates | Oracle contract | Direct canister calls |
| Events | Smart contract events | Polling/queries |

## Common Commands Reference

```bash
# Canister management
dfx canister status paramify_insurance
dfx canister call paramify_insurance <method> '(<args>)'

# Identity management
dfx identity list
dfx identity use <name>
dfx identity get-principal

# Local development
dfx start --clean --background
dfx stop
dfx deploy --no-wallet
```

## Troubleshooting

1. **"Canister not found"**: Make sure you've deployed and are using the correct canister ID
2. **"Unauthorized"**: Check that you're using the correct identity (admin/oracle)
3. **"Failed to connect"**: Ensure local replica is running (`dfx start`)
4. **Type errors**: ICP uses different number types - use proper conversions

## Next Steps

1. Implement proper frontend UI updates (remove NFT displays)
2. Add Internet Identity authentication flow
3. Deploy to IC mainnet for demo
4. Create demo video showing the conversion

## Hackathon Demo Script

1. Show original Ethereum version with NFTs
2. Deploy ICP canister
3. Create a policy via CLI
4. Update flood level via backend oracle
5. Trigger payout when threshold exceeded
6. Show policy stats
7. Demonstrate admin functions

Remember: Focus on functionality over polish for the hackathon!

