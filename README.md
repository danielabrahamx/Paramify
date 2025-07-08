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
- **Frontend Interface**: A React-based UI allows users to connect wallets, buy insurance, view flood levels, and trigger payouts.
- **Backend API**: Node.js server provides real-time flood data integration with automatic oracle updates.

## Prerequisites

- **Node.js**: Version 18.x or 23.x (tested with 23.9.0).
- **MetaMask**: Browser extension for wallet interactions.
- **Git**: To clone the repository.
- **Hardhat**: For contract deployment and testing.

## Passet Hub Deployment Status

### ✅ Ready for Both EVM and PolkaVM
- Smart contracts developed, tested, and PolkaVM-compatible
- Account funded on Passet Hub (4995+ PAS tokens)
- Deployment scripts for both EVM and PolkaVM ready
- All deprecated patterns fixed (e.g., `transfer()` → `call()`)
- Contract sizes verified within PolkaVM's 100KB limit

### ⚠️ Temporary Network Restriction
Passet Hub testnet currently shows "Transaction is temporarily banned" error. Once resolved:

**For PolkaVM deployment (recommended):**
```bash
npm run deploy-pvm-testnet
```

**For standard EVM deployment:**
```bash
npx hardhat run scripts/deploy-passet.js --network passetHub
```

### 📋 Verify Passet Hub Integration
```bash
# Show Passet Hub configuration and readiness
node scripts/demonstrate-passet-hub.js

# Check funded account on Passet Hub
npx hardhat run scripts/check-passet-balance.js --network passetHub
```

## Quick Start: Local PolkaVM Demo Deployment

### Prerequisites for Demo
- Node.js 18.x or 23.x installed
- MetaMask browser extension
- Git installed
- Three terminal windows available

### Step-by-Step Deployment

#### Terminal 1: Start Local PolkaVM Node
```bash
# Start local PolkaVM blockchain (keep this terminal open)
npx hardhat node
```
This starts a local PolkaVM node with Chain ID: 420420420

#### Terminal 2: Deploy Contracts
```bash
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

#### Terminal 3: Start Backend Server
```bash
cd backend
npm start
```

The backend will:
- 🌊 Fetch real-time USGS flood data every 5 minutes
- 📡 Automatically update the blockchain oracle
- 🔄 Provide API endpoint at http://localhost:3001/api/flood-data

#### Terminal 4: Start Frontend
```bash
cd frontend
npm run dev
```

Then open http://localhost:8080 in your browser.

### MetaMask Configuration

1. **Add Local PolkaVM Network**:
   - Network Name: `PolkaVM Local`
   - RPC URL: `http://localhost:8545`
   - Chain ID: `420420420`
   - Currency Symbol: `ETH`

2. **Import Test Accounts**:
   ```
   Account 0 (Admin/Deployer):
   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   
   Account 1 (Oracle/Backend):
   Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
   
   Account 2 (Customer):
   Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
   
   Account 3 (Customer):
   Private Key: 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6
   ```

### Demo Walkthrough

#### 1. Admin Operations (Account 0)
- Navigate to Admin Dashboard
- View current flood level (updates every 5 minutes)
- Adjust flood threshold if needed
- Monitor contract balance and active policies

#### 2. Buy Insurance (Account 2 or 3)
- Connect wallet as customer
- Enter coverage amount (e.g., 1 ETH)
- Pay 10% premium (0.1 ETH)
- Confirm transaction

#### 3. Monitor Flood Levels
- Watch real-time USGS data updates
- See threshold indicators
- Backend terminal shows update logs

#### 4. Trigger Payout
- When flood level exceeds threshold
- Click "Trigger Payout" button
- Receive full coverage amount
- Policy marked as paid out

### Docker Deployment (Alternative)

For a containerized deployment:

```bash
# Build and run with Docker Compose
docker-compose up

# Or run individually:
# 1. Start Hardhat node
docker run -p 8545:8545 paramify-hardhat

# 2. Deploy contracts
docker run --network host paramify-deploy

# 3. Start backend
docker run -p 3001:3001 paramify-backend

# 4. Start frontend
docker run -p 5173:5173 paramify-frontend
```

### Troubleshooting

**Hardhat node not running:**
```bash
Error: Could not connect to localhost:8545
Solution: Ensure npx hardhat node is running in Terminal 1
```

**Contract deployment fails:**
```bash
Error: Insufficient funds
Solution: Restart hardhat node to reset accounts
```

**Backend can't update oracle:**
```bash
Error: Transaction failed
Solution: Check backend account has sufficient ETH (should have 10 ETH)
```

**Frontend can't connect:**
```bash
Error: Network mismatch
Solution: Ensure MetaMask is connected to localhost:8545 (Chain ID: 31337)
```

**Port conflicts:**
```bash
Error: Port already in use
Solution: 
- Backend: Change PORT in backend/.env
- Frontend: Change port in frontend/vite.config.ts
```

### Environment Variables

The deployment script automatically configures:

**backend/.env:**
```
PARAMIFY_CONTRACT_ADDRESS=<deployed_address>
MOCK_AGGREGATOR_ADDRESS=<deployed_address>
PORT=3001
```

**frontend/.env.local:**
```
VITE_PARAMIFY_CONTRACT_ADDRESS=<deployed_address>
VITE_MOCK_AGGREGATOR_ADDRESS=<deployed_address>
VITE_BACKEND_URL=http://localhost:3001
```

