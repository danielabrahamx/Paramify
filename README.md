# Paramify on PassetHub Testnet — Cross‑Platform Quickstart

This README documents a simple, non‑Docker workflow for Windows (WSL), macOS, and Linux.

What you’ll do
- Compile contracts for PolkaVM using resolc
- Deploy to PassetHub Testnet via Hardhat Ignition
- Auto‑propagate deployed addresses into frontend and backend env files
- Start backend and frontend locally
- Connect MetaMask and use explorer links

Prerequisites
- Node 18+ and npm
- Git
- MetaMask installed in your browser
- A PassetHub Testnet account with test ETH
- OS notes:
  - Windows: use WSL (Ubuntu) terminal for all commands
  - macOS: use Terminal/Zsh
  - Linux: use your distro shell

Network details (PassetHub Testnet)
- RPC: https://testnet-passet-hub-eth-rpc.polkadot.io
- Chain ID: 420420422 (hex: 0x190f1b46)
- Currency: ETH

1) Configure environment
- Copy or edit the root .env and ensure the following are set (examples):
  - RPC_URL=https://testnet-passet-hub-eth-rpc.polkadot.io
  - DEPLOYER_PRIVATE_KEY=0x<your-testnet-private-key>
- Ensure frontend/.env.local and backend/.env will be auto‑written by the post‑deploy script. You can also set:
  - VITE_PARAMIFY_CONTRACT_ADDRESS, VITE_MOCK_AGGREGATOR_ADDRESS (frontend)
  - PARAMIFY_ADDRESS, MOCK_ORACLE_ADDRESS (backend)

2) Compile for PolkaVM
Run from the project root:
```
npm run resolc:compile
```
This uses [`TypeScript.scripts/compile-with-resolc.ts()`](scripts/compile-with-resolc.ts:1) to generate Hardhat‑compatible artifacts for PolkaVM.

3) Deploy with Hardhat Ignition
Deploy to PassetHub Testnet:
```
npm run polkavm:deploy:passethub
```
- Uses [`JavaScript.ignition/modules/Paramify.js()`](ignition/modules/Paramify.js:1)
- Writes deployed addresses into:
  - [`frontend/.env.local`](frontend/.env.local)
  - [`backend/.env`](backend/.env)
- If the RPC adapter requires legacy gas fields, the Hardhat config is already set to provide them.

4) Start services
Backend:
```
cd backend
npm install
npm start
```
Frontend:
```
cd frontend
npm install
npm run dev
```
Open the printed URL (typically http://localhost:5173).

5) Connect MetaMask to PassetHub Testnet
In the app’s Admin dashboard, use the “Connect to PassetHub Testnet” button (wallet_addEthereumChain). If you need to add manually:
- Network Name: PassetHub Testnet
- RPC URL: https://testnet-passet-hub-eth-rpc.polkadot.io
- Chain ID: 420420422 (0x190f1b46)
- Currency Symbol: ETH


Usage notes
- Admin gating: The UI checks DEFAULT_ADMIN_ROLE on the Paramify contract and shows admin functions only to the admin.
- Funding: You can fund the contract directly from the Admin dashboard. Contract balance is read on‑chain via provider.getBalance(address).
- Buying insurance: Premium is 10% of the requested coverage. The app computes and sends the exact wei value to satisfy require(msg.value >= coverage/10).


Troubleshooting (brief)
- Internal JSON‑RPC errors (-32603): Remove explicit EIP‑1559 fields and let the node estimate; legacy gasPrice/gas may be required.
- EstimateGas reverts on buyInsurance: Ensure premium in wei is >= coverage/10; avoid float rounding issues.
- Esbuild permission denied: On Linux, make the binary executable (node_modules/@esbuild/<platform>/bin/esbuild).

Repository hygiene
- Deployment scripts and helpers:
  - [`JavaScript.scripts/predeploy-checks.js`](scripts/predeploy-checks.js:1)
  - [`JavaScript.scripts/update-env-from-ignition.js`](scripts/update-env-from-ignition.js:1)
- Frontend admin dashboard:
  - [`TypeScript.frontend/src/InsuracleDashboardAdmin.tsx`](frontend/src/InsuracleDashboardAdmin.tsx:1)
- Customer dashboard:
  - [`TypeScript.frontend/src/InsuracleDashboard.tsx`](frontend/src/InsuracleDashboard.tsx:1)

