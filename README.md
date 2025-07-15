# Paramify: Decentralized Flood Insurance - Polkadot Passet Hub Proof of Concept

![alt text](image.png)

## Overview

**Paramify** is a proof of concept (PoC) for a decentralized flood insurance platform specifically built for **Polkadot's Passet Hub parachain**. This project was commissioned by Polkadot to demonstrate how automated insurance purchases and payouts can work on their ecosystem, using real-time flood level data from USGS integrated through a Chainlink-compatible oracle.

### Built for Passet Hub with PolkaVM Support

This project is configured and ready for deployment on **Passet Hub Testnet** (Chain ID: 420420422), a Polkadot parachain with both EVM and **PolkaVM** compatibility. Our account is funded with 4995+ PAS tokens and all deployment scripts are ready for immediate use once the network lifts temporary deployment restrictions.

#### ✅ PolkaVM Migration Complete
The codebase now supports **PolkaVM** (Polkadot Virtual Machine) deployment:
- Contracts compile to RISC-V bytecode using the `resolc` compiler
- All deprecated patterns have been fixed for PolkaVM compatibility
- Deployment scripts optimized for PolkaVM's multi-dimensional gas model
- Frontend automatically detects and adapts to PolkaVM networks

```javascript
// Network Configuration (hardhat.config.js)
networks: {
  passetHub: {
    polkavm: true,  // PolkaVM enabled
    url: "https://testnet-passet-hub-eth-rpc.polkadot.io",
    chainId: 420420422,
    accounts: [...],
    timeout: 120000,
  }
}

// PolkaVM Compiler Configuration
resolc: {
  compilerSource: 'npm',
  settings: {
    optimizer: {
      enabled: true,
      parameters: 'z',  // RISC-V optimizations
      fallbackOz: true,
      runs: 200,
    },
  },
}
```

### Features
- **Insurance Purchase**: Users buy policies by paying a premium (10% of coverage), e.g., 0.1 PAS for 1 PAS coverage.
- **Automated Payouts**: Payouts are triggered when the flood level exceeds configurable thresholds, sending coverage to the policyholder.
- **Real-Time Flood Data**: Backend server fetches live USGS water level data every 5 minutes and updates the blockchain oracle.
- **Role-Based Access**: Admins manage the contract, oracle updaters set flood levels, and insurance admins configure parameters.
- **Admin Dashboard**: Update threshold values and monitor active policies.

## 🚀 Quick Start: PolkaVM Deployment

### Prerequisites

- Node.js (v18+ or v23+)
- npm or yarn
- MetaMask or compatible Web3 wallet
- Git installed

### Deployment Options

1. **PolkaVM on Passet Hub Testnet** (recommended production deployment)
2. **Local PolkaVM Demo** (for development and testing)
3. **Standard EVM Mode** (legacy mode, only for comparison)

### Passet Hub Deployment Status

#### ✅ Ready for Both EVM and PolkaVM
- Smart contracts developed, tested, and PolkaVM-compatible
- Account funded on Passet Hub (4995+ PAS tokens)
- Deployment scripts for both EVM and PolkaVM ready
- All deprecated patterns fixed (e.g., `transfer()` → `call()`)
- Contract sizes verified within PolkaVM's 100KB limit

#### 🚀 Ready for Deployment

**For PolkaVM deployment (recommended):**
```powershell
npm run deploy-pvm-testnet
```

**For standard EVM deployment:**
```powershell
npx hardhat run scripts/deploy-passet.js --network passetHub
```

#### 📋 Verify Passet Hub Integration
```powershell
# Show Passet Hub configuration and readiness
node scripts/demonstrate-passet-hub.js

# Check funded account on Passet Hub
npx hardhat run scripts/check-passet-balance.js --network passetHub
```

### Quick Start: Local PolkaVM Demo Deployment

#### Prerequisites for Demo
- Node.js 18.x or 23.x installed
- MetaMask browser extension
- Git installed
- Three terminal windows available

#### Step-by-Step Deployment

##### Terminal 1: Start Local PolkaVM Node
```powershell
# Start local PolkaVM blockchain (keep this terminal open)
npx hardhat node
```
This starts a local PolkaVM node with Chain ID: 420420420