### Key Features in Demo

- **Real-time Data**: Live USGS flood level updates every 5 minutes
- **Automated Oracle**: Backend automatically updates blockchain with new data
- **Role-Based Access**: Admin, Oracle Updater, and Customer roles
- **Insurance Flow**: Buy policy → Monitor levels → Automatic payout
- **Contract Funding**: Pre-funded with 100 ETH for demo payouts

## Installation

### 1. Clone and Install
```bash
git clone https://github.com/danielabrahamx/Paramify.git
cd Paramify-1
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. Environment Setup
The project includes pre-configured `.env` files for both backend and frontend. These will be automatically updated when you deploy contracts.

## Deployment Instructions

### For Passet Hub (Production)
```bash
# When Passet Hub enables contract deployment
npx hardhat run scripts/deploy-passet.js --network passetHub
```

### For Local Demo
```bash
# Run the demo deployment script
npx hardhat run scripts/deploy-for-demo.js
```

This script:
- Deploys contracts to local Hardhat network
- Updates all configuration files automatically
- Provides instructions for running the full system

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
│   └── .env                      # Contract addresses (auto-updated)
├── frontend/
│   ├── src/                      # React frontend source
│   │   ├── InsuracleDashboard.tsx      # Policy holder interface
│   │   ├── InsuracleDashboardAdmin.tsx # Admin interface
│   │   └── lib/
│   │       ├── contract.ts       # Contract addresses (auto-updated)
│   │       ├── contract-pvm.ts   # PolkaVM contract addresses
│   │       └── usgsApi.ts        # USGS data integration
│   ├── package.json              # Frontend dependencies
│   └── .env                      # Frontend config (auto-updated)
├── scripts/
│   ├── deploy-passet.js          # Passet Hub EVM deployment
│   ├── deploy-passet-pvm.js      # Passet Hub PolkaVM deployment
│   ├── verify-pvm-deployment.js  # PolkaVM deployment verification
│   ├── deploy-for-demo.js        # Local demo deployment
│   ├── demonstrate-passet-hub.js # Show Passet Hub readiness
│   └── check-passet-balance.js   # Verify Passet Hub funding
├── test/
│   └── Paramify.test.js          # Unit tests
├── hardhat.config.js             # Network configurations with PolkaVM
├── POLKAVM_MIGRATION_STATUS.md   # PolkaVM migration documentation
├── PASSET_HUB_PROOF_OF_CONCEPT.md # Detailed Polkadot documentation
└── README.md                     # This file
```

## Live Flood Data Monitoring

The Paramify system includes real-time flood level monitoring from USGS:

- **Backend Terminal**: Shows timestamped flood level updates every 5 minutes
- **Frontend Dashboard**: Displays current flood levels with automatic updates
- **API Endpoint**: Access flood data at `http://localhost:3001/api/flood-data`
- **Blockchain Oracle**: Automatically updated with scaled flood values

## Demo Instructions

### 1. Buy Insurance
- Connect MetaMask as a customer account
- Enter coverage amount (e.g., 1 ETH/PAS)
- Pay 10% premium (0.1 ETH/PAS)
- Confirm transaction

### 2. Monitor Flood Levels
- View real-time USGS data on dashboard
- Backend updates oracle every 5 minutes
- Threshold indicators show payout triggers

### 3. Trigger Payout
- When flood level exceeds threshold
- Click "Trigger Payout" 
- Receive full coverage amount
- Policy marked as paid out

## Testing

Run comprehensive unit tests:
```bash
npx hardhat test
```

Tests cover:
- Policy creation and validation
- Payout triggering with thresholds
- Role-based access control
- Contract funding and withdrawal
- USGS data integration

## Security

- **Smart Contracts**: Built with OpenZeppelin security standards
- **Access Control**: Multi-role permission system
- **Oracle Security**: Restricted update permissions
- **Frontend**: Secure wallet connections

## Technical Stack

- **Blockchain**: Passet Hub (Polkadot Parachain) with PolkaVM support
- **Smart Contracts**: Solidity 0.8.26 (PolkaVM compatible)
- **PolkaVM Compiler**: resolc (RISC-V target)
- **Backend**: Node.js/Express with USGS API
- **Frontend**: React/TypeScript with Vite (PolkaVM-aware)
- **Testing**: Hardhat with Chai
- **Oracle**: Chainlink-compatible interface

## Future Enhancements

- **Production Oracle**: Replace mock with real Chainlink oracle
- **Multi-Policy Support**: Allow multiple active policies
- **Risk Zones**: Location-based premium calculations
- **Cross-Chain**: Deploy on multiple Polkadot parachains

## Troubleshooting

- **Passet Hub Connection**: Ensure RPC endpoint is accessible
- **Contract Deployment**: Wait for Passet Hub EVM activation
- **MetaMask**: Use Chain ID 420420422 for Passet Hub
- **Backend**: Check port 3001 availability
- **Frontend**: Verify port 5173 is free

## Support

For Passet Hub deployment support:
- Network: https://testnet-passet-hub-eth-rpc.polkadot.io
- Chain ID: 420420422
- Documentation: See PASSET_HUB_PROOF_OF_CONCEPT.md

## License

MIT License. See [LICENSE](./LICENSE) for details.

---

*Developed as a proof of concept for Polkadot's Passet Hub parachain.*
