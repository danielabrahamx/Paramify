# Activity Log

## 2025-08-05 — Hardhat/PolkaVM migration hardening, local-dev enablement, automation, and Solidity standardization

Summary of changes in this session:

1) Hardhat configuration and networks
- Enabled local PolkaVM (polkavmLocal) pointing to Ubuntu-built binaries:
  - nodeBinaryPath: /home/danie/polkadot-sdk/target/release/substrate-node
  - adapterBinaryPath: /home/danie/polkadot-sdk/target/release/eth-rpc
- Normalized deploy account env:
  - Prefer DEPLOYER_PRIVATE_KEY; fallback to PRIVATE_KEY; mirror PRIVATE_KEY from DEPLOYER_PRIVATE_KEY for legacy tools.
- Passet Hub network reads RPC_URL and CHAIN_ID from env; uses normalized deployer key.
- Compiler setup per user guidance:
  - solidity set to 0.8.28.
  - resolc uses compilerSource: 'npm' with no fixed version to allow plugin auto-selection (primary fix for ResolcPluginError).
See: [`hardhat.config.js`](hardhat.config.js:1)

2) Pre-deployment checks
- Added predeploy checker that ensures keys and RPC reachability:
  - Validates PRIVATE_KEY/DEPLOYER_PRIVATE_KEY format
  - Connects to RPC and reports chainId
  - For local mode, checks binary files exist and optionally tests local RPC
See: [`scripts.predeploy-checks.js()`](scripts/predeploy-checks.js:1)

3) Automated env propagation after deployment
- Script parses Ignition outputs and updates:
  - frontend/.env.local => VITE_PARAMIFY_CONTRACT_ADDRESS, VITE_MOCK_AGGREGATOR_ADDRESS
  - backend/.env => PARAMIFY_CONTRACT_ADDRESS, MOCK_AGGREGATOR_ADDRESS
See: [`scripts.update-env-from-ignition.js()`](scripts/update-env-from-ignition.js:1)

4) Docker deployer flow
- Deployer entry now:
  - runs npm ci
  - runs predeploy checks
  - deploys via Ignition (non-interactive confirmation piped)
  - updates frontend/backend env files
See: [`scripts.deployer-entry.sh()`](scripts/deployer-entry.sh:1)

5) Cross-platform clean
- Replaced Windows-only clean with rimraf to work on Windows/Mac/Linux
- Added rimraf devDependency
See: [`package.json`](package.json:1)

6) E2E smoke test
- Added script that:
  - connects to RPC
  - checks wallet balance
  - reads Paramify owner/threshold; reads Mock latestRoundData; optionally attempts mock update
See: [`scripts.e2e-passethub.js()`](scripts/e2e-passethub.js:1)

7) Deprecations
- Legacy deploy script now aborts with instruction to use Ignition
See: [`scripts.deploy-pvm.js()`](scripts/deploy-pvm.js:1)

8) Solidity version standardized across contracts to 0.8.28
- Updated pragma solidity to ^0.8.28 in:
  - contracts/Paramify.sol
  - contracts/Lock.sol
  - contracts/SimpleTest.sol
  - contracts/MinimalTest.sol
  - contracts/mocks/MockV3Aggregator.sol
  - contracts/MinimalTestContract.sol

9) Deployment env file
- Added .env.deployment with:
  - DEPLOYER_PRIVATE_KEY, RPC_URL, CHAIN_ID
See: [`.env.deployment`](.env.deployment:1)

Notes on Resolc behavior
- Primary fix applied: standardize Solidity to 0.8.28 and remove resolc.version pin to allow plugin auto-selection.
- If auto-selection still fails in your environment, run deploy with an environment pin (no code change), e.g.:
  RESOLC_VERSION=0.8.28 docker compose up deployer

How to run (recap)
- Deploy to Passet Hub via Docker:
  1) Put DEPLOYER_PRIVATE_KEY=0x... into .env.deployment
  2) docker compose up --build deployer
  3) Addresses are written to frontend/.env.local and backend/.env
