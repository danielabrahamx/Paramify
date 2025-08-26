const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Checking balance for:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account Balance:", ethers.formatEther(balance), "ETH");

  // Check if balance is sufficient for deployment
  if (balance < ethers.parseEther("0.1")) {
    console.log("⚠️  WARNING: Low balance! You may need to fund this account.");
    console.log("   Consider using the already deployed contracts from .env file:");
    console.log("   - Paramify:", process.env.PARAMIFY_CONTRACT_ADDRESS);
    console.log("   - MockV3Aggregator:", process.env.MOCK_AGGREGATOR_ADDRESS);
  } else {
    console.log("✅ Sufficient balance for deployment");
  }
}

main().catch(console.error);