##### Terminal 2: Deploy Contracts
```powershell
# In a new terminal, deploy contracts to PolkaVM node
npx hardhat run scripts/deploy-simple-demo.js --network localNode
```

This script automatically:
- ✅ Deploys MockV3Aggregator (Oracle) and Paramify contracts
- ✅ Updates all configuration files (backend/.env, frontend/.env.local, frontend/src/lib/contract.ts)
- ✅ Grants oracle role to backend account
- ✅ Funds the oracle account with 10 ETH for gas
- ✅ Funds the Paramify contract with 100 ETH for insurance payouts
- ✅ Saves deployment info to demo-deployment.json

##### Terminal 3: Start Backend Server
```powershell
cd backend
npm start
```

The backend will:
- 🌊 Fetch real-time USGS flood data every 5 minutes
- 📡 Automatically update the blockchain oracle
- 🔄 Provide API endpoint at http://localhost:3001/api/flood-data

##### Terminal 4: Start Frontend
```powershell
cd frontend
npm run dev
```

Then open http://localhost:5173 in your browser.

#### MetaMask Configuration for PolkaVM

1. **Add Local PolkaVM Network**:
   - Network Name: `PolkaVM Local`
   - RPC URL: `http://localhost:8545`
   - Chain ID: `420420420`
   - Currency Symbol: `ETH`

2. **Import Test Accounts**:
   ```
   Account 0 (Admin/Deployer/Oracle):
   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   
   Account 1 (Test User):
   Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
   
   Account 2 (Test User):
   Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
   ```

Import any of these accounts into MetaMask by copying the private key.

### Important Configuration Details for PolkaVM

The deployment script automatically creates/updates these configuration files:

**`backend/.env`:**
```env
PARAMIFY_CONTRACT_ADDRESS=<deployed_address>
MOCK_AGGREGATOR_ADDRESS=<deployed_address>
PARAMIFY_ADDRESS=<deployed_address>
MOCK_ORACLE_ADDRESS=<deployed_address>
PORT=3001
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**Critical Note**: The `PRIVATE_KEY` must be the deployer's account (Account #0) for the admin dashboard to function properly, as the deployer has the admin role on the contract.

**`frontend/.env.local`:**
```env
VITE_PARAMIFY_CONTRACT_ADDRESS=<deployed_address>
VITE_MOCK_AGGREGATOR_ADDRESS=<deployed_address>
VITE_BACKEND_URL=http://localhost:3001
```

**`frontend/src/lib/contract.ts`:**
Contains the complete ABI, contract addresses, and utility functions for the frontend with PolkaVM-aware code.

## Alternative Deployment: Standard EVM Mode (Legacy)

If you prefer to use standard EVM mode instead of PolkaVM, follow these steps:

### Standard EVM Deployment Steps

#### 1. Install Dependencies

```powershell
npm install
cd frontend && npm install
cd ../backend && npm install
cd ..
```

#### 2. Start Hardhat Local Network (Standard EVM Mode)

```powershell
npx hardhat node
```

This will start a local blockchain at `http://127.0.0.1:8545` with pre-funded test accounts.

#### 3. Deploy Contracts and Configure Environment

```powershell
npx hardhat run scripts/deploy-simple-demo.js --network localhost
```

This command will:
- ✅ Deploy Mock Oracle to: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- ✅ Deploy Paramify Insurance Contract to: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`
- ✅ Grant oracle role to the deployer account
- ✅ Fund the contract with 50 ETH for payouts
- ✅ Update configuration files

#### 4. Start Backend and Frontend

```powershell
# Start backend
cd backend && npm start

# In a new terminal
cd frontend && npm run dev
```

#### 5. Configure MetaMask for Standard EVM Mode

**Network Settings:**
- Network Name: `Hardhat Local`
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`  # Note: Different from PolkaVM mode
- Currency Symbol: `ETH`

## Testing the Application (Both PolkaVM and EVM)

### 1. User Dashboard (Insurance Purchase)

