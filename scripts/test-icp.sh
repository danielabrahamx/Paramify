#!/bin/bash

echo "🧪 TESTING PARAMIFY IC CANISTERS"
echo "================================="

# Check if dfx is available
if ! command -v dfx &> /dev/null; then
    echo "❌ dfx not found. Please run this in your Ubuntu terminal with dfx installed."
    exit 1
fi

echo "✅ dfx found: $(dfx --version)"

# Check if local replica is running
if ! dfx ping &> /dev/null; then
    echo "❌ Local replica not running. Start it with: dfx start --background"
    exit 1
fi

echo "✅ Local replica is running"

# Get canister IDs
echo ""
echo "🔍 Checking canister status..."

CORE_ID=$(dfx canister id paramify_core 2>/dev/null)
ORACLE_ID=$(dfx canister id paramify_oracle 2>/dev/null)
FRONTEND_ID=$(dfx canister id paramify_frontend 2>/dev/null)

if [ -n "$CORE_ID" ]; then
    echo "✅ paramify_core: $CORE_ID"
else
    echo "❌ paramify_core: Not deployed"
fi

if [ -n "$ORACLE_ID" ]; then
    echo "✅ paramify_oracle: $ORACLE_ID"
else
    echo "❌ paramify_oracle: Not deployed"
fi

if [ -n "$FRONTEND_ID" ]; then
    echo "✅ paramify_frontend: $FRONTEND_ID"
else
    echo "❌ paramify_frontend: Not deployed"
fi

# Test core canister functions
if [ -n "$CORE_ID" ]; then
    echo ""
    echo "🧪 Testing core canister functions..."
    
    echo "   Getting flood threshold..."
    dfx canister call paramify_core getFloodThreshold
    
    echo "   Getting current flood level..."
    dfx canister call paramify_core getCurrentFloodLevel
fi

# Test oracle canister functions
if [ -n "$ORACLE_ID" ]; then
    echo ""
    echo "🧪 Testing oracle canister functions..."
    
    echo "   Getting oracle status..."
    dfx canister call paramify_oracle getStatus
fi

echo ""
echo "🎯 Next steps:"
echo "   1. If canisters are not deployed, run: ./scripts/deploy-icp.sh"
echo "   2. If canisters are deployed, test with: dfx canister call paramify_core getFloodThreshold"
echo "   3. Access frontend at: http://127.0.0.1:4943/?canisterId=<frontend-id>"
