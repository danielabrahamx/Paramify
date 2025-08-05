# Paramify: PolkaVM on PassetHub (Testnet) — Plain-English Quickstart

This page is for non-technical users. It shows the simplest way to run Paramify using Docker only.

What you will get
- Contracts deployed to the Passet Hub Testnet (a public practice network)
- The app’s config files auto-filled with the real contract addresses
- Backend (API) and Frontend (website) running locally

Before you start (one-time)
1) Install and open Docker Desktop
2) Get a test wallet private key with a small amount of test ETH on Passet Hub (from the faucet)

Step 1 — Put your key in one place
- Open the file named `.env.deployment`
- Paste your key after: `DEPLOYER_PRIVATE_KEY=0x...`
- Save the file

Step 2 — Deploy the contracts (does everything for you)
Run this command from the project folder:
```
docker compose up --build deployer
```
It will:
- Check your key and the network
- Deploy the contracts to Passet Hub
- Write the new addresses into:
  - `frontend/.env.local`
  - `backend/.env`

If you see a compiler (“resolc”) message
- We pin the compiler tag inside [`hardhat.config.js`](hardhat.config.js:1)
- If the network updates, we will adjust the tag. You can just run the step again later.

Step 3 — Start the app
Run:
```
docker compose up --build
```
Open the printed URL (usually http://localhost:5173). The app is now talking to Passet Hub.

How to confirm in your wallet (MetaMask)
- Switch to “Passet Hub Testnet”
  - RPC: https://testnet-passet-hub-eth-rpc.polkadot.io
  - Chain ID: 420420422
  - Currency: ETH
- Your wallet will show transactions on that test network

Troubleshooting in simple terms
- “Need more ETH”: use the Passet Hub faucet
- “Missing key”: make sure `.env.deployment` has `DEPLOYER_PRIVATE_KEY=0x...`
- “Compiler/resolc error”: try again later; we keep the compiler version pinned in config

Extra info for developers (optional)
- Non-interactive deployer uses Hardhat Ignition in [`scripts.deployer-entry.sh()`](scripts/deployer-entry.sh:1)
- After deploy, addresses are written by [`scripts.update-env-from-ignition.js()`](scripts/update-env-from-ignition.js:1)
- Pre-checks live in [`scripts.predeploy-checks.js()`](scripts/predeploy-checks.js:1)
- Quick smoke test (if you installed Node): `npm run polkavm:e2e`