1. Connect with a non-admin account (Account #1 or #2)
2. Enter a coverage amount (e.g., 1 PAS/ETH)
3. Click "Purchase Insurance" and confirm the transaction in MetaMask
4. View your active policy and monitor the current flood level

### 2. Admin Dashboard (Threshold Management)

1. Connect with the admin account (Account #0)
2. Navigate to the admin dashboard
3. View the current flood threshold
4. Update the threshold value as needed
5. Monitor active policies and contract balance

### 3. Testing Payouts

1. When flood levels exceed the threshold:
   - The dashboard will indicate the threshold has been crossed
   - The "Trigger Payout" button becomes available
2. Click "Trigger Payout" to receive your coverage amount
3. The policy will be marked as paid out

## Troubleshooting Guide

### PolkaVM-Specific Issues

#### PolkaVM Deployment Issues

**Problem**: Contracts fail to deploy to PolkaVM network.

**Solution**:
1. Verify PolkaVM is enabled in `hardhat.config.js`
2. Check that the compiler settings use RISC-V optimizations
3. Ensure contract size is under 100KB for PolkaVM compatibility
4. Use the correct RPC endpoint for Passet Hub (`https://testnet-passet-hub-eth-rpc.polkadot.io`)

#### PolkaVM Transaction Errors

**Problem**: Transactions fail with "Transaction is temporarily banned" error.

**Solution**:
1. Wait for Passet Hub to enable transactions (temporary restriction)
2. Ensure account has sufficient PAS tokens for gas
3. Check network configuration in `hardhat.config.js`
4. Verify the correct Chain ID is being used (420420422 for Passet Hub)

### Common Issues (Both PolkaVM and EVM)

#### Backend Port Conflict (Port 3001)

**Problem**: Backend server fails to start with a port already in use error.

**Solution**:
```powershell
# Find the process using port 3001
netstat -ano | findstr :3001

# Kill the process (replace PID with the actual process ID)
taskkill /F /PID <PID>

# Then restart the backend
cd backend
npm start
```

#### Frontend Showing White Screen

**Problem**: Frontend loads but shows a blank white screen.

**Solution**: Check for contract loading errors in the browser console.
1. Ensure `frontend/src/lib/contract.ts` has the correct contract addresses and exports
2. Verify the ABIs are properly imported
3. Make sure all imports/exports are correctly defined
4. Check that the frontend correctly detects PolkaVM vs. standard EVM mode
5. Restart the frontend development server

#### Admin Dashboard Not Updating Threshold

**Problem**: The threshold update function fails when called from the admin dashboard.

**Solution**: Ensure the backend is using the correct private key:
1. The backend must use the **deployer's private key** (Account #0) in `backend/.env`
2. Check that the PRIVATE_KEY value matches the admin account's private key
3. Verify network compatibility (PolkaVM vs. EVM)

#### Insurance Payout Not Working

**Problem**: Triggering a payout doesn't send funds to the policyholder.

**Solution**: Check the contract function names in the frontend:
1. Ensure the frontend is using `floodThreshold` (not `FLOOD_THRESHOLD`)
2. Verify the minimal ABI in `frontend/src/lib/minimal-abi.json` has the correct function definitions
3. Make sure the policy is active and the flood level is above the threshold
4. Check that the PolkaVM-specific code paths are being used correctly

#### MetaMask Connection Issues

**Problem**: MetaMask not connecting to the network.

**Solution**:
1. Verify node is running (Hardhat or PolkaVM)
2. Check network settings in MetaMask (Chain ID: 31337 for EVM, 420420420 for local PolkaVM, 420420422 for Passet Hub)
3. Reset MetaMask account: Settings → Advanced → Reset Account

#### USGS Data Not Updating

**Problem**: Flood level data doesn't update.

**Solution**:
1. Check backend console for API connection errors
2. Verify internet connectivity for USGS API access
3. Restart the backend server

## Developer Notes

### Important Details for PolkaVM Development

#### 1. PolkaVM Configuration

- **Compiler Settings**: The project uses `resolc` compiler for RISC-V bytecode generation
- **Gas Model**: PolkaVM uses a multi-dimensional gas model different from standard EVM
- **Contract Size Limit**: PolkaVM has a 100KB limit for contract size
- **Deprecated Patterns**: All EVM-specific patterns like `transfer()` have been replaced with PolkaVM-compatible alternatives like `call()`

#### 2. Contract Addresses and ABIs

- The contract addresses are automatically updated in configuration files by the deployment script
- ABIs are stored in:
  - `paramify-abi.json` (main contract)
  - `mock-aggregator-abi.json` (oracle)
  - `frontend/src/lib/minimal-abi.json` (simplified ABI for frontend)

#### 3. Account Roles

- **Admin/Deployer** (Account #0): Has admin access to the contract and must be used for:
  - The backend oracle updates (set in `backend/.env`)
  - Admin dashboard operations
  - Contract administration

#### 4. Frontend Implementation Notes for PolkaVM

- Frontend automatically detects and adapts to PolkaVM networks
- Contract interactions are abstracted in `frontend/src/lib/contract.ts`
- The `isPolkaVMNetwork()` function checks if the connected network is PolkaVM
- Special considerations for PolkaVM transaction format are handled transparently
- Threshold values are accessed via `floodThreshold()` (not `FLOOD_THRESHOLD`)
- The minimal ABI in `frontend/src/lib/minimal-abi.json` is used for simplified contract interactions

#### 5. Backend Implementation Notes

- Backend uses Express.js to serve API endpoints and update the oracle
- USGS API integration fetches real-time flood data
- The backend must use the admin/deployer account private key to update thresholds
- Backend has been tested with both PolkaVM and standard EVM networks

#### 6. PowerShell-Specific Commands

When working on Windows with PowerShell:
- Use PowerShell-specific syntax for process management:
  ```powershell
  netstat -ano | findstr :3001
  taskkill /F /PID <PID>
  ```
- For running multiple commands:
  ```powershell
  cd backend; npm start
  ```

## Project Structure

```
Paramify/
├── contracts/
│   ├── Paramify.sol              # Main insurance contract (PolkaVM-compatible)
│   └── mocks/
│       └── MockV3Aggregator.sol  # Oracle for USGS data (PolkaVM-compatible)
├── backend/
│   ├── server.js                 # Node.js backend with USGS integration
│   ├── package.json              # Backend dependencies
│   └── .env                      # Contract addresses and admin private key
├── frontend/
│   ├── src/                      # React frontend source
│   │   ├── InsuracleDashboard.tsx      # Policy holder interface
│   │   ├── InsuracleDashboardAdmin.tsx # Admin interface
│   │   └── lib/
│   │       ├── contract.ts       # Contract integration with PolkaVM support
│   │       ├── minimal-abi.json  # Simplified ABI for frontend
│   │       └── usgsApi.ts        # USGS data integration
│   ├── package.json              # Frontend dependencies
│   └── .env.local                # Frontend configuration
├── scripts/
│   ├── deploy-pvm-testnet.js     # PolkaVM deployment to Passet Hub
│   ├── deploy-simple-demo.js     # Local deployment script
│   ├── deploy-passet.js          # Passet Hub EVM deployment
│   ├── check-passet-balance.js   # Verify Passet Hub funding
│   └── verify-pvm-deployment.js  # PolkaVM deployment verification
├── test/
│   └── Paramify.js               # Contract tests
├── hardhat.config.js             # Hardhat configuration with PolkaVM settings
├── paramify-abi.json             # Full contract ABI
├── mock-aggregator-abi.json      # Oracle ABI
├── POLKAVM_MIGRATION_STATUS.md   # PolkaVM migration documentation
├── PASSET_HUB_PROOF_OF_CONCEPT.md # Detailed Polkadot documentation
└── README.md                     # This file
```

## Docker Deployment

For a containerized deployment:

```powershell
# Build and run with Docker Compose
docker-compose up

# Or run individually:
# 1. Start PolkaVM node
docker run -p 8545:8545 paramify-polkavm

# 2. Deploy contracts
docker run --network host paramify-deploy-pvm

# 3. Start backend
docker run -p 3001:3001 paramify-backend

# 4. Start frontend
docker run -p 5173:5173 paramify-frontend
```

## Technical Stack

- **Blockchain**: Passet Hub (Polkadot Parachain) with PolkaVM support
- **Smart Contracts**: Solidity 0.8.26 (PolkaVM compatible)
- **PolkaVM Compiler**: resolc (RISC-V target)
- **Backend**: Node.js/Express with USGS API
- **Frontend**: React/TypeScript with Vite (PolkaVM-aware)
- **Testing**: Hardhat with Chai
- **Oracle**: Chainlink-compatible interface

## License

MIT License.

---

*Developed as a proof of concept for Polkadot's Passet Hub parachain with PolkaVM.*
