const hre = require("hardhat");

/**
 * DEPRECATED: Legacy local/PolkaVM-local deployment script.
 * This project now deploys to PassetHub Testnet via Hardhat Ignition.
 * Use: npm run polkavm:deploy:passethub
 */
async function main() {
  console.log("Deploying contracts to PolkaVM...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Deploy MockV3Aggregator
  console.log("\nDeploying MockV3Aggregator...");
  const MockV3Aggregator = await hre.ethers.getContractFactory("MockV3Aggregator");
  const mockAggregator = await MockV3Aggregator.deploy(8, 200000000000); // 8 decimals, $2000 initial price
  await mockAggregator.waitForDeployment();
  const aggregatorAddress = await mockAggregator.getAddress();
  console.log("MockV3Aggregator deployed to:", aggregatorAddress);

  // Deploy Paramify
  console.log("\nDeploying Paramify...");
  const Paramify = await hre.ethers.getContractFactory("Paramify");
  const paramify = await Paramify.deploy(aggregatorAddress);
  await paramify.waitForDeployment();
  const paramifyAddress = await paramify.getAddress();
  console.log("Paramify deployed to:", paramifyAddress);

  console.log("\n✅ Deployment complete!");
  console.log("MockV3Aggregator:", aggregatorAddress);
  console.log("Paramify:", paramifyAddress);
  
  // NOTE: Legacy artifact writing disabled. pvm-deployment.json is not used on PassetHub.
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
