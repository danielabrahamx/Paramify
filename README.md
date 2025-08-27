# 🌊 Paramify - Flood Insurance dApp

A hybrid decentralized insurance platform with **Ethereum smart contracts** for blockchain settlement and **Node.js backend** for real-time USGS flood data integration. Features a beautiful React frontend with modern UI components.

## 🏗️ Architecture Overview

### Current Implementation
- **Ethereum Smart Contracts**: Core insurance logic and blockchain settlement (✅ Working)
- **Node.js Backend API**: USGS flood data integration and API gateway (✅ Working)  
- **React Frontend**: Modern UI with shadcn components and real-time monitoring (✅ Working)
- **ICP Canister (paramify_data)**: Backend-only data storage and activity tracking (✅ Working)

### Components

| Component | Status | Technology | Purpose |
|-----------|---------|------------|---------|
| **Smart Contracts** | ✅ Working | Solidity (Hardhat) | Core insurance logic and blockchain settlement |
| **Backend API** | ✅ Working | Node.js/Express | USGS flood data integration and API gateway |
| **Frontend** | ✅ Working | React/TypeScript | Beautiful UI with real-time flood monitoring |
| **ICP Canister** | ✅ Working | Motoko | `paramify_data`: data storage, activity tracking, simple policy ledger |

## 📋 Prerequisites

- **Node.js** 18+ and **npm**
- **Hardhat** for smart contract deployment
- **MetaMask** or compatible Web3 wallet
- **Git** for cloning repositories
- **WSL** (optional, for ICP development)

## 🚀 Quick Start Guide

### Step 1: Install Dependencies
```bash
# Install main project dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install backend dependencies  
cd backend && npm install && cd ..
```

### Step 2: Deploy Smart Contracts

**Option A: Local Testing (Recommended)**
```bash
# Terminal 1: Start local Hardhat node
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat run scripts/deploy.js --network localhost
```

**Option B: Deploy to PassetHub Testnet**
```bash
npx hardhat run scripts/deploy.js --network passthrough
```

### Step 3: Start Backend API
```bash
cd backend
npm start
```
The backend will run on `http://localhost:3001` and provide USGS flood data integration.

### Step 4: Start Frontend Development
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173` with hot reload for development.

## 🌐 Access Your dApp

**Frontend Application:**
```
http://localhost:5173
```

**Backend API Endpoints:**
- Health Check: `http://localhost:3001/api/health`
- Flood Data: `http://localhost:3001/api/flood-data`
- Service Status: `http://localhost:3001/api/status`
- Manual Update: `http://localhost:3001/api/manual-update`

## 🧪 Testing Your dApp

### Test Smart Contracts
```bash
# Run comprehensive test suite
npx hardhat test

# Test specific contracts
npx hardhat test test/Paramify.js
```

### Test Backend API
```bash
# Health check
curl http://localhost:3001/api/health

# Get flood data  
curl http://localhost:3001/api/flood-data

# Get service status
curl http://localhost:3001/api/status

# Trigger manual update
curl -X POST http://localhost:3001/api/manual-update
```

### Test Frontend
1. Open `http://localhost:5173` in your browser
2. Connect your MetaMask wallet
3. Choose "Individual" or "Company" portal
4. Test insurance purchase and monitoring features

## 🏛️ How It Works

### Data Flow Architecture  
```
🌐 USGS API → Backend API → Frontend ↔ Smart Contracts (Ethereum)
                    ↓                        ↓
              ICP canister (data)        Settlement & Logic
```

### Key Features

1. **Real Flood Data**: Backend API fetches live data from USGS flood monitoring stations
2. **Smart Contract Insurance**: Ethereum-based policies with automated claim processing  
3. **Modern UI**: Beautiful React dashboard with real-time flood monitoring
4. **Data Canister**: Durable storage of flood readings, activities, and simple policies
5. **Development Ready**: Hot reload, proper error handling, and developer tools

### Security Architecture
- **Smart Contracts**: Secure, tested Solidity contracts on Ethereum
- **Backend API**: Clean separation between data sources and frontend
- **ICP Data Canister**: Access-controlled writes, append-only patterns, upgrade-safe storage
- **Data Integrity**: Real-time USGS data with error handling and validation

## 📦 Paramify Data Canister (ICP)

- **Name**: `paramify_data`
- **Purpose**: Minimal, focused backend component for:
  - **Flood readings storage** (timestamped level, location, source)
  - **User activity tracking** (who did what and when)
  - **Simple policy ledger** (create, update status, fetch by user)
- **Why it’s useful**:
  - Decouples data storage from the USGS integration logic
  - Low-latency reads and writes, upgrade-safe stable storage
  - Provides an audit trail and analytics (`getStats`) without changing your USGS integration

### Public Interface (key methods)
- `recordFloodData(level: float64, location: text, source: text) -> Result<(), text>`
- `getFloodData(limit: opt nat) -> [record { timestamp; level; location; source }]`
- `getLatestFloodLevel() -> opt float64`
- `recordActivity(action: text, metadata: text) -> Result<(), text>`
- `getUserActivities(user: principal, limit: opt nat) -> [record { ... }]`
- `createPolicy(coverage: nat, premium: nat, durationDays: nat) -> Result<principal, text>`
- `updatePolicyStatus(policyId: principal, newStatus: text) -> Result<(), text>`
- `getPolicy(policyId: principal) -> opt PolicyData`
- `getUserPolicies(user: principal) -> [PolicyData]`
- `getStats() -> record { totalFloodRecords; totalActivities; totalPolicies; activePolicies }`

