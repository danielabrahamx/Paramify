# Paramify - Polkadot Passet Hub Proof of Concept

## Executive Summary

**Paramify** is a blockchain-based flood insurance dApp specifically developed as a **proof of concept for Polkadot's Passet Hub parachain**. This project demonstrates how decentralized insurance can operate on Polkadot's ecosystem, leveraging real-time USGS data for automatic claim processing.

## Built for Passet Hub

### Network Configuration
The entire codebase is configured for Passet Hub testnet:

```javascript
// hardhat.config.js
networks: {
  passetHub: {
    url: "https://testnet-passet-hub-eth-rpc.polkadot.io",
    chainId: 420420422,
    accounts: [...],
    timeout: 120000,
  }
}
```

### Deployment Scripts
All deployment scripts target Passet Hub:
- `scripts/deploy-passet.js`
- `scripts/deploy-passet-comprehensive.js`
- `scripts/check-passet-balance.js`

### Account Funding
Successfully funded account on Passet Hub:
- Address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Balance: 4995+ PAS tokens
- Network: Passet Hub Testnet (Chain ID: 420420422)

## Technical Integration

### Smart Contracts
- **Paramify.sol**: Main insurance contract with dynamic threshold management
- **MockV3Aggregator.sol**: Chainlink-compatible oracle for USGS data
- Fully EVM-compatible, ready for Passet Hub deployment

### Architecture
```
Passet Hub Parachain
├── Smart Contracts (EVM)
│   ├── Paramify Insurance Contract
│   └── Oracle Integration
├── Backend API
│   └── USGS Data Feed
└── Frontend dApp
    ├── Policy Holder Interface
    └── Admin Dashboard
```

## Current Status

### ✅ Completed
1. Smart contracts developed and tested
2. Frontend interfaces built
3. USGS integration implemented
4. Account funded on Passet Hub
5. Full deployment configuration for Passet Hub

### ⚠️ Temporary Blocker
Passet Hub testnet currently has deployment restrictions. Our investigation revealed:
- Module Error index 60: "CodeRejected"
- All transaction types being rejected
- Likely EVM module configuration issue

### 🚀 Demo Strategy
While awaiting Passet Hub team resolution:
1. Run locally to demonstrate full functionality
2. All code remains configured for Passet Hub
3. One-command deployment ready when network is accessible

## Demonstration for Polkadot

### 1. Show Passet Hub Configuration
```bash
# Display network configuration
cat hardhat.config.js | grep -A 10 passetHub

# Show funded account
npx hardhat run scripts/check-passet-balance.js --network passetHub
```

### 2. Run Functional Demo
```bash
# Terminal 1: Local blockchain (temporary)
npx hardhat run scripts/deploy-for-demo.js

# Terminal 2: Backend
cd backend && npm start

# Terminal 3: Frontend
cd frontend && npm run dev
```

### 3. Deployment Command (When Network Ready)
```bash
npx hardhat run scripts/deploy-passet.js --network passetHub
```

## Key Features Demonstrated

1. **Polkadot Integration**: Built specifically for Passet Hub parachain
2. **Real-time Oracle**: USGS river gauge data integration
3. **Automatic Payouts**: Smart contract-based claim processing
4. **Dynamic Thresholds**: Location-based risk management
5. **Multi-role Access**: Separate interfaces for admins and policyholders

## Next Steps

1. **Immediate**: Contact Passet Hub team about deployment access
2. **Short-term**: Deploy contracts once network issues resolved
3. **Long-term**: Production deployment with real USGS feeds

## Contact Information

For Passet Hub deployment support:
- Network: https://testnet-passet-hub-eth-rpc.polkadot.io
- Chain ID: 420420422
- Documentation: [Polkadot Parachain Docs]

---

**This proof of concept is ready for immediate deployment to Passet Hub once network access is restored.**