- Start app stack:
  docker compose up --build
- Quick smoke test (no Docker):
  1) Ensure .env has RPC_URL, CHAIN_ID=420420422, and DEPLOYER_PRIVATE_KEY or PRIVATE_KEY
  2) npm run polkavm:e2e

## 2025-08-05 — Passet Hub migration hardening, local-dev enablement, automation, and compiler standardization

Summary of changes applied:

1) Hardhat configuration refinements
- Enabled local PolkaVM network (polkavmLocal) pointing to your Ubuntu-built binaries:
  - nodeBinaryPath: /home/danie/polkadot-sdk/target/release/substrate-node
  - adapterBinaryPath: /home/danie/polkadot-sdk/target/release/eth-rpc
- Normalized account env handling:
  - Prefer DEPLOYER_PRIVATE_KEY, fallback to PRIVATE_KEY, mirror PRIVATE_KEY from DEPLOYER_PRIVATE_KEY for compatibility.
- Passet Hub network reads RPC_URL and CHAIN_ID from env, uses the normalized deployer key.
- Compiler settings aligned to avoid ResolcPluginError:
  - solidity set to 0.8.28 in hardhat config.
  - resolc: use compilerSource: 'npm', with version left unspecified to allow plugin auto-selection.
See: [`hardhat.config.js`](hardhat.config.js:1)

2) Pre-deployment checks and safer deploy flow
- New script verifies required env vars and RPC reachability before deploy:
  - Validates PRIVATE_KEY/DEPLOYER_PRIVATE_KEY format, confirms RPC connectivity, and checks local binary presence for polkavmLocal.
See: [`scripts.predeploy-checks.js()`](scripts/predeploy-checks.js:1)

- Docker deployer script improvements:
  - Runs npm ci, executes prechecks, deploys with Ignition, then auto-updates frontend/backend env files with deployed addresses.
  - Clear section banners and masked key-length logs.
See: [`scripts.deployer-entry.sh()`](scripts/deployer-entry.sh:1)

3) Automated environment propagation after deployment
- New helper parses Ignition outputs and writes addresses to:
  - frontend/.env.local (VITE_PARAMIFY_CONTRACT_ADDRESS, VITE_MOCK_AGGREGATOR_ADDRESS)
  - backend/.env (PARAMIFY_CONTRACT_ADDRESS, MOCK_AGGREGATOR_ADDRESS)
See: [`scripts.update-env-from-ignition.js()`](scripts/update-env-from-ignition.js:1)

4) Cross-platform clean command
- Replaced Windows-only clean with rimraf for Windows/Mac/Linux.
- Added rimraf as a devDependency.
See: [`package.json`](package.json:1)

5) E2E smoke test
- Script connects to RPC, checks wallet balance, reads Paramify owner/threshold and Mock latestRoundData; optionally attempts mock write if available.
See: [`scripts.e2e-passethub.js()`](scripts/e2e-passethub.js:1)

6) Deprecations cleaned up
- Legacy deploy script now aborts with guidance to use Ignition.
See: [`scripts.deploy-pvm.js()`](scripts/deploy-pvm.js:1)

7) Solidity version standardized to 0.8.28 across contracts
- Updated pragma solidity to ^0.8.28 in:
  - contracts/Paramify.sol
  - contracts/Lock.sol
  - contracts/SimpleTest.sol
  - contracts/MinimalTest.sol
  - contracts/mocks/MockV3Aggregator.sol
  - contracts/MinimalTestContract.sol

8) Deployment environment file
- Added .env.deployment for Docker deployer:
  - DEPLOYER_PRIVATE_KEY, RPC_URL, CHAIN_ID
See: [`.env.deployment`](.env.deployment:1)

Notes on the Resolc issue and current status
- We followed the recommended approach: standardized Solidity to 0.8.28 and removed resolc.version pinning to let the plugin auto-select a compatible resolc.
- If the plugin still fails to auto-select, deploy with a pinned version via environment (no code changes):
  Example: RESOLC_VERSION=0.8.28 docker compose up deployer

