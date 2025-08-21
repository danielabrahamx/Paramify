#!/bin/bash

# ICP Testnet Deployment Script for Flood Insurance Dapp
# This script deploys the canister to the ICP testnet (ic0.testnet)

set -e

echo "🚀 Starting ICP Testnet Deployment for Flood Insurance Dapp"

# Check if dfx is installed
if ! command -v dfx &> /dev/null; then
    echo "❌ dfx is not installed. Please install dfx first:"
    echo "   sh -ci \"\$(curl -fsSL https://internetcomputer.org/install.sh)\""
    exit 1
fi

# Check if dfx is authenticated
if ! dfx identity whoami &> /dev/null; then
    echo "❌ dfx is not authenticated. Please run:"
    echo "   dfx identity new <your-identity-name>"
    echo "   dfx identity use <your-identity-name>"
    echo "   dfx identity get-principal"
    exit 1
fi

# Set network to testnet
echo "🌐 Setting network to ICP testnet..."
dfx config --local network ic0.testnet

# Check if we have cycles
echo "💰 Checking cycles balance..."
CYCLES_BALANCE=$(dfx wallet balance --network ic0.testnet)
echo "Current cycles balance: $CYCLES_BALANCE"

# Check if we need to top up
if [[ $CYCLES_BALANCE -lt 1000000000000 ]]; then
    echo "⚠️  Low cycles balance. Please top up your wallet:"
    echo "   dfx wallet topup --network ic0.testnet"
    echo "   Or visit: https://faucet.dfinity.org/"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Build the project
echo "🔨 Building project..."
dfx build --network ic0.testnet

# Deploy the canister
echo "🚀 Deploying canister to testnet..."
dfx deploy --network ic0.testnet

# Get canister ID
CANISTER_ID=$(dfx canister --network ic0.testnet id main)
echo "✅ Canister deployed successfully!"
echo "   Canister ID: $CANISTER_ID"
echo "   Network: ic0.testnet"

# Create environment file for frontend
echo "📝 Creating environment file..."
cat > frontend/.env.testnet << EOF
# ICP Testnet Environment Variables
VITE_DFX_NETWORK=ic0.testnet
VITE_PARAMIFY_BACKEND_CANISTER_ID=$CANISTER_ID
VITE_ORACLE_SERVICE_CANISTER_ID=
VITE_INTERNET_IDENTITY_CANISTER_ID=rdmx6-jaaaa-aaaaa-aaadq-cai
EOF

echo "📁 Environment file created: frontend/.env.testnet"

# Test the canister
echo "🧪 Testing deployed canister..."
dfx canister --network ic0.testnet call main hello

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Update your frontend to use the new canister ID"
echo "   2. Test the functionality on testnet"
echo "   3. Run the comprehensive test suite:"
echo "      dfx canister --network ic0.testnet call main-test runTests"
echo ""
echo "🔗 Canister URL: https://$CANISTER_ID.ic0.testnet.app"
echo "🌐 Testnet Explorer: https://dashboard.internetcomputer.org/canister/$CANISTER_ID?network=testnet"