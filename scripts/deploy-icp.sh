#!/bin/bash

# Paramify ICP Deployment Script
# This script deploys all Paramify canisters to the Internet Computer

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Paramify ICP Deployment${NC}"

# Check if dfx is installed
if ! command -v dfx &> /dev/null; then
    echo -e "${RED}❌ dfx is not installed. Please install the IC SDK first.${NC}"
    echo "Visit: https://internetcomputer.org/docs/current/developer-docs/setup/install/"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "dfx.json" ]; then
    echo -e "${RED}❌ dfx.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Start local replica if not running
echo -e "${YELLOW}📡 Checking local replica...${NC}"
if ! dfx ping &> /dev/null; then
    echo -e "${YELLOW}📡 Starting local replica...${NC}"
    dfx start --background
    sleep 5
else
    echo -e "${GREEN}✅ Local replica is running${NC}"
fi

# Deploy core canister first
echo -e "${YELLOW}🏗️  Deploying Paramify Core canister...${NC}"
dfx deploy paramify_core --yes
CORE_CANISTER_ID=$(dfx canister id paramify_core)
echo -e "${GREEN}✅ Core canister deployed: ${CORE_CANISTER_ID}${NC}"

# Deploy oracle canister with core canister ID
echo -e "${YELLOW}🔮 Deploying Paramify Oracle canister...${NC}"
dfx deploy paramify_oracle --yes
ORACLE_CANISTER_ID=$(dfx canister id paramify_oracle)
echo -e "${GREEN}✅ Oracle canister deployed: ${ORACLE_CANISTER_ID}${NC}"

# Initialize oracle with core canister ID
echo -e "${YELLOW}🔗 Initializing oracle with core canister...${NC}"
dfx canister call paramify_oracle initialize "(principal \"${CORE_CANISTER_ID}\")"
echo -e "${GREEN}✅ Oracle initialized${NC}"

# Build and deploy frontend
echo -e "${YELLOW}🌐 Building React frontend...${NC}"
cd frontend
npm run build
cd ..

echo -e "${YELLOW}📦 Deploying frontend canister...${NC}"
dfx deploy paramify_frontend --yes
FRONTEND_CANISTER_ID=$(dfx canister id paramify_frontend)
echo -e "${GREEN}✅ Frontend canister deployed: ${FRONTEND_CANISTER_ID}${NC}"

# Display deployment summary
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Deployment Summary:${NC}"
echo -e "  • Core Canister ID: ${CORE_CANISTER_ID}"
echo -e "  • Oracle Canister ID: ${ORACLE_CANISTER_ID}"
echo -e "  • Frontend Canister ID: ${FRONTEND_CANISTER_ID}"
echo ""
echo -e "${YELLOW}🔗 Access URLs:${NC}"
echo -e "  • Frontend: http://127.0.0.1:4943/?canisterId=${FRONTEND_CANISTER_ID}"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo -e "  1. Start the oracle updates: dfx canister call paramify_oracle startUpdates"
echo -e "  2. Open the frontend URL above to test the application"
echo -e "  3. For production deployment, use: dfx deploy --network ic"
echo ""

# Export canister IDs as environment variables for frontend
echo -e "${YELLOW}💾 Setting environment variables for frontend...${NC}"
export VITE_PARAMIFY_CORE_CANISTER_ID=${CORE_CANISTER_ID}
export VITE_PARAMIFY_ORACLE_CANISTER_ID=${ORACLE_CANISTER_ID}
export VITE_ICP_HOST=http://127.0.0.1:4943

echo -e "${GREEN}✅ Environment variables set${NC}"
echo -e "${GREEN}🚀 Paramify ICP deployment completed successfully!${NC}"