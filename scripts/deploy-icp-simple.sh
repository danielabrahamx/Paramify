#!/bin/bash

echo "🚀 SIMPLE IC CANISTER DEPLOYMENT"
echo "================================"

# Check if dfx is available
if ! command -v dfx &> /dev/null; then
    echo "❌ dfx not found. Please run this in your Ubuntu terminal with dfx installed."
    exit 1
fi

echo "✅ dfx found: $(dfx --version)"

# Stop any running replica
echo "🛑 Stopping any running replica..."
dfx stop 2>/dev/null || true

# Start fresh replica
echo "🔄 Starting fresh replica..."
dfx start --clean --background
sleep 10

# Wait for replica to be ready
echo "⏳ Waiting for replica to be ready..."
until dfx ping 2>/dev/null; do
    echo "   Still waiting..."
    sleep 2
done
echo "✅ Replica is ready"

# Deploy core canister
echo ""
echo "📦 Deploying paramify_core..."
dfx deploy paramify_core

if [ $? -eq 0 ]; then
    echo "✅ paramify_core deployed successfully"
    CORE_ID=$(dfx canister id paramify_core)
    echo "   Canister ID: $CORE_ID"
else
    echo "❌ Failed to deploy paramify_core"
    echo "   Check the error messages above"
    exit 1
fi

# Deploy oracle canister
echo ""
echo "📦 Deploying paramify_oracle..."
dfx deploy paramify_oracle

if [ $? -eq 0 ]; then
    echo "✅ paramify_oracle deployed successfully"
    ORACLE_ID=$(dfx canister id paramify_oracle)
    echo "   Canister ID: $ORACLE_ID"
else
    echo "❌ Failed to deploy paramify_oracle"
    echo "   Check the error messages above"
    exit 1
fi

# Deploy frontend canister
echo ""
echo "📦 Deploying paramify_frontend..."
dfx deploy paramify_frontend

if [ $? -eq 0 ]; then
    echo "✅ paramify_frontend deployed successfully"
    FRONTEND_ID=$(dfx canister id paramify_frontend)
    echo "   Canister ID: $FRONTEND_ID"
else
    echo "❌ Failed to deploy paramify_frontend"
    echo "   Check the error messages above"
    exit 1
fi

# Initialize the system
echo ""
echo "🔧 Initializing canisters..."

echo "   Setting flood threshold (12 feet)..."
dfx canister call paramify_core setFloodThreshold "(1200000000000:nat)"

echo "   Setting oracle as updater..."
dfx canister call paramify_core setOracleUpdater "(\"$ORACLE_ID\")"

echo "   Setting oracle core canister ID..."
dfx canister call paramify_oracle setCoreCanister "(principal \"$CORE_ID\")"

echo "   Triggering manual oracle update..."
dfx canister call paramify_oracle manualUpdate

# Test the canisters
echo ""
echo "🧪 Testing canisters..."

echo "   Core canister flood threshold:"
dfx canister call paramify_core getFloodThreshold

echo "   Oracle canister last error:"
dfx canister call paramify_oracle getLastError

# Display results
echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================="
echo "Core Canister:     $CORE_ID"
echo "Oracle Canister:   $ORACLE_ID"
echo "Frontend Canister: $FRONTEND_ID"
echo ""
echo "🌐 Access your dApp at:"
echo "   http://127.0.0.1:4943/?canisterId=$FRONTEND_ID"
echo ""
echo "🔧 Test commands:"
echo "   dfx canister call paramify_core getFloodThreshold"
echo "   dfx canister call paramify_oracle getLastError"
echo "   dfx canister call paramify_oracle manualUpdate"
