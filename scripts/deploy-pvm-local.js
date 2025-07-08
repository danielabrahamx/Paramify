const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🚀 Deploying Paramify contracts with PolkaVM...\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy MockV3Aggregator first
  console.log("📊 Deploying MockV3Aggregator...");
  const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
  const mockPriceFeed = await MockV3Aggregator.deploy(8, 2000e8); // 8 decimals, initial flood level: 20.00 feet
  await mockPriceFeed.waitForDeployment();
  const mockAddress = await mockPriceFeed.getAddress();
  console.log("✅ MockV3Aggregator deployed to:", mockAddress);

  // Deploy Paramify
  console.log("\n🏦 Deploying Paramify...");
  const Paramify = await ethers.getContractFactory("Paramify");
  const paramify = await Paramify.deploy(mockAddress);
  await paramify.waitForDeployment();
  const paramifyAddress = await paramify.getAddress();
  console.log("✅ Paramify deployed to:", paramifyAddress);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const decimals = await mockPriceFeed.decimals();
  const latestPrice = await mockPriceFeed.latestRoundData();
  console.log("MockV3Aggregator decimals:", decimals.toString());
  console.log("Initial flood level:", Number(latestPrice.answer) / 1e8, "feet");

  const threshold = await paramify.floodThreshold();
  const owner = await paramify.owner();
  console.log("Paramify threshold:", Number(threshold) / 1e11, "feet");
  console.log("Paramify owner:", owner);

  // Save deployment info
  const deployment = {
    network: "PolkaVM Local",
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    timestamp: new Date().toISOString(),
    contracts: {
      MockV3Aggregator: mockAddress,
      Paramify: paramifyAddress
    },
    deployer: deployer.address
  };

  fs.writeFileSync('pvm-deployment.json', JSON.stringify(deployment, null, 2));
  console.log("\n💾 Deployment info saved to pvm-deployment.json");

  console.log("\n🎉 PolkaVM deployment successful!");
  console.log("=====================================");
  console.log("MockV3Aggregator:", mockAddress);
  console.log("Paramify:", paramifyAddress);
  console.log("=====================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
