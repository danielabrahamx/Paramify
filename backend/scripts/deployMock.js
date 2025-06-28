const { ethers, network } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Chain ID:", network.chainId);

    // Deploy mock contracts or the main contract here
    // For example, deploy a simple contract
    const simpleContract = await deployer.deploy("SimpleContract");
    await simpleContract.deployed();
    console.log("SimpleContract deployed to:", simpleContract.address);

    // Placeholder for actual contract deployment logic
    // Add your deployment code here
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