How to use
- Deploy via Docker:
  1) Put DEPLOYER_PRIVATE_KEY=0x... into .env.deployment
  2) docker compose up --build deployer
  3) After completion, addresses are written into frontend/.env.local and backend/.env

- Bring up the app stack:
  docker compose up --build

- Quick smoke test (no Docker):
  1) Ensure .env has RPC_URL, CHAIN_ID=420420422, and DEPLOYER_PRIVATE_KEY or PRIVATE_KEY
  2) npm run polkavm:e2e

## 2025-08-05 — PolkaVM Passet Hub enablement and local-dev

Changes implemented:

1) Hardhat: enable polkavmLocal and key normalization
- Enabled `polkavmLocal` with binaries pointing to your Ubuntu builds:
  - nodeBinaryPath: `/home/danie/polkadot-sdk/target/release/substrate-node`
  - adapterBinaryPath: `/home/danie/polkadot-sdk/target/release/eth-rpc`
  - rpcPort default: `8000`
- Added key normalization so `DEPLOYER_PRIVATE_KEY` is accepted automatically if `PRIVATE_KEY` is not present.
See [`hardhat.config.js`](hardhat.config.js:1)

2) Safer deploy pipeline with prechecks and env propagation
- Added pre-deployment checks that validate keys and RPC reachability:
  - Usage: `node scripts/predeploy-checks.js passetHub | polkavmLocal`
  - Confirms PRIVATE_KEY/DEPLOYER_PRIVATE_KEY format, network reachability, and local binary presence (for local).
See [`scripts.predeploy-checks.js()`](scripts/predeploy-checks.js:1)

- Added environment propagation script that reads Ignition outputs and updates:
  - frontend/.env.local: VITE_PARAMIFY_CONTRACT_ADDRESS, VITE_MOCK_AGGREGATOR_ADDRESS
  - backend/.env: PARAMIFY_CONTRACT_ADDRESS, MOCK_AGGREGATOR_ADDRESS
  - Usage: `node scripts/update-env-from-ignition.js passetHub | polkavmLocal`
See [`scripts.update-env-from-ignition.js()`](scripts/update-env-from-ignition.js:1)

- Wired both into deployer entry script so dockerized deployment performs checks and auto-updates env files after Ignition completes.
See [`scripts.deployer-entry.sh()`](scripts/deployer-entry.sh:1)

3) NPM scripts
- passetHub deploy now runs prechecks and env propagation:
  - `npm run polkavm:deploy:passethub`
- Local deploy entry added:
  - `npm run polkavm:deploy:local` (requires local node+adapter running)
- E2E smoke test:
  - `npm run polkavm:e2e`
- Clean script will be made cross-platform in a subsequent change (currently points to a Node-based script placeholder).
See [`package.json`](package.json:1)

4) E2E smoke test
- New script exercises basic read operations (and optional write to mock if available):
  - Reads network, wallet balance, Paramify owner/threshold, Mock decimals/latestRoundData.
  - Input from backend/.env or frontend/.env.local, falls back to env variables.
See [`scripts.e2e-passethub.js()`](scripts/e2e-passethub.js:1)

5) Deprecated legacy deploy script
- `scripts/deploy-pvm.js` now hard-stops with a clear message to use Ignition instead.
See [`scripts.deploy-pvm.js()`](scripts/deploy-pvm.js:1)

Next planned items:
- Cross-platform clean (Node or rimraf), keep minimal deps.
- Standardize env variable docs and update `.env.deployment` to include `DEPLOYER_PRIVATE_KEY`.
- Add concise README sections for:
  - Local polkavmLocal workflow (start node and adapter, then deploy).
  - Passet Hub deployment with docker-compose.
  - Running the E2E smoke test.
- Add more robust end-to-end scenario interacting with Paramify’s purchase/claim flow once confirmed by ABI.

