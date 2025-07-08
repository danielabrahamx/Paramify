const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking network configuration...");
  
  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log("Chain ID:", network.chainId.toString());
  console.log("Network name:", network.name);
  
  // Test a simple call
  const blockNumber = await ethers.provider.getBlockNumber();
  console.log("Current block number:", blockNumber);
  
  // Check if we can get accounts
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
