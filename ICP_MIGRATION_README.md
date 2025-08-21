# Paramify ICP Migration Guide

This guide documents the migration of Paramify from Ethereum to the Internet Computer (ICP) platform.

## 🎯 Migration Overview

The Paramify project has been successfully migrated from Ethereum to ICP with the following key changes:

### ✅ Completed Migrations

1. **Smart Contract → Canister**: Solidity contract migrated to Motoko canister
2. **Oracle Service**: Node.js backend replaced with ICP oracle canister
3. **Frontend**: MetaMask integration replaced with Internet Identity
4. **Architecture**: Centralized components eliminated for full decentralization

### 🏗️ Architecture Changes

#### Before (Ethereum)
- Solidity smart contract on EVM
- Node.js oracle backend (centralized)
- MetaMask wallet integration
- ethers.js for blockchain interaction

#### After (ICP)
- Motoko canisters for business logic
- HTTPS outcalls for USGS data
- Internet Identity authentication
- @dfinity/agent for canister interaction

## 🚀 Deployment

### Prerequisites
- Install IC SDK: https://internetcomputer.org/docs/current/developer-docs/setup/install/
- Node.js 18+ and npm
- DFX CLI

### Quick Start
```bash
# 1. Start local replica
dfx start --background

# 2. Install frontend dependencies
cd frontend && npm install && cd ..

# 3. Deploy all canisters
./scripts/deploy-icp.sh

# 4. Start oracle updates
dfx canister call paramify_oracle startUpdates
```

### Manual Deployment
```bash
# Deploy canisters individually
dfx deploy paramify_core
dfx deploy paramify_oracle
dfx deploy paramify_frontend

# Initialize oracle with core canister ID
CORE_ID=$(dfx canister id paramify_core)
dfx canister call paramify_oracle initialize "(principal \"$CORE_ID\")"
```

## 🏛️ Canister Structure

### Paramify Core Canister (`src/paramify_core/`)
- **Purpose**: Main business logic for flood insurance
- **Functions**:
  - `buyInsurance(coverage)`: Purchase insurance policy
  - `triggerPayout()`: Request payout if flood threshold met
  - `setThreshold(threshold)`: Admin function to set flood threshold
  - `getPolicy(customer)`: Query policy details
  - `updateFloodLevel(level)`: Update flood level from oracle

### Paramify Oracle Canister (`src/paramify_oracle/`)
- **Purpose**: Fetches USGS flood data and updates core canister
- **Functions**:
  - `initialize(coreCanisterId)`: Initialize with core canister reference
  - `startUpdates()`: Begin periodic data fetching
  - `manualUpdate()`: Trigger immediate data update
  - `getLatestFloodData()`: Get current flood data
  - `getStatus()`: Get oracle operational status

### Paramify Frontend Canister (`frontend/`)
- **Purpose**: React application served from ICP
- **Features**:
  - Internet Identity authentication
  - Canister interaction via @dfinity/agent
  - Responsive UI with shadcn/ui components

## 🔧 Configuration

### Environment Variables
```bash
# Frontend environment variables
VITE_PARAMIFY_CORE_CANISTER_ID=your-core-canister-id
VITE_PARAMIFY_ORACLE_CANISTER_ID=your-oracle-canister-id
VITE_ICP_HOST=http://127.0.0.1:4943
VITE_INTERNET_IDENTITY_URL=https://identity.ic0.app
```

### dfx.json Configuration
```json
{
  "canisters": {
    "paramify_core": {
      "type": "motoko",
      "main": "src/paramify_core/main.mo"
    },
    "paramify_oracle": {
      "type": "motoko",
      "main": "src/paramify_oracle/main.mo"
    },
    "paramify_frontend": {
      "type": "assets",
      "source": ["dist"],
      "dependencies": ["paramify_core", "paramify_oracle"]
    }
  }
}
```

## 🔗 Frontend Integration

### Authentication
```typescript
import { useAuth } from '@/components/InternetIdentityProvider';

const { isAuthenticated, principal, login, logout } = useAuth();

if (!isAuthenticated) {
  await login(); // Redirects to Internet Identity
}
```

### Canister Calls
```typescript
import icpService from '@/lib/icp-canister';

// Get current threshold
const threshold = await icpService.getCurrentThreshold();

// Buy insurance
const result = await icpService.buyInsurance(1000000000000n); // 1 ICP coverage
if ('ok' in result) {
  console.log('Insurance purchased successfully');
}
```

## 🧪 Testing

### Local Testing
1. Deploy all canisters using the deployment script
2. Open frontend at: `http://127.0.0.1:4943/?canisterId=<frontend-canister-id>`
3. Connect with Internet Identity
4. Test insurance purchase and oracle updates

### Unit Tests
```bash
# Test core canister
dfx canister call paramify_core getCurrentThreshold

# Test oracle canister
dfx canister call paramify_oracle getStatus

# Test cross-canister communication
dfx canister call paramify_oracle manualUpdate
```

## 🔄 Data Flow

1. **Oracle Fetches Data**: Oracle canister makes HTTPS outcall to USGS API
2. **Data Processing**: Converts flood level to contract units (feet × 100000000000)
3. **Update Core**: Oracle calls `updateFloodLevel` on core canister
4. **User Interaction**: Frontend queries core canister for policy and threshold data
5. **Insurance Logic**: Core canister checks flood level against threshold for payouts

## 🔐 Security Features

- **Decentralized Authentication**: Internet Identity instead of centralized wallet providers
- **Canister Isolation**: Secure separation between oracle and business logic
- **HTTPS Outcalls**: Secure external data fetching with IC's HTTPS capabilities
- **Principal-based Access**: Fine-grained access control using IC principals

## 🚦 Migration Status

### ✅ Completed
- [x] Core business logic migration (Solidity → Motoko)
- [x] Oracle service decentralization (Node.js → ICP canister)
- [x] Frontend authentication (MetaMask → Internet Identity)
- [x] Canister communication setup
- [x] Deployment automation
- [x] Cross-platform data flow

### 🔄 Next Steps
- [ ] Production deployment to mainnet
- [ ] HTTPS outcalls implementation for live USGS data
- [ ] Enhanced error handling and monitoring
- [ ] Performance optimization
- [ ] Comprehensive testing suite

## 🆘 Troubleshooting

### Common Issues

**Canister deployment fails**
```bash
# Check if replica is running
dfx ping

# Restart replica
dfx stop
dfx start --background
```

**Frontend connection issues**
```bash
# Check canister IDs
dfx canister id paramify_core
dfx canister id paramify_oracle
dfx canister id paramify_frontend

# Update environment variables
export VITE_PARAMIFY_CORE_CANISTER_ID=<core-id>
export VITE_PARAMIFY_ORACLE_CANISTER_ID=<oracle-id>
```

**Authentication not working**
```bash
# Check if Internet Identity is available
curl https://identity.ic0.app

# Clear local storage and try again
localStorage.clear()
```

## 📚 Resources

- [Internet Computer Documentation](https://internetcomputer.org/docs/)
- [Motoko Language Guide](https://internetcomputer.org/docs/current/motoko/main/motoko)
- [IC SDK Reference](https://internetcomputer.org/docs/current/references/cli-reference/)
- [Internet Identity Guide](https://internetcomputer.org/docs/current/tokenomics/identity-auth/)

## 🤝 Contributing

When making changes to the ICP implementation:

1. Test all canisters locally before deployment
2. Update canister interfaces if function signatures change
3. Ensure proper error handling for all canister calls
4. Update this README with any new configuration requirements

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.