Notes for non-technical use:
- To deploy to Passet Hub with Docker (after funding your deployer key):
  1) Open the file named `.env.deployment` and put your private key in either:
     - `DEPLOYER_PRIVATE_KEY=0x...` (preferred)
     - or `PRIVATE_KEY=0x...` (also works)
     Only one is needed.
  2) Run this once: `docker compose up --build deployer`
     This prepares and deploys the smart contracts to Passet Hub Testnet.
  3) When it finishes, it writes the new contract addresses into:
     - `frontend/.env.local`
     - `backend/.env`
     So the app knows where your contracts are.
  4) Start the app: `docker compose up --build`
     Then open your browser at the address the frontend prints (usually http://localhost:5173).

- To run a quick “does it work?” check (no Docker):
  1) Make sure the `.env` file contains:
     - `RPC_URL=https://testnet-passet-hub-eth-rpc.polkadot.io`
     - `CHAIN_ID=420420422`
     - `DEPLOYER_PRIVATE_KEY=0x...` (or `PRIVATE_KEY=0x...`)
  2) Run: `npm run polkavm:e2e`
     This connects to the network, checks your wallet balance, and reads a few values from the contracts.
All notable actions taken to migrate and run the dApp on PassetHub (PolkaVM), with timestamps left to the local Git history.

## Configuration and Code Changes

1) Hardhat / Plugin
- Enabled @parity/hardhat-polkadot plugin in hardhat.config.js
- Set resolc to npm-based flow with optimizer settings (no local compiler)
- Added passetHub network:
  - url: https://testnet-passet-hub-eth-rpc.polkadot.io
  - chainId: 420420422
  - accounts: from PRIVATE_KEY
- Commented-out local PolkaVM node config for simplicity

2) Package scripts (PolkaVM-only)
- package.json:
  - polkavm:compile => npx hardhat compile
  - polkavm:test => npx hardhat test
  - polkavm:deploy:passethub => npx hardhat ignition deploy ./ignition/modules/Paramify.js --network passetHub
  - polkavm:verify => npx hardhat run scripts/verify-pvm-deployment.js --network passetHub
  - clean => cleans cache/artifacts

3) Frontend: PassetHub-only
- frontend/src/lib/contract.ts:
  - Added VITE_CHAIN_ID (default 420420422) and VITE_RPC_URL (default PassetHub RPC)
  - NETWORK_NAME = "PassetHub Testnet"
  - CURRENCY_SYMBOL = "ETH"
  - isPolkaVMNetwork() validates PassetHub only
- frontend/.env.local:
  - Added VITE_RPC_URL=https://testnet-passet-hub-eth-rpc.polkadot.io
  - Added VITE_CHAIN_ID=420420422
  - Kept placeholder addresses (to be set after deploy)
- frontend/src/InsuracleDashboard.tsx:
  - Replaced all “PolkaVM Local” mentions with PassetHub Testnet
  - On wrong network, calls wallet_addEthereumChain with PassetHub values
  - Fixed calls to getContractAddresses() (no arguments)

4) README rewrite
- Replaced legacy EVM/local-node guidance with PassetHub-only instructions
- MetaMask setup for PassetHub (chainId 420420422), ETH as native symbol
- WSL2/Docker instructions to bypass Windows fs-xattr issue
- Funding instructions (customer wallet needs test ETH on PassetHub)

5) Dockerization
- backend/Dockerfile: Node 20, installs backend, exposes 3001, CMD node server.js
- frontend/Dockerfile: Node 20, installs frontend, exposes 5173, runs Vite dev binding 0.0.0.0
- docker-compose.yml: services frontend and backend with env files mounted

## Attempts and Issues

- npm install on Windows native failed due to fs-xattr (!win32) from the PolkaVM plugin resolver dependency.
  - Mitigation: use WSL2 or Docker (documented).
- docker compose up initially failed because Docker Desktop Linux engine wasn’t running; user opened Docker UI.
- Confirmed that the app should display ETH as currency on PassetHub and not PAS. Updated README and UI accordingly.

## Next Steps Executed / Pending

