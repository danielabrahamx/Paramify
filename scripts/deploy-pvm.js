const hre = require("hardhat");

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
  
  // Save deployment addresses
  const fs = require('fs');
  const deployment = {
    network: "localNode",
    chainId: 420420420,
    contracts: {
      MockV3Aggregator: aggregatorAddress,
      Paramify: paramifyAddress
    },
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync('pvm-deployment.json', JSON.stringify(deployment, null, 2));
  console.log("\nDeployment addresses saved to pvm-deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
