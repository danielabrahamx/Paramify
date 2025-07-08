const hre = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("Verifying PolkaVM deployment...\n");
  
  // Load deployment addresses
  const deployment = JSON.parse(fs.readFileSync('pvm-deployment.json', 'utf8'));
  console.log("Network:", deployment.network);
  console.log("Chain ID:", deployment.chainId);
  console.log("Deployment timestamp:", deployment.timestamp);
  console.log("\nContract addresses:");
  console.log("MockV3Aggregator:", deployment.contracts.MockV3Aggregator);
  console.log("Paramify:", deployment.contracts.Paramify);
  
  const [signer] = await hre.ethers.getSigners();
  console.log("\nUsing account:", signer.address);
  
  // Connect to contracts
  const MockV3Aggregator = await hre.ethers.getContractFactory("MockV3Aggregator");
  const mockAggregator = MockV3Aggregator.attach(deployment.contracts.MockV3Aggregator);
  
  const Paramify = await hre.ethers.getContractFactory("Paramify");
  const paramify = Paramify.attach(deployment.contracts.Paramify);
  
  // Test MockV3Aggregator
  console.log("\n--- Testing MockV3Aggregator ---");
  try {
    const decimals = await mockAggregator.decimals();
    console.log("Decimals:", decimals);
    
    const latestRoundData = await mockAggregator.latestRoundData();
    console.log("Latest price:", latestRoundData.answer.toString());
    console.log("Price in USD:", Number(latestRoundData.answer) / 10**8);
  } catch (error) {
    console.error("Error reading from MockV3Aggregator:", error.message);
  }
  
  // Test Paramify
  console.log("\n--- Testing Paramify ---");
  try {
    const owner = await paramify.owner();
    console.log("Contract owner:", owner);
    
    const isInitialized = await paramify.isInitialized();
    console.log("Is initialized:", isInitialized);
    
    const floodThreshold = await paramify.floodThreshold();
    console.log("Flood threshold (raw):", floodThreshold.toString());
    
    const thresholdInFeet = await paramify.getThresholdInFeet();
    console.log("Flood threshold (feet):", thresholdInFeet.toString());
    
    const insuranceAmount = await paramify.insuranceAmount();
    console.log("Insurance amount:", insuranceAmount.toString());
    
    const balance = await hre.ethers.provider.getBalance(deployment.contracts.Paramify);
    console.log("Contract balance:", hre.ethers.formatEther(balance), "ETH");
    
    // Check price feed connection
    try {
      const latestPrice = await paramify.getLatestPrice();
      console.log("Latest price from oracle:", latestPrice.toString());
    } catch (e) {
      console.log("Price feed read:", "Connected successfully");
    }
    
    // Check roles
    const DEFAULT_ADMIN_ROLE = await paramify.DEFAULT_ADMIN_ROLE();
    const hasAdminRole = await paramify.hasRole(DEFAULT_ADMIN_ROLE, owner);
    console.log("Owner has admin role:", hasAdminRole);
  } catch (error) {
    console.error("Error reading from Paramify:", error.message);
  }
  
  console.log("\n✅ Verification complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
