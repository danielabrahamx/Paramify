# MetaMask PolkaVM Network Setup Guide

## Network Details Confirmed
Your PolkaVM node is running correctly at `http://127.0.0.1:8545` with Chain ID `420420420`.

## Steps to Add PolkaVM Network to MetaMask

1. **Open MetaMask** and click on the network dropdown (usually shows "Ethereum Mainnet")

2. **Click "Add Network"** at the bottom of the list

3. **Click "Add a network manually"**

4. **Enter these exact details:**
   - **Network Name:** PolkaVM Local
   - **New RPC URL:** http://127.0.0.1:8545
   - **Chain ID:** 420420420
   - **Currency Symbol:** ETH
   - **Block Explorer URL:** (leave empty)

5. **Click "Save"**

## Common Issues and Solutions

### Issue 1: "This token symbol doesn't match..." warning
This is just a warning because ETH is commonly associated with Ethereum mainnet. You can safely ignore this warning and click "Approve" to continue.

### Issue 2: Network already exists
If you get an error that the network already exists:
1. Go to Settings → Networks in MetaMask
2. Find any network with Chain ID 31337 or 420420420
3. Delete it
4. Try adding the network again

### Issue 3: Connection refused
If MetaMask can't connect:
1. Make sure your PolkaVM node is running (`node scripts/verify-chain-id.js` should work)
2. Check that no firewall is blocking port 8545
3. Try using `http://localhost:8545` instead of `http://127.0.0.1:8545`

## Verify Connection
After adding the network:
1. Switch to "PolkaVM Local" in MetaMask
2. You should see your account balance
3. The first account (0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266) should have ETH

## Import Test Account (Optional)
To import the admin account with pre-funded ETH:
1. Click on the account icon in MetaMask
2. Select "Import Account"
3. Enter this private key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
4. This will import the account `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` with 10000 ETH
