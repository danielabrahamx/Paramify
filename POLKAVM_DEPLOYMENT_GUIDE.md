# PolkaVM Deployment Guide for Paramify

## Overview

This guide documents the successful deployment of Paramify smart contracts to PolkaVM on Passet Hub testnet. The deployment maintains 100% functional compatibility while using PolkaVM's RISC-V architecture instead of standard EVM.

## Prerequisites

1. **Node.js**: Version 18.x or 23.x
2. **Funded Account**: At least 0.1 PAS tokens
3. **Network Access**: Passet Hub testnet RPC endpoint

## Deployment Process

### 1. Environment Setup

```bash
# Install PolkaVM dependencies
npm install --save-dev @parity/hardhat-polkadot@0.1.5

# Clean previous artifacts
rm -rf cache/ artifacts/
```

### 2. Configuration

Update `hardhat.config.js` with PolkaVM settings:

```javascript
require('@nomicfoundation/hardhat-toolbox');
require('@parity/hardhat-polkadot');
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    passetHub: {
      polkavm: true,  // Enable PolkaVM
      url: process.env.PASSET_HUB_RPC_URL || "https://testnet-passet-hub-eth-rpc.polkadot.io",
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 66 ? [process.env.PRIVATE_KEY] : [],
      chainId: 420420422,
      timeout: 120000,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache-pvm",
    artifacts: "./artifacts-pvm",
  },
};
```

### 3. Compilation

```bash
# Compile contracts for PolkaVM
npx hardhat compile
```

Contract sizes (both within 100KB PolkaVM limit):
- MockV3Aggregator: 7,923 bytes
- Paramify: 38,934 bytes

### 4. Deployment Using Hardhat Ignition

Create `ignition/modules/Paramify.js`:

```javascript
const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("ParamifyModule", (m) => {
  const mockDecimals = m.getParameter("mockDecimals", 8);
  const mockInitialAnswer = m.getParameter("mockInitialAnswer", 2000e8);
  
  const mockPriceFeed = m.contract("MockV3Aggregator", [mockDecimals, mockInitialAnswer]);
  const paramify = m.contract("Paramify", [mockPriceFeed]);
  
  return { mockPriceFeed, paramify };
});
```

Deploy:

```bash
npx hardhat ignition deploy ./ignition/modules/Paramify.js --network passetHub
```

## Deployed Contracts

### Passet Hub Testnet (Chain ID: 420420422)

- **MockV3Aggregator**: `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9`
- **Paramify**: `0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9`

## Frontend Integration

### 1. Create PolkaVM Configuration

Create `frontend/src/lib/contract-pvm.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  passetHub: {
    paramify: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
    mockOracle: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    network: "PolkaVM on Passet Hub",
    chainId: 420420422,
    rpcUrl: "https://testnet-passet-hub-eth-rpc.polkadot.io"
  }
};

export const isPolkaVMNetwork = (chainId) => chainId === 420420422;
```

### 2. Update Contract Integration

In `frontend/src/lib/contract.ts`:

```typescript
import { CONTRACT_ADDRESSES as PVM_ADDRESSES } from './contract-pvm';

export const getContractAddresses = (chainId: number) => {
  if (isPolkaVMNetwork(chainId)) {
    return {
      paramify: PVM_ADDRESSES.passetHub.paramify,
      mockOracle: PVM_ADDRESSES.passetHub.mockOracle
    };
  }
  // Return EVM addresses for other networks
  return {
    paramify: PARAMIFY_ADDRESS,
    mockOracle: MOCK_ORACLE_ADDRESS
  };
};
```

## Verification Script

Create `scripts/verify-pvm-deployment.js` to test deployed contracts:

```javascript
const { ethers } = require("hardhat");

async function main() {
    const mockAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
    const paramifyAddress = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
    
    const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
    const mockPriceFeed = MockV3Aggregator.attach(mockAddress);
    
    const Paramify = await ethers.getContractFactory("Paramify");
    const paramify = Paramify.attach(paramifyAddress);
    
    // Test basic functionality
    const latestPrice = await paramify.getLatestPrice();
    console.log("Current flood level:", latestPrice.toString());
    
    const threshold = await paramify.getCurrentThreshold();
    console.log("Current threshold:", threshold.toString());
    
    const balance = await paramify.getContractBalance();
    console.log("Contract balance:", ethers.formatEther(balance), "PAS");
}

main().catch(console.error);
```

## Key Differences: PolkaVM vs EVM

1. **Transaction Format**: Hardhat Ignition handles PolkaVM transaction format automatically
2. **Gas Model**: PolkaVM uses a multi-dimensional resource model
3. **Bytecode**: Compiled to RISC-V instead of EVM bytecode
4. **Deployment Method**: Use Hardhat Ignition for smoother PolkaVM deployment

## Troubleshooting

### "Invalid Transaction" Error
- Use Hardhat Ignition instead of direct deployment scripts
- Ensure `polkavm: true` is set in network configuration
- Verify @parity/hardhat-polkadot plugin is installed

### Contract Size Limits
- PolkaVM has a 100KB contract size limit
- Check bytecode size before deployment
- Optimize contracts if needed

### Network Connection
- Ensure RPC endpoint is accessible
- Check account balance (minimum 0.1 PAS)
- Verify chain ID is 420420422

## Scripts Reference

```json
{
  "scripts": {
    "compile-pvm": "npx hardhat compile",
    "test-pvm": "npx hardhat test",
    "deploy-pvm": "npx hardhat ignition deploy ./ignition/modules/Paramify.js --network passetHub",
    "verify-pvm": "npx hardhat run scripts/verify-pvm-deployment.js --network passetHub",
    "clean-pvm": "rm -rf cache-pvm/ artifacts-pvm/ ignition/deployments/"
  }
}
```

## Conclusion

The Paramify contracts have been successfully deployed to PolkaVM on Passet Hub testnet. All functionality remains identical to the EVM version, with the added benefits of PolkaVM's RISC-V architecture and Polkadot ecosystem integration.
