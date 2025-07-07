# Paramify Flood Insurance dApp - Agent System Instructions

## Overview
Paramify is a blockchain-based flood insurance platform that provides automatic payouts based on real-time USGS river gauge data. The system consists of smart contracts (Solidity), a backend API (Node.js/Express), and a React frontend.

## Current Status
- **Smart Contracts**: ✅ Deployed locally (Hardhat network)
- **Backend**: ✅ Configured with contract addresses
- **Frontend**: ✅ Configured with contract addresses
- **USGS Integration**: ✅ Working with mock data

## Contract Addresses (Local Deployment)
- **MockV3Aggregator**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **Paramify**: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`

## Running the Demo

### Terminal 1 - Blockchain (Keep Open)
```bash
npx hardhat run scripts/deploy-for-demo.js
# Keep this terminal open - it's running the local blockchain
```

### Terminal 2 - Backend
```bash
cd backend
npm start
# Backend will run on http://localhost:3001
```

### Terminal 3 - Frontend
```bash
cd frontend
npm run dev
# Frontend will run on http://localhost:5173
```

## Key Features
1. **Dynamic Threshold Management**: Adjusts insurance trigger levels based on location
2. **USGS Data Integration**: Real-time river gauge monitoring
3. **Automatic Payouts**: Smart contract executes payouts when thresholds are exceeded
4. **Multi-role Access**: Admin and policy holder interfaces

## Important Files
- `contracts/Paramify.sol` - Main insurance contract
- `contracts/mocks/MockV3Aggregator.sol` - Oracle simulator
- `backend/server.js` - API server
- `frontend/src/InsuracleDashboard.tsx` - Policy holder UI
- `frontend/src/InsuracleDashboardAdmin.tsx` - Admin UI

## Passet Hub Deployment Issue
After extensive investigation, we discovered that Passet Hub testnet has network-level restrictions preventing contract deployment. The error "CodeRejected" followed by "Invalid Transaction" indicates the EVM module may not be fully enabled or there are whitelist requirements. See `PASSET_HUB_DEPLOYMENT_ISSUE.md` for full technical analysis.

## Alternative Networks for Production
- **Ethereum Sepolia**: Industry standard testnet
- **Polygon Mumbai**: Fast and cheap
- **Avalanche Fuji**: High performance
- **Base Goerli**: Optimism-based L2

## Next Steps for Production
1. Choose a fully EVM-compatible network
2. Deploy contracts using standard deployment scripts
3. Update configuration files with production addresses
4. Implement real USGS data feeds (remove mock)
5. Add proper authentication and security measures
