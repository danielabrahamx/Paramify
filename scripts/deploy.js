const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // Deploy MockV3Aggregator
  const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
  const mockPriceFeed = await MockV3Aggregator.deploy(8, 2000e8); // Initial flood level: 2000
  await mockPriceFeed.waitForDeployment();
  console.log("MockV3Aggregator deployed to:", await mockPriceFeed.getAddress());

  // Deploy Paramify
  const Paramify = await ethers.getContractFactory("Paramify");
  const paramify = await Paramify.deploy(await mockPriceFeed.getAddress());
  await paramify.waitForDeployment();
  console.log("Paramify deployed to:", await paramify.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
