#!/bin/bash

echo "🚀 DEPLOYING PARAMIFY IC CANISTERS"
echo "=================================="

# Check if dfx is available
if ! command -v dfx &> /dev/null; then
    echo "❌ dfx not found. Please install the Internet Computer SDK first."
    echo "   Visit: https://internetcomputer.org/docs/current/developer-docs/setup/install/"
    exit 1
fi

echo "✅ dfx found: $(dfx --version)"

# Check if local replica is running
if ! dfx ping &> /dev/null; then
    echo "🔄 Starting local replica..."
    dfx start --background --clean
    sleep 10
else
    echo "✅ Local replica is running"
fi

# Build and deploy canisters
echo ""
echo "🔨 Building and deploying canisters..."

# Deploy core canister first
echo "📦 Deploying paramify_core..."
dfx deploy paramify_core

if [ $? -eq 0 ]; then
    echo "✅ paramify_core deployed successfully"
    CORE_ID=$(dfx canister id paramify_core)
    echo "   Canister ID: $CORE_ID"
else
    echo "❌ Failed to deploy paramify_core"
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
    exit 1
fi

# Initialize oracle with core canister ID
echo ""
echo "🔗 Initializing oracle with core canister..."
dfx canister call paramify_oracle setCoreCanisterId "(\"$CORE_ID\")"

if [ $? -eq 0 ]; then
    echo "✅ Oracle initialized with core canister"
else
    echo "❌ Failed to initialize oracle"
fi

# Set initial flood threshold (12 feet = 1200000000000 units)
echo ""
echo "🎯 Setting initial flood threshold (12 feet)..."
dfx canister call paramify_core setFloodThreshold "(1200000000000:nat)"

if [ $? -eq 0 ]; then
    echo "✅ Flood threshold set to 12 feet"
else
    echo "❌ Failed to set flood threshold"
fi

# Set oracle as updater
echo ""
echo "🔐 Setting oracle as updater..."
dfx canister call paramify_core setOracleUpdater "(\"$ORACLE_ID\")"

if [ $? -eq 0 ]; then
    echo "✅ Oracle set as updater"
else
    echo "❌ Failed to set oracle as updater"
fi

# Create environment file for frontend
echo ""
echo "📝 Creating frontend environment configuration..."
cat > frontend/.env.local << EOF
VITE_PARAMIFY_CORE_CANISTER_ID=$CORE_ID
VITE_PARAMIFY_ORACLE_CANISTER_ID=$ORACLE_ID
VITE_ICP_HOST=http://127.0.0.1:4943
VITE_INTERNET_IDENTITY_URL=https://identity.ic0.app
EOF

echo "✅ Frontend environment configured"

# Display deployment summary
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
echo "🔧 Test canister functions:"
echo "   dfx canister call paramify_core getFloodThreshold"
echo "   dfx canister call paramify_oracle getStatus"
echo ""
echo "📱 Start oracle updates:"
echo "   dfx canister call paramify_oracle startUpdates"
