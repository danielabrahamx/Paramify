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

### 3. Threshold Update Not Reflecting on Customer Dashboard

**Problem**: When updating the threshold in the admin dashboard, the change appears successful but doesn't reflect on the customer dashboard.

**Potential Causes**:
- Frontend not refreshing the contract state properly
- Caching issues in the browser
- Contract state not properly synchronized between admin and customer views

**Solution**:
1. Ensure the customer dashboard is refreshing the threshold value from the contract:
   - Check if the component is polling for updates or using event listeners
   - Try refreshing the page or clearing the browser cache
2. Verify that the transaction to update the threshold is actually completing successfully on the blockchain
3. Check the browser console for any errors that might indicate failed contract calls
```

## Deployment Checklist

Use this checklist to ensure a successful deployment:

1. **Start the Local Blockchain**:
   ```powershell
   npx hardhat node
   ```

2. **Deploy the Contracts**:
   ```powershell
   npx hardhat run scripts/deploy-simple-demo.js --network localNode
   ```
   
3. **Verify Configuration Files**:
   - Confirm `frontend/src/lib/contract.ts` has all required exports
   - Confirm `backend/.env` has the correct PRIVATE_KEY (Account #0)
   - Verify contract addresses in `demo-deployment.json` match both configs

4. **Start the Backend**:
   ```powershell
   cd backend
   npm start
   ```

5. **Start the Frontend**:
   ```powershell
   cd frontend
   npm run dev
   ```

6. **Test Functionality**:
   - Connect MetaMask to localhost:8545 (Chain ID: 420420420)
   - Test customer dashboard with Account #2
   - Test admin dashboard with Account #0
   - Verify oracle updates from backend by checking water level changes

## Account Information

For reference, here are the account details for local development:

1. **Account #0 (Deployer/Admin)**:
   - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - Used for: Deploying contracts, admin dashboard functions, updating threshold

2. **Account #1 (Oracle Updater)**:
   - Private Key: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
   - Used for: Oracle updates (water level data)

3. **Account #2 (Test User)**:
   - Private Key: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`
   - Used for: Testing the customer dashboard, purchasing insurance
```
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
