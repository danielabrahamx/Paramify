const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("Testing simple contract deployment to Passet Hub");
    console.log("Deployer:", deployer.address);
    console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "PAS");
    
    try {
        console.log("\n=== Deploying SimpleTest ===");
        const SimpleTest = await ethers.getContractFactory("SimpleTest");
        console.log("Contract factory created");
        
        const simple = await SimpleTest.deploy();
        console.log("Deployment transaction sent");
        
        await simple.waitForDeployment();
        const address = await simple.getAddress();
        console.log("✅ SimpleTest deployed to:", address);
        
        // Test basic functionality
        console.log("\n=== Testing Contract ===");
        const number = await simple.getNumber();
        console.log("Initial number:", number.toString());
        
        const tx = await simple.setNumber(123);
        await tx.wait();
        console.log("Set number to 123");
        
        const newNumber = await simple.getNumber();
        console.log("New number:", newNumber.toString());
        
        console.log("\n✅ Simple contract deployment successful!");
        
    } catch (error) {
        console.error("❌ Simple deployment failed:", error);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Script failed:", error);
        process.exit(1);
    });
