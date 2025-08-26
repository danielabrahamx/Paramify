# 🌊 Paramify - Flood Insurance dApp

A hybrid decentralized insurance application combining **Internet Computer (ICP)** canisters with **Ethereum** smart contracts for flood insurance with real-time USGS flood data integration.

## 🏗️ Architecture Overview

### Hybrid Architecture (ICP + Ethereum)
- **ICP Canisters**: Handle insurance logic, policy management, and external API calls
- **Ethereum Smart Contracts**: Provide blockchain settlement and oracle data verification
- **Backend API**: Bridges frontend with ICP canisters using proper Candid interface
- **Frontend**: React application with beautiful UI and real-time flood monitoring

### Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| **paramify_core** | ICP Motoko | Insurance policy management, payouts |
| **paramify_oracle** | ICP Motoko | Fetch USGS flood data, update core canister |
| **Backend API** | Node.js/Express | REST API for frontend ↔ ICP communication |
| **Frontend** | React/TypeScript | User interface and flood monitoring dashboard |
| **Smart Contracts** | Solidity (Hardhat) | Ethereum integration for settlement |

## 📋 Prerequisites

- **Windows + WSL** or **Ubuntu Linux** (required for dfx)
- **Node.js** 18+ and **npm**
- **dfx** (Internet Computer SDK) 0.18.0+
- **Hardhat** for smart contract deployment
- **Git** for cloning repositories

## 🚀 Complete Deployment Guide

### Phase 1: Environment Setup

**1. Install Internet Computer SDK (in WSL):**
```bash
# In WSL terminal
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
dfx --version  # Should show 0.18.0+
```

**2. Install Node.js dependencies:**
```bash
# Main project dependencies
npm install

# Frontend dependencies
cd frontend
npm install
cd ..

# Backend dependencies
cd backend
npm install
cd ..
```

### Phase 2: Deploy Smart Contracts

**Option A: Deploy to PassetHub Testnet**
```powershell
# In PowerShell (Windows)
npx hardhat run scripts/deploy.js --network passthrough
```

**Option B: Deploy to Local Hardhat Network (for testing)**
```powershell
# Terminal 1: Start local Hardhat node
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat run scripts/deploy.js --network localhost
```

### Phase 3: Deploy ICP Canisters

**1. Start ICP Local Replica:**
```bash
# In WSL
dfx start --background --clean
sleep 10  # Wait for replica to start
```

**2. Deploy Canisters:**
```bash
# Deploy all canisters
dfx deploy

# Get canister IDs
CORE_ID=$(dfx canister id paramify_core)
ORACLE_ID=$(dfx canister id paramify_oracle)
```

**3. Configure Canister Integration:**
```bash
# Set oracle-core connection
dfx canister call paramify_oracle setCoreCanister "(principal \"$CORE_ID\")"
dfx canister call paramify_core setOracleUpdater "(principal \"$ORACLE_ID\")"

# Set flood threshold (12 feet)
dfx canister call paramify_core setFloodThreshold "(1200000000000:nat)"
```

### Phase 4: Configure Frontend Environment

**Create environment configuration:**
```bash
# Set up frontend environment variables
cat > frontend/.env.local << EOF
VITE_PARAMIFY_CORE_CANISTER_ID=$CORE_ID
VITE_PARAMIFY_ORACLE_CANISTER_ID=$ORACLE_ID
VITE_ICP_HOST=http://127.0.0.1:4943
VITE_INTERNET_IDENTITY_URL=https://identity.ic0.app
EOF
```

**Build and deploy frontend:**
```bash
cd frontend
npm run build
cd ..
dfx deploy paramify_frontend
```

### Phase 5: Start Backend API Server

**Start the bridge server:**
```bash
# In WSL
cd backend
npm start
```
The backend API will run on `http://localhost:3001`

## 🌐 Access Your dApp

**Frontend Application:**
```
http://127.0.0.1:4943/?canisterId=<FRONTEND_CANISTER_ID>
```

**API Endpoints:**
- Health Check: `http://localhost:3001/api/health`
- Flood Data: `http://localhost:3001/api/flood-data`
- Service Status: `http://localhost:3001/api/status`
- Manual Update: `http://localhost:3001/api/manual-update`

## 🧪 Testing Your dApp

### Test ICP Canister Functions
```bash
# Check flood threshold
dfx canister call paramify_core getFloodThreshold

# Check current flood level
dfx canister call paramify_oracle getLatestFloodData

# Test flood data update (calls USGS API)
dfx canister call paramify_oracle manualUpdate

# Purchase insurance policy
dfx canister call paramify_core buyInsurance "(1000000000000000000:nat, 30:nat)"
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

## 🏛️ How It Works

### Data Flow Architecture
```
🌐 USGS API → ICP Oracle → Core Canister → Backend API → Frontend
                     ↓
               Smart Contracts (Settlement)
