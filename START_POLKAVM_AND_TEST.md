# Quick Start: PolkaVM Testing

## Step 1: Start PolkaVM Node
Open a new terminal and run:
```bash
polkavm-node --dev
```

Wait until you see output indicating the node is running at `127.0.0.1:8545`

## Step 2: Deploy Contracts (in a new terminal)
```bash
node scripts/deploy-pvm-local.js
```

## Step 3: Run the Test
```bash
node scripts/test-polkavm-functionality.js
```

## Alternative: Use Hardhat Network
If you don't have PolkaVM node installed, you can test with Hardhat:

1. Start Hardhat node:
```bash
npx hardhat node
```

2. Deploy contracts:
```bash
node scripts/deploy-simple-demo.js
```

3. Run tests:
```bash
node scripts/test-functionality.js
```

## What the test will do:
1. ✅ Fund the contract with 5 ETH
2. ✅ Buy insurance as a test user (1 ETH coverage, 0.1 ETH premium)
3. ✅ Update flood level above threshold
4. ✅ Trigger payout and verify user receives insurance
5. ✅ Check final contract balance

## Expected Output:
- Contract funded successfully
- Insurance purchased successfully
- Flood level updated
- Payout triggered
- User receives 1 ETH payout
- All tests passed!
