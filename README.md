# Paramify: Decentralized Flood Insurance

![alt text](image.png)

## Overview

**Paramify** is a decentralized flood insurance platform built to demonstrate how automated insurance purchases and payouts can work on a blockchain network, using real-time flood level data from USGS integrated through a Chainlink-compatible oracle.

### Features

- **Insurance Purchase**: Users buy policies by paying a premium (10% of coverage), e.g., 0.1 ETH for 1 ETH coverage.
- **Automated Payouts**: Payouts are triggered when the flood level exceeds configurable thresholds, sending coverage to the policyholder.
- **Real-Time Flood Data**: Backend server fetches live USGS water level data every 5 minutes and updates the blockchain oracle.
- **Role-Based Access**: Admins manage the contract, oracle updaters set flood levels, and insurance admins configure parameters.
- **Admin Dashboard**: Update threshold values and monitor active policies.

## 🚀 Quick Start: Local Development

### Prerequisites

- Node.js (v18+ or v23+)
- npm or yarn
- MetaMask or compatible Web3 wallet

### Step-by-Step Local Deployment

#### 1. Install Dependencies

```powershell
npm install
cd frontend && npm install
cd ../backend && npm install
cd ..
```

#### 2. Start Hardhat Local Network

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
- ✅ Grant oracle role to the deployer account: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- ✅ Fund the contract with 50 ETH for payouts
- ✅ Update configuration files with contract addresses and account information

#### 4. Start Backend Server

```powershell
cd backend
npm start
```

Backend will start at `http://localhost:3001` and begin fetching USGS flood data every 5 minutes.

#### 5. Start Frontend Development Server

```powershell
cd frontend
npm run dev
```
Frontend will start at `http://localhost:5173` (Vite's default port)

#### 6. Configure MetaMask

**Network Settings:**
- Network Name: `Hardhat Local`
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency Symbol: `ETH`

**Test Accounts (with private keys):**
```
Account #0 (Admin/Deployer/Oracle):
Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1 (Test User):
Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

Account #2 (Test User):
Address: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
```

Import any of these accounts into MetaMask by copying the private key.

#### 7. Access the Application
Open your browser and navigate to `http://localhost:5173`

### Important Configuration Details

The deployment script automatically creates/updates these configuration files:

**`backend/.env`:**
```env
PARAMIFY_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
MOCK_AGGREGATOR_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
PARAMIFY_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
MOCK_ORACLE_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
PORT=3001
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**Critical Note**: The `PRIVATE_KEY` must be the deployer's account (Account #0) for the admin dashboard to function properly, as the deployer has the admin role on the contract.

**`frontend/.env.local`:**
```env
VITE_PARAMIFY_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
VITE_MOCK_AGGREGATOR_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_BACKEND_URL=http://localhost:3001
```

**`frontend/src/lib/contract.ts`:**
Contains the complete ABI, contract addresses, and utility functions for the frontend.

## Testing the Application

### 1. User Dashboard (Insurance Purchase)

1. Connect with a non-admin account (Account #1 or #2)
2. Enter a coverage amount (e.g., 1 ETH)
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

### Common Issues and Solutions

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
4. Restart the frontend development server

#### Admin Dashboard Not Updating Threshold

**Problem**: The threshold update function fails when called from the admin dashboard.

**Solution**: Ensure the backend is using the correct private key:
1. The backend must use the **deployer's private key** (Account #0) in `backend/.env`
2. Check that the PRIVATE_KEY value matches the admin account's private key

#### Insurance Payout Not Working

**Problem**: Triggering a payout doesn't send funds to the policyholder.

**Solution**: Check the contract function names in the frontend:
1. Ensure the frontend is using `floodThreshold` (not `FLOOD_THRESHOLD`)
2. Verify the minimal ABI in `frontend/src/lib/minimal-abi.json` has the correct function definitions
3. Make sure the policy is active and the flood level is above the threshold

#### MetaMask Connection Issues

**Problem**: MetaMask not connecting to the local network.

**Solution**:
1. Verify Hardhat node is running
2. Check network settings in MetaMask (Chain ID: 31337)
3. Reset MetaMask account: Settings → Advanced → Reset Account

#### USGS Data Not Updating

**Problem**: Flood level data doesn't update.

**Solution**:
1. Check backend console for API connection errors
2. Verify internet connectivity for USGS API access
3. Restart the backend server

## Developer Notes

### Important Details for Future Development

#### 1. Contract Addresses and ABIs

- The contract addresses are automatically updated in configuration files by the deployment script
- ABIs are stored in:
  - `paramify-abi.json` (main contract)
  - `mock-aggregator-abi.json` (oracle)
  - `frontend/src/lib/minimal-abi.json` (simplified ABI for frontend)

#### 2. Account Roles

- **Admin/Deployer** (Account #0): Has admin access to the contract and must be used for:
  - The backend oracle updates (set in `backend/.env`)
  - Admin dashboard operations
  - Contract administration

#### 3. Frontend Implementation Notes

- Frontend uses React with Vite, TypeScript, and ethers.js
- Contract interactions are abstracted in `frontend/src/lib/contract.ts`
- Threshold values are accessed via `floodThreshold()` (not `FLOOD_THRESHOLD`)
- The minimal ABI in `frontend/src/lib/minimal-abi.json` is used for simplified contract interactions

#### 4. Backend Implementation Notes

- Backend uses Express.js to serve API endpoints and update the oracle
- USGS API integration fetches real-time flood data
- The backend must use the admin/deployer account private key to update thresholds

#### 5. PowerShell-Specific Commands

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
│   ├── Paramify.sol              # Main insurance contract
│   └── mocks/
│       └── MockV3Aggregator.sol  # Oracle for USGS data
├── backend/
│   ├── server.js                 # Node.js backend with USGS integration
│   ├── package.json              # Backend dependencies
│   └── .env                      # Contract addresses and admin private key
├── frontend/
│   ├── src/                      # React frontend source
│   │   ├── InsuracleDashboard.tsx      # Policy holder interface
│   │   ├── InsuracleDashboardAdmin.tsx # Admin interface
│   │   └── lib/
│   │       ├── contract.ts       # Contract integration
│   │       ├── minimal-abi.json  # Simplified ABI for frontend
│   │       └── usgsApi.ts        # USGS data integration
│   ├── package.json              # Frontend dependencies
│   └── .env.local                # Frontend configuration
├── scripts/
│   ├── deploy-simple-demo.js     # Local deployment script
│   └── various utility scripts   # Other deployment and testing scripts
├── test/
│   └── Paramify.js               # Contract tests
├── hardhat.config.js             # Hardhat configuration
├── paramify-abi.json             # Full contract ABI
├── mock-aggregator-abi.json      # Oracle ABI
└── README.md                     # This file
```

## License

MIT License.

---

*Paramify: Decentralized Flood Insurance Platform*
