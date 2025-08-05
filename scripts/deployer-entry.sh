#!/usr/bin/env bash
set -euo pipefail

echo "Deployer entry starting..."
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

echo "RPC_URL=${RPC_URL}"
echo "CHAIN_ID=${CHAIN_ID}"
echo "PRIVATE_KEY length: ${#PRIVATE_KEY}"

# Install deps (clean install for reproducibility)
npm ci

# Run the deployment script
echo "Running deployment to PassetHub via Hardhat Ignition"
echo "Command: npx hardhat ignition deploy ./ignition/modules/Paramify.js --network passetHub"
npx hardhat ignition deploy ./ignition/modules/Paramify.js --network passetHub

# Note: Legacy pvm-deployment.json is not used on PassetHub. Ignition manages deployments.
# You can export addresses to frontend/backend env files after deployment.

echo "Deployer entry finished."
