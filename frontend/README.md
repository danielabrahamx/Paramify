# Frontend Quick Notes

Prerequisites
- Node 18+ and npm
- MetaMask installed
- Contract addresses set in [.env.local](../frontend/.env.local)

Install and run
```
cd frontend
npm install
npm run dev
```
Open the printed URL (typically http://localhost:5173).

Network
- Primary network: PassetHub Testnet
  - RPC: https://testnet-passet-hub-eth-rpc.polkadot.io
  - Chain ID: 420420422 (hex: 0x190f1b46)
- Use the Admin dashboard “Connect to PassetHub Testnet” button to add/switch networks in MetaMask.

Contract addresses
- The app reads these from Vite env:
  - VITE_PARAMIFY_CONTRACT_ADDRESS
  - VITE_MOCK_AGGREGATOR_ADDRESS
- These are auto-populated by the deploy flow. You can override in .env.local if needed.

Admin vs Customer views
- Admin view is shown only if your wallet has DEFAULT_ADMIN_ROLE on the Paramify contract (deployer/admin).
- Customer view is shown otherwise.

Funding and balances
- Admin can fund the contract from the dashboard.
- Contract balance is read directly from chain via provider.getBalance(contractAddress), so admin and customer see the same value.

Buying insurance
- Coverage is in ETH; premium is 10% of coverage (contract logic: msg.value >= coverage/10).
- The app sends premium in exact wei to avoid float rounding issues.

Common issues
- If tx fails with Internal JSON-RPC error (-32603): let the node estimate fees; avoid custom fee fields.
- If estimateGas fails on buy: ensure sufficient premium and no active policy for this wallet.
- On Linux permission error for esbuild: chmod +x node_modules/@esbuild/linux-x64/bin/esbuild

File references
- Admin dashboard: [TypeScript.frontend/src/InsuracleDashboardAdmin.tsx](src/InsuracleDashboardAdmin.tsx:1)
- Customer dashboard: [TypeScript.frontend/src/InsuracleDashboard.tsx](src/InsuracleDashboard.tsx:1)
