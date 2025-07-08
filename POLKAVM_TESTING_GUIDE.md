# PolkaVM Testing Guide

## Prerequisites

1. **Start PolkaVM Node**
   ```bash
   # In a terminal, start the PolkaVM node
   polkavm-node --dev
   ```
   
   Make sure the node is running at `http://127.0.0.1:8545`

2. **Deploy Contracts** (if not already deployed)
   ```bash
   node scripts/deploy-pvm-local.js
   ```

## Testing Steps

### Step 1: Connect MetaMask
1. Open MetaMask
2. Make sure you're connected to "PolkaVM Local" network (Chain ID: 420420420)
3. Import the admin account if not already imported:
   - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - Address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`

### Step 2: Test via Admin Dashboard

1. **Open the Admin Dashboard**
   - Navigate to your frontend URL
   - Click "Admin Dashboard"
   - Connect with the admin wallet

2. **Fund the Contract**
   - In the "Contract Management" section
   - Enter amount (e.g., 5 ETH)
   - Click "Fund Contract"
   - Approve transaction in MetaMask

3. **Check Contract Balance**
   - The contract balance should update after funding
   - This confirms the contract is deployed and accepting funds

### Step 3: Test via Command Line

Run the test script:
```bash
node scripts/test-polkavm-functionality.js
```

This will:
1. Fund the contract with 5 ETH
2. Buy insurance as a test user
3. Update flood levels to trigger a payout
4. Verify the payout was successful

### Step 4: Test Insurance Purchase via UI

1. **Switch to Customer Dashboard**
   - Go back to home
   - Click "Customer Dashboard"
   - Connect with any wallet (not the admin)

2. **Buy Insurance**
   - Enter coverage amount (e.g., 1 ETH)
   - The premium will be calculated (10%)
   - Click "Buy Insurance"
   - Approve transaction in MetaMask

3. **Verify Insurance**
   - You should see your active policy details
   - The contract balance should increase by the premium

### Step 5: Test Payout Trigger

1. **As Admin, Update Threshold** (optional)
   - Go to Admin Dashboard
   - Set threshold to a lower value (e.g., 10 feet)
   - Click "Update Threshold"

2. **Update Flood Level**
   - Use the backend service or manual update
   - Set flood level above threshold

3. **Trigger Payout**
   - Go to Customer Dashboard
   - Click "Claim Payout"
   - The insurance amount should be sent to your wallet

## Troubleshooting

### "Connection Refused" Error
- Make sure PolkaVM node is running: `polkavm-node --dev`
- Check if port 8545 is not blocked by firewall
- Try `http://localhost:8545` instead of `127.0.0.1:8545`

### "Contract Not Found" Error
- Run deployment script: `node scripts/deploy-pvm-local.js`
- Check `pvm-deployment.json` exists and contains contract addresses

### Transaction Failures
- Ensure you have enough ETH in your wallet
- Check gas settings in MetaMask
- Verify you're on the correct network (Chain ID: 420420420)

### MetaMask Issues
- Clear MetaMask activity data: Settings → Advanced → Clear activity tab data
- Remove and re-add the PolkaVM network
- Try different RPC URL: `http://localhost:8545` vs `http://127.0.0.1:8545`

## Expected Results

After successful testing:
1. ✅ Contract accepts funding
2. ✅ Users can buy insurance
3. ✅ Flood data updates correctly
4. ✅ Payouts trigger when threshold exceeded
5. ✅ Contract balance decreases after payouts
6. ✅ User receives insurance payout

## Quick Test Commands

```bash
# Check if PolkaVM is running
node scripts/verify-chain-id.js

# Deploy contracts
node scripts/deploy-pvm-local.js

# Run full test suite
node scripts/test-polkavm-functionality.js

# Check deployment status
node scripts/verify-pvm-deployment.js
