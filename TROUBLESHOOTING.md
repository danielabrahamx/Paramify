# Paramify Local Deployment Troubleshooting Guide

This document logs common issues and their solutions when deploying the Paramify project locally.

## Successful Changes Log

1. **Fixed Missing Functions in contract.ts** - Added the missing `getContractAddresses` and `isPolkaVMNetwork` functions to enable frontend functionality.

2. **Corrected Private Key in backend/.env** - Updated the backend to use Account #0's private key (owner/admin) instead of an incorrect key.

3. **Fixed Directory Navigation** - Ensured all commands are run from the correct directory (c:\Users\danie\Paramify-1).

## Common Issues

### 1. White Screen on Frontend

**Problem**: Frontend displays a white screen with no content.

**Potential Causes**:
- Missing exports in the contract.ts file
- Error in the React components trying to access undefined functions

**Solution**:
1. Ensure contract.ts has all required functions exported:
   ```typescript
   // Required exports
   export const PARAMIFY_ABI = paramifyAbiJson as any[];
   export const MOCK_ORACLE_ABI = mockOracleAbiJson as any[];
   export function isPolkaVMNetwork() { ... }
   export function getContractAddresses() { ... }
   ```

2. Build the frontend to check for compilation errors:
   ```
   cd frontend
   npm run build
   ```

### 2. "Unauthorized: Only contract owner can update threshold" Error

**Problem**: Unable to update threshold from the admin dashboard.

**Cause**: The backend is using an account that doesn't have owner privileges.

**Solution**:
1. Update the backend/.env file to use Account #0's private key (the deployer):
   ```
   PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
2. Restart the backend server:
   ```
   cd backend
   npm start
   ```

### 3. Directory Navigation Errors

**Problem**: Commands fail with errors about missing files or not being in a Hardhat project.

**Cause**: Running commands from the wrong directory.

**Solution**:
- Always use absolute paths or navigate to the correct directory:
  ```
  cd c:\Users\danie\Paramify-1
  ```
- Or use absolute paths in commands:
  ```
  cd c:\Users\danie\Paramify-1\frontend; npm run dev
  ```

## Deployment Steps Quick Reference

1. **Start Hardhat Node**:
   ```
   cd c:\Users\danie\Paramify-1
   npx hardhat node
   ```

2. **Deploy Contracts**:
   ```
   cd c:\Users\danie\Paramify-1
   npx hardhat run scripts/deploy-simple-demo.js --network localNode
   ```

3. **Fix Backend .env**:
   Update `PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

4. **Fix Frontend contract.ts**:
   Ensure it has all necessary functions exported

5. **Start Backend**:
   ```
   cd c:\Users\danie\Paramify-1\backend
   npm start
   ```

6. **Start Frontend**:
   ```
   cd c:\Users\danie\Paramify-1\frontend
   npm run dev
   ```

7. **Configure MetaMask**:
   - Network Name: PolkaVM Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 420420420
   - Currency Symbol: ETH
   - Import admin account (Account #0): 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
