# Paramify Codebase - LLM Analysis Format

## Context & Purpose
This export contains the complete Paramify codebase - a blockchain-based flood insurance protocol with NFT policy management. The system automatically triggers payouts when USGS flood data exceeds configured thresholds.

## Key Technologies
- **Blockchain**: Ethereum/Hardhat, Solidity smart contracts
- **Backend**: Node.js, Express, ethers.js, USGS API integration
- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **NFTs**: ERC-721 soulbound tokens for policy representation

## System Architecture Summary

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   USGS API      │───▶│   Backend       │───▶│ Smart Contract  │
│   (Flood Data)  │    │   (Node.js)     │    │ (Solidity)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                ▲                        │
                                │                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │◀───│   API Routes    │    │   NFT Policies  │
│   (React/TS)    │    │   (Express)     │    │   (ERC-721)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Data Flow
1. **USGS → Backend**: Fetches real-time flood data (feet)
2. **Backend → Contract**: Converts to contract units (×100B) and updates oracle
3. **Contract Logic**: Compares flood level vs threshold, triggers payouts
4. **NFT System**: Mints soulbound policy NFTs with dynamic metadata
5. **Frontend**: Displays user-friendly interface (converts back to feet)

## Core Components

### Smart Contract (`contracts/Paramify.sol`)
- **Primary Functions**: Insurance purchase, payout triggers, threshold management
- **NFT Integration**: ERC-721 implementation with soulbound tokens
- **Access Control**: Owner-only threshold updates, role-based permissions
- **Oracle Integration**: Chainlink-compatible price feed for flood data

### Backend Service (`backend/server.js`)
- **USGS Integration**: Automated flood data fetching every 5 minutes
- **Blockchain Interface**: Contract interaction, event listening
- **API Endpoints**: RESTful services for frontend communication
- **Policy Management**: NFT tracking, statistics, metadata updates

### Frontend Dashboards
- **Customer Dashboard** (`InsuracleDashboard.tsx`): Policy purchase, payout claims
- **Admin Dashboard** (`InsuracleDashboardAdmin.tsx`): Threshold management, system monitoring
- **Shared Libraries**: Contract configurations, API clients, utilities

## Critical Implementation Details

### Unit Conversion System
```javascript
// Backend: Feet to Contract Units
const contractUnits = feetValue * 100000000000;

// Frontend: Contract Units to Feet  
const feetDisplay = contractUnits / 100000000000;
```

### NFT Policy Features
- **Soulbound**: Non-transferable after minting via `_update()` override
- **Dynamic Metadata**: SVG images update based on policy status
- **On-chain Storage**: All policy data stored in contract structs
- **Status Tracking**: Active, paid out, coverage amounts, timestamps

### Security Measures
- **Access Control**: OpenZeppelin AccessControl for role management
- **Input Validation**: Comprehensive checks for all user inputs
- **Error Handling**: Graceful degradation, user-friendly messages
- **Admin Restrictions**: Specific wallet address for admin functions

## Deployment Workflow
1. **Hardhat Node**: `npx hardhat node` (port 8545)
2. **Contract Deployment**: `npx hardhat run scripts/deploy.js --network localhost`
3. **Address Updates**: Update backend/.env and frontend/src/lib/contract.ts
4. **Backend Start**: `cd backend; npm start` (port 3001)
5. **Frontend Start**: `cd frontend; npm run dev` (port 5173)

## File Structure
```
contracts/
├── Paramify.sol              # Main insurance contract with NFTs
└── mocks/MockV3Aggregator.sol # Test oracle

backend/
├── server.js                 # Express API + USGS integration
└── package.json             # Dependencies

frontend/src/
├── InsuracleDashboard.tsx         # Customer interface
├── InsuracleDashboardAdmin.tsx    # Admin interface
└── lib/
    ├── contract.ts           # Contract addresses & ABIs
    └── usgsApi.ts           # API client

scripts/
├── deploy.js                 # Contract deployment
└── fund-contract.js         # Contract funding
```

---

*This analysis format is optimized for LLM consumption and includes all architectural context needed for code understanding and modification.*