### Example Commands
```bash
# Start a clean local replica
wsl
dfx stop || true
dfx start --background --clean

# Build and deploy
cd /mnt/c/Users/danie/Paramify-6
dfx deploy paramify_data

# Record a flood datapoint (also bootstraps caller as admin)
dfx canister call paramify_data recordFloodData '(12.5:float64, "Washington DC", "USGS")'

# Read data and stats
dfx canister call paramify_data getLatestFloodLevel
dfx canister call paramify_data getFloodData '(opt 10)'
dfx canister call paramify_data getStats

# Activity and policies
dfx identity get-principal
dfx canister call paramify_data recordActivity '("view_dashboard", "initial load")'
dfx canister call paramify_data createPolicy '(1000:nat, 100:nat, 30:nat)'
dfx canister call paramify_data updatePolicyStatus '(<PASTE_PRINCIPAL>, "expired")'
```

## 🔧 Troubleshooting

### Common Issues & Solutions

**1. Backend API Connection Failed**
- **Problem**: Frontend can't connect to backend on port 3001
- **Solution**: Ensure backend is running with `npm start` in backend directory

**2. Smart Contract Deployment Fails**
- **Problem**: Hardhat network configuration issues
- **Solution**: Check hardhat.config.js and ensure Hardhat node is running

**3. MetaMask Connection Issues**
- **Problem**: Wallet won't connect or wrong network
- **Solution**: Switch to localhost:8545 network or configure testnet properly

**4. USGS Data Not Loading**
- **Problem**: External API calls failing
- **Solution**: Check backend logs and ensure internet connectivity

**5. Canister Call Fails (IC0304 / no Wasm)**
- **Solution**: `dfx start --background --clean && dfx deploy paramify_data`

### Useful Commands

```bash
# Test smart contracts
npx hardhat test
npx hardhat run scripts/check-account-balance.js --network localhost

# Check backend API
curl http://localhost:3001/api/health
cd backend && npm run dev  # Development mode with auto-restart

# Frontend development
cd frontend && npm run dev   # Development server
cd frontend && npm run build # Production build

# ICP canister
wsl
dfx canister status --all
dfx canister call paramify_data getStats
```

### Development Notes

**Recommended Development Flow:**
1. Start Hardhat node: `npx hardhat node`
2. Deploy contracts: `npx hardhat run scripts/deploy.js --network localhost`
3. Start backend: `cd backend && npm start`
4. Start frontend: `cd frontend && npm run dev`
5. Use IC canister for storage and activity: `dfx deploy paramify_data`

## 🏛️ Smart Contract Functions (Ethereum)

### Paramify Contract
- `buyInsurance(uint256 coverage)`: Purchase insurance policy
- `triggerPayout()`: Claim payout if flood conditions met
- `getLatestPrice()`: Get current flood level from oracle
- `setInsuranceAmount(uint256)`: Admin function to set coverage amounts

## 🧰 ICP Canister Functions

### paramify_data
- `recordFloodData(level: float64, location: text, source: text)`
- `getFloodData(limit: opt nat)`
- `getLatestFloodLevel()`
- `recordActivity(action: text, metadata: text)`
- `getUserActivities(user: principal, limit: opt nat)`
- `createPolicy(coverage: nat, premium: nat, durationDays: nat)`
- `updatePolicyStatus(policyId: principal, newStatus: text)`
- `getPolicy(policyId: principal)`
- `getUserPolicies(user: principal)`
- `getStats()`

## 🚀 Advanced Configuration

### Environment Variables

**Frontend (.env.local):**
```env
VITE_ICP_HOST=http://127.0.0.1:4943
# Optionally, expose the canister id if the frontend will call it directly
# VITE_PARAMIFY_DATA_CANISTER_ID=<paramify_data_canister_id>
```

**Backend (.env):**
```env
PORT=3001
ICP_HOST=http://127.0.0.1:4943
```

### Network Configuration

**Hardhat Networks (hardhat.config.js):**
```javascript
networks: {
  localhost: { url: "http://127.0.0.1:8545" },
  passthrough: {
    url: process.env.RPC_URL,
    chainId: 420420422, // PassetHub testnet
    accounts: [process.env.PRIVATE_KEY],
    gasPrice: 1000000000,
    gas: 5000000
  }
}
```

## 📈 Performance & Scaling

- **ICP Canister**: Handles high-frequency reads/writes with low latency
- **Ethereum**: Provides settlement security and finality
- **Backend**: Resilient to transient USGS/API failures with retries
- **Frontend**: Optimized React with Vite for fast loading

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Test** thoroughly (both ICP and Ethereum components)
4. **Document** any new configuration requirements
5. **Submit** a pull request

## 📄 License

MIT

---

## 🎯 What Makes This Special

This dApp demonstrates a **production-ready hybrid architecture** that combines:
- **ICP's speed and web integration** for data + activity storage
- **Ethereum's security** for financial settlement
- **Real-world data integration** with live USGS monitoring
- **Modern development practices** with automated deployment

**Result**: A functional flood insurance platform with real data, a focused data canister, and a beautiful UI! 🌊

## Development

### Building Canisters
```bash
dfx build
```

### Testing Canisters
```bash
dfx test
```

### Frontend Development
```bash
cd frontend
npm run dev
```

## Configuration

The `dfx.json` file configures:
- Canister types and entry points
- Build commands for frontend
- Network settings

## Troubleshooting

### Common Issues
1. **dfx not found**: Ensure dfx is installed and in PATH
2. **Build failures**: Check frontend dependencies are installed
3. **Canister deployment errors**: Verify local replica is running

### Useful Commands
```bash
dfx canister status --all          # Check canister status
dfx canister info paramify_data    # Get canister details
dfx stop                           # Stop local replica
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request