```

### Key Features

1. **Real Flood Data**: Oracle canister fetches live data from USGS Mississippi River gauge
2. **Insurance Policies**: Users purchase coverage with automatic flood monitoring
3. **Automated Payouts**: Policies trigger automatically when flood levels exceed threshold
4. **Hybrid Settlement**: Combines ICP efficiency with Ethereum security
5. **Beautiful UI**: Modern React dashboard with real-time flood monitoring

### Security Architecture
- **Frontend**: Cannot make direct external API calls (browser security)
- **ICP Canisters**: Run in sandboxed environment, can make HTTP requests
- **Backend API**: Provides clean interface between frontend and canisters
- **Smart Contracts**: Handle final settlement on blockchain

## 🔧 Troubleshooting

### Common Issues & Solutions

**1. "Contract not found" Error**
- **Problem**: Frontend trying to call smart contracts directly
- **Solution**: Ensure frontend uses backend API, not direct contract calls

**2. "Network Error" on Frontend**
- **Problem**: Frontend trying to call external APIs directly
- **Solution**: This is expected! Frontend should use backend API instead

**3. ICP Canister Communication Errors**
- **Problem**: dfx commands failing or Candid parsing issues
- **Solution**: Use backend API server for frontend communication

**4. Hardhat Network Issues**
- **Problem**: "passthrough" network not found
- **Solution**: Check hardhat.config.js has correct network configuration

**5. dfx Not Found**
- **Problem**: dfx command not available
- **Solution**: Run in WSL and ensure dfx is installed with install script

### Useful Commands

```bash
# Check ICP status
dfx ping
dfx canister status --all

# Check Hardhat networks
npx hardhat help
npx hardhat run scripts/check-account-balance.js --network passthrough

# Restart services
dfx stop && dfx start --background --clean
cd backend && npm start
```

### Environment-Specific Notes

**Windows + WSL:**
- Run ICP commands in WSL
- Run Hardhat commands in PowerShell
- Backend API bridges the environments

**Ubuntu/Linux:**
- All commands can run in same terminal
- Better dfx compatibility

## 🏛️ Smart Contract Functions

### Paramify Contract
- `buyInsurance(uint256 coverage)`: Purchase insurance policy
- `triggerPayout()`: Claim payout if flood conditions met
- `getLatestPrice()`: Get current flood level from oracle
- `setInsuranceAmount(uint256)`: Admin function to set coverage amounts

### ICP Canister Functions
- `buyInsurance(coverage: Nat, duration: Nat)`: Purchase policy
- `claimPayout(policyId: Principal)`: Claim payout
- `getFloodThreshold()`: Get current flood threshold
- `manualUpdate()`: Fetch fresh flood data from USGS

## 🚀 Advanced Configuration

### Environment Variables

**Frontend (.env.local):**
```env
VITE_PARAMIFY_CORE_CANISTER_ID=<core_canister_id>
VITE_PARAMIFY_ORACLE_CANISTER_ID=<oracle_canister_id>
VITE_ICP_HOST=http://127.0.0.1:4943
VITE_INTERNET_IDENTITY_URL=https://identity.ic0.app
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

- **ICP Canisters**: Handle high-frequency operations with low latency
- **Ethereum**: Provides settlement security and finality
- **Oracle**: Updates flood data every 5 minutes (configurable)
- **Frontend**: Optimized React with Vite for fast loading

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Test** thoroughly (both ICP and Ethereum components)
4. **Document** any new configuration requirements
5. **Submit** a pull request

## 📄 License

[Add your license information]

---

## 🎯 What Makes This Special

This dApp demonstrates a **production-ready hybrid architecture** that combines:
- **ICP's speed and web integration** for user-facing operations
- **Ethereum's security** for financial settlement
- **Real-world data integration** with live flood monitoring
- **Modern development practices** with automated deployment

**Result**: A fully functional flood insurance platform with real data, working policies, and beautiful UI! 🌊

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

## Canister Functions

### paramify_core
- `buyInsurance(coverage: Nat, duration: Nat)`: Purchase insurance policy
- `claimPayout(policyId: Principal)`: Claim payout if flood threshold met
- `addAdmin(newAdmin: Principal)`: Add new admin
- `setFloodThreshold(threshold: Nat)`: Set flood level threshold
- `getPolicy(policyId: Principal)`: Get policy details

### paramify_oracle
- `setCoreCanisterId(id: Text)`: Set core canister ID for integration
- `startUpdates()`: Start automatic flood level updates
- `manualUpdate()`: Trigger manual flood level update
- `getLatestFloodData()`: Get current flood level

## Configuration

The `dfx.json` file configures:
- Canister types and dependencies
- Build commands for frontend
- Network settings

## Migration from Ethereum

This project demonstrates migrating from Ethereum/Hardhat to IC while preserving:
- React frontend architecture
- Business logic (moved to Motoko canisters)
- User experience and UI components

The IC provides:
- Lower transaction costs
- Faster finality
- Native integration with web technologies
- Scalable backend infrastructure

## Troubleshooting

### Common Issues
1. **dfx not found**: Ensure dfx is installed and in PATH
2. **Build failures**: Check frontend dependencies are installed
3. **Canister deployment errors**: Verify local replica is running

### Useful Commands
```bash
dfx canister status --all          # Check canister status
dfx canister info <CANISTER_NAME>  # Get canister details
dfx stop                           # Stop local replica
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Add your license here]