- Containers: created Docker files and compose; awaiting Docker Desktop Linux engine running to start stack via:
  docker compose up --build -d

- Deployment to PassetHub:
  - Will deploy when confirmed deployer PRIVATE_KEY in .env has test ETH on PassetHub.
  - After deployment, update:
    - frontend/.env.local:
      - VITE_PARAMIFY_CONTRACT_ADDRESS=0x...
      - VITE_MOCK_AGGREGATOR_ADDRESS=0x...
    - backend/.env (if backend interacts on-chain):
      - RPC_URL=https://testnet-passet-hub-eth-rpc.polkadot.io
      - PRIVATE_KEY=0x...
      - PARAMIFY_CONTRACT_ADDRESS=0x...
  - Restart services (Docker) after env updates.

- End-to-end tests:
  - Once contracts are deployed: run app via Docker and validate wallet connect, purchase policy, trigger payout paths.
  - Record results and any errors here.

## User Actions Required

- Ensure Docker Desktop is running (Linux engine) and then run:
  docker compose up --build -d

- Fund deployer and customer wallets with PassetHub test ETH (MetaMask displays ETH):
  - Add PassetHub Testnet:
    - RPC: https://testnet-passet-hub-eth-rpc.polkadot.io
    - Chain ID: 420420422
    - Currency: ETH
  - Use faucet or transfer from funded admin wallet to customer wallet.

- Provide/confirm PRIVATE_KEY in .env (root) for deployment on PassetHub.

## Notes

- MetaMask prompts for “Add PolkaVM Local” have been removed; app now suggests PassetHub Testnet only.
- Windows-native compilation is not supported due to fs-xattr; use WSL2/Docker as documented.

---

## 2025-08-05 — PassetHub normalization and deployment workflow updates

Context
- Goal: eliminate legacy Hardhat local/PolkaVM-local flows and run everything natively on PassetHub Testnet. Ensure deployment addresses flow into env files and the app uses them end-to-end.

Changes made (file-by-file)
1) frontend/src/lib/contract.ts
- Removed hardcoded legacy addresses (0xe7f1…, 0x5FbD…).
- Now sources:
  - VITE_PARAMIFY_CONTRACT_ADDRESS
  - VITE_MOCK_AGGREGATOR_ADDRESS
  - VITE_BACKEND_URL
  - VITE_RPC_URL (default: https://testnet-passet-hub-eth-rpc.polkadot.io)
  - VITE_CHAIN_ID (default: 420420422)
- Added warning if addresses/RPC are missing.
- Preserved ABIs export and helper functions; PassetHub-only network check remains.

2) scripts/deployer-entry.sh
- Replaced legacy call:
  - node scripts/deploy-pvm.js
- With Ignition deploy:
  - npx hardhat ignition deploy ./ignition/modules/Paramify.js --network passetHub
- Commented that pvm-deployment.json is legacy and not used on PassetHub.

3) scripts/deploy-pvm.js
- Marked DEPRECATED (legacy/local only).
- Removed writing to pvm-deployment.json; prints deployed addresses only.

4) scripts/test-polkavm-functionality.js
- Chain ID check updated to 420420422 (PassetHub).
- Loads addresses from environment variables (PARAMIFY_CONTRACT_ADDRESS / VITE_* variants) instead of pvm-deployment.json.
- Skips flow if Paramify address is missing.

5) scripts/verify-pvm-contracts.js
- Stopped reading pvm-deployment.json.
- Reads addresses from environment:
  - PARAMIFY_CONTRACT_ADDRESS or VITE_PARAMIFY_CONTRACT_ADDRESS
  - MOCK_AGGREGATOR_ADDRESS or VITE_MOCK_AGGREGATOR_ADDRESS (optional)
- Gracefully skips MockV3Aggregator testing when absent.

