#!/usr/bin/env bash
set -euo pipefail

section() { echo -e "\n==== $1 ===="; }

section "Deployer entry starting"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Show critical envs (mask key)
echo "RPC_URL=${RPC_URL:-}"
echo "CHAIN_ID=${CHAIN_ID:-}"
if [[ -n "${PRIVATE_KEY:-}" ]]; then
  echo "PRIVATE_KEY length: ${#PRIVATE_KEY}"
elif [[ -n "${DEPLOYER_PRIVATE_KEY:-}" ]]; then
  echo "DEPLOYER_PRIVATE_KEY length: ${#DEPLOYER_PRIVATE_KEY}"
else
  echo "No PRIVATE_KEY/DEPLOYER_PRIVATE_KEY provided"
fi

# Ensure deps (auto-fix lockfile mismatch by falling back to npm install)
section "Installing dependencies"
if npm ci; then
  echo "npm ci succeeded"
else
  echo "npm ci failed (likely lock mismatch). Falling back to npm install to update lockfile..."
  npm install
fi

# Pre-deployment checks
section "Running pre-deployment checks"
node scripts/predeploy-checks.js passetHub

# Deploy via Ignition (non-interactive by piping y)
section "Deploying to PassetHub via Hardhat Ignition"
echo "Command: yes | npx hardhat ignition deploy ./ignition/modules/Paramify.js --network passetHub"
# Hardhat Ignition doesn't support --yes; we auto-confirm by piping 'yes'
yes | npx hardhat ignition deploy ./ignition/modules/Paramify.js --network passetHub

# Autoupdate env files with deployed addresses
section "Updating frontend/backend env files from Ignition outputs"
# Retry parse twice in case filesystem sync lags
if node scripts/update-env-from-ignition.js passetHub; then
  echo "Env files updated from Ignition outputs."
else
  echo "First parse failed. Waiting 3s and retrying..."
  sleep 3
  node scripts/update-env-from-ignition.js passetHub || echo "Warning: Env update step did not complete. You may update addresses manually."
fi

section "Deployer entry finished"
