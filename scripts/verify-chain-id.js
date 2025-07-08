const { ethers } = require('ethers');

async function verifyChainId() {
  console.log("=== Chain ID Verification ===\n");
  
  try {
    // Connect to the local node
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    
    // Get network info
    const network = await provider.getNetwork();
    console.log("Connected to network:");
    console.log("- Chain ID:", network.chainId.toString());
    console.log("- Name:", network.name || "Unknown");
    
    // Expected chain ID for PolkaVM Local
    const expectedChainId = 420420420n;
    
    if (network.chainId === expectedChainId) {
      console.log("\n✅ Chain ID matches PolkaVM Local (420420420)");
      console.log("\nMetaMask Configuration:");
      console.log("- Network Name: PolkaVM Local");
      console.log("- New RPC URL: http://127.0.0.1:8545");  
      console.log("- Chain ID: 420420420");
      console.log("- Currency Symbol: ETH");
      console.log("- Block Explorer URL: (leave empty)");
    } else {
      console.log("\n❌ Chain ID mismatch!");
      console.log(`- Expected: ${expectedChainId}`);
      console.log(`- Actual: ${network.chainId}`);
      console.log("\nMake sure you're running the PolkaVM node, not Hardhat.");
    }
    
    // Test connection by getting latest block
    const blockNumber = await provider.getBlockNumber();
    console.log("\nLatest block:", blockNumber);
    
    // Get accounts
    const accounts = await provider.listAccounts();
    if (accounts.length > 0) {
      console.log("\nAvailable accounts:");
      accounts.forEach((acc, i) => {
        console.log(`${i + 1}. ${acc.address}`);
      });
    }
    
  } catch (error) {
    console.error("Error connecting to network:", error.message);
    console.log("\nTroubleshooting:");
    console.log("1. Make sure your PolkaVM node is running at http://127.0.0.1:8545");
    console.log("2. Check if the port is correct (8545)");
    console.log("3. Ensure no other blockchain nodes are running on the same port");
  }
}

verifyChainId()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
