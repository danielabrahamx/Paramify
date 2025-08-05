# Paramify Troubleshooting (PassetHub Testnet)

This guide focuses on PassetHub Testnet. Local Hardhat content has been removed to avoid confusion.

Quick links
- RPC: https://testnet-passet-hub-eth-rpc.polkadot.io
- Chain ID: 420420422 (hex: 0x190f1b46)
- Contracts:
  - Paramify: 0x8ac041884E37281b6649326bBD9Fb210A5849a91
  - MockV3Aggregator: 0x8D6Bfc2169154911F83aFc6B5A4Ff7f86Ed205a6

1) Frontend starts but txs fail with Internal JSON-RPC error (-32603)
Symptoms
- Funding or other transactions fail with code -32603 and no detailed reason.

Causes
- The PassetHub adapter may not accept EIP-1559 fee fields or custom fee params on eth_sendTransaction.

Fix
- Let the node estimate fees by omitting fee fields; or use legacy gasPrice/gas if required by your provider configuration.
- The frontend uses a minimal transaction object for funding to maximize RPC compatibility.

2) Funding succeeds but balances differ between Admin and Customer
Symptoms
- Admin shows non-zero contract balance; Customer shows 0.

Cause
- Different read methods: contract getter vs direct chain balance.

Fix
- Both views should read balances using provider.getBalance(contractAddress) to ensure parity. The app now does this.

3) Buying insurance reverts during estimateGas
Symptoms
- Error: Transaction would fail: missing revert data (estimateGas CALL_EXCEPTION).
- Happens for specific coverage amounts (e.g., 3 ETH) but not lower values.

Causes
- Premium requirement: msg.value must be >= coverage / 10 (10%). Float rounding in the UI can underpay by a few wei on larger numbers.
- Existing active policy also causes a revert (only one active policy per address).

Fix
- Compute premium in integer wei (no JS floats). The app submits an exact wei value equal to coverage/10.
- Ensure no active policy exists for the wallet before purchasing again.

4) Esbuild permission denied on Linux
Symptoms
- npm run dev fails with EACCES on node_modules/@esbuild/.../bin/esbuild.

Fix
- Make the binary executable:
  chmod +x frontend/node_modules/@esbuild/linux-x64/bin/esbuild

5) MetaMask lacks “View on Explorer”
Cause
- Network added without blockExplorerUrls.

Fix
- Add PassetHub explorer URL to wallet_addEthereumChain once confirmed. Until then, copy tx hash from MetaMask and search in the explorer.

6) Node connectivity checks
Commands
- Get latest block:
  curl -X POST https://testnet-passet-hub-eth-rpc.polkadot.io -H "Content-Type: application/json" -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_blockNumber\",\"params\":[]}"
- Get contract balance:
  curl -X POST https://testnet-passet-hub-eth-rpc.polkadot.io -H "Content-Type: application/json" -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_getBalance\",\"params\":[\"0x8ac041884E37281b6649326bBD9Fb210A5849a91\",\"latest\"]}"
- Get transaction receipt:
  curl -X POST https://testnet-passet-hub-eth-rpc.polkadot.io -H "Content-Type: application/json" -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_getTransactionReceipt\",\"params\":[\"0x<txhash>\"]}"

Notes
- Ensure your wallet has test ETH on PassetHub.
- If RPC is unstable, retries may be necessary. Reduce custom gas settings when possible.
