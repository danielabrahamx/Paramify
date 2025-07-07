# Paramify: Decentralized Flood Insurance - Polkadot Passet Hub Proof of Concept

![alt text](image.png)

## Overview

**Paramify** is a proof of concept (PoC) for a decentralized flood insurance platform specifically built for **Polkadot's Passet Hub parachain**. This project was commissioned by Polkadot to demonstrate how automated insurance purchases and payouts can work on their ecosystem, using real-time flood level data from USGS integrated through a Chainlink-compatible oracle.

### Built for Passet Hub

This project is configured and ready for deployment on **Passet Hub Testnet** (Chain ID: 420420422), a Polkadot parachain with EVM compatibility. Our account is funded with 4995+ PAS tokens and all deployment scripts are ready for immediate use once the network's EVM module is fully activated.

```javascript
// Network Configuration (hardhat.config.js)
networks: {
  passetHub: {
    url: "https://testnet-passet-hub-eth-rpc.polkadot.io",
    chainId: 420420422,
    accounts: [...],
    timeout: 120000,
  }
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

### ✅ Ready for Passet Hub
- Smart contracts developed and tested
- Account funded on Passet Hub (4995+ PAS tokens)
- All deployment scripts configured for Passet Hub
- Network configuration complete

### ⚠️ Temporary Network Issue
Passet Hub testnet currently has EVM module restrictions preventing contract deployment. Once resolved, deploy with:
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

## Quick Start: Demo Deployment

While awaiting Passet Hub EVM activation, run the demo locally:

```bash
# Terminal 1: Deploy contracts locally (keep open)
npx hardhat run scripts/deploy-for-demo.js

# Terminal 2: Start backend server
cd backend
npm start

# Terminal 3: Start frontend
cd frontend  
npm run dev
```

Then open http://localhost:5173 in your browser.

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
│   │       └── usgsApi.ts        # USGS data integration
│   ├── package.json              # Frontend dependencies
│   └── .env                      # Frontend config (auto-updated)
├── scripts/
│   ├── deploy-passet.js          # Passet Hub deployment
│   ├── deploy-for-demo.js        # Local demo deployment
│   ├── demonstrate-passet-hub.js # Show Passet Hub readiness
│   └── check-passet-balance.js   # Verify Passet Hub funding
├── test/
│   └── Paramify.test.js          # Unit tests
├── hardhat.config.js             # Network configurations
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

- **Blockchain**: Passet Hub (Polkadot Parachain)
- **Smart Contracts**: Solidity 0.8.24
- **Backend**: Node.js/Express with USGS API
- **Frontend**: React/TypeScript with Vite
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
