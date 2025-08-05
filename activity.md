# Activity Log

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