6) .env (root)
- Normalized key for Hardhat accounts: DEPLOYER_PRIVATE_KEY -> PRIVATE_KEY.
- Ensured:
  - RPC_URL=https://testnet-passet-hub-eth-rpc.polkadot.io
  - CHAIN_ID=420420422
  - DEPLOYER_ADDRESS=…
  - CUSTOMER_ADDRESS=…
  - PARAMIFY_CONTRACT_ADDRESS / MOCK_AGGREGATOR_ADDRESS placeholders to be filled post-deploy.

7) frontend/.env.local
- Already PassetHub-aligned:
  - VITE_RPC_URL=https://testnet-passet-hub-eth-rpc.polkadot.io
  - VITE_CHAIN_ID=420420422
  - VITE_PARAMIFY_CONTRACT_ADDRESS=TO_BE_FILLED_AFTER_DEPLOY
  - VITE_MOCK_AGGREGATOR_ADDRESS=TO_BE_FILLED_AFTER_DEPLOY
  - VITE_BACKEND_URL=http://localhost:3001

8) hardhat.config.js
- Addressed Docker deploy errors from @parity/hardhat-polkadot resolc integration:
  - Trial: added resolc.version='0.8.26' (led to “Resolc version 0.8.26 invalid”).
  - Final: reverted to plugin-managed resolc with:
    resolc: { compilerSource: 'npm', settings: { optimizer… } }
- Network 'passetHub' configured with:
  - url: https://testnet-passet-hub-eth-rpc.polkadot.io
  - chainId: 420420422
  - accounts: [process.env.PRIVATE_KEY] (if present)

9) Avoiding stale artifacts
- pvm-deployment.json, demo-deployment.json, test-deployment.json kept for archive only. No longer consumed in current flow.

Deployment attempts (Windows + Docker)
- npm install locally failed due to fs-xattr (!win32). Moved to Docker.
- Docker commands used:
  - docker run --env-file .env -v .:/app -w /app node:20 sh -lc "npm install ; npx hardhat ignition deploy ./ignition/modules/Paramify.js --network passetHub"
  - For interactive confirmation: yes | npx hardhat ignition deploy … (attempted to auto-confirm)
- Initial error: “Resolc version undefined is invalid” → adjusted hardhat.config.js.
- Next error: “Resolc version 0.8.26 is invalid” → removed explicit version and let plugin manage resolc.
- Next step: re-run Ignition deploy under Docker after final config (see checklist).

Checklist to complete deployment and E2E
1) Deploy on PassetHub (Docker):
   docker run -it --env-file .env -v .:/app -w /app node:20 sh -lc "npm install ; npx hardhat clean ; npx hardhat ignition deploy ./ignition/modules/Paramify.js --network passetHub --show-stack-traces"
   - Confirm prompt if shown (“Confirm deploy to network passetHub?”).

2) Capture deployed addresses from Ignition output:
   - Paramify: 0x…
   - Mock/Oracle (if deployed in module): 0x…

3) Update env files:
   - frontend/.env.local
     VITE_PARAMIFY_CONTRACT_ADDRESS=0x…
     VITE_MOCK_AGGREGATOR_ADDRESS=0x… (optional)
   - .env (root) and backend/.env (if backend needs on-chain ops)
     PARAMIFY_CONTRACT_ADDRESS=0x…
     MOCK_AGGREGATOR_ADDRESS=0x…
     RPC_URL=https://testnet-passet-hub-eth-rpc.polkadot.io
     PRIVATE_KEY=0x… (admin/deployer)

4) Restart services / run app
   - If using Docker Compose: docker compose up --build -d
   - Or run frontend dev server (Vite) as per frontend README.

5) E2E test on PassetHub
   - Connect wallet on MetaMask to PassetHub (chainId 420420422).
   - Ensure customer account has ETH for gas.
   - Use the dApp to buy insurance and trigger payout (mock oracle update if applicable).
   - Use updated scripts/verify-pvm-contracts.js to sanity-check on-chain state.

Notes
- PassetHub uses ETH denomination in UI and logs.
- All scripts that referenced local/PolkaVM-local JSON artifacts are now aligned to env-driven addresses.
