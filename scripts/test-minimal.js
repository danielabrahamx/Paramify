const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("=== Testing Minimal Contract Deployment ===");
    console.log("Deployer:", deployer.address);
    console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "PAS");
    
    try {
        console.log("\n=== Deploying MinimalTest ===");
        const MinimalTest = await ethers.getContractFactory("contracts/MinimalTestContract.sol:MinimalTest");
        const minimal = await MinimalTest.deploy();
        
        console.log("Waiting for deployment...");
        await minimal.waitForDeployment();
        
        const address = await minimal.getAddress();
        console.log("✅ MinimalTestContract deployed to:", address);
        
        // Test basic functionality
        const value = await minimal.getValue();
        console.log("Initial value:", value.toString());
        
        const owner = await minimal.getOwner();
        console.log("Contract owner:", owner);
        
        console.log("\n✅ SUCCESS: Contract deployment and basic functionality working!");
        
    } catch (error) {
        console.error("❌ Minimal contract deployment failed:", error);
        
        // Check if it's the same error
        if (error.message.includes("CodeRejected")) {
            console.log("\n🚨 CRITICAL: Even minimal contract fails with CodeRejected");
            console.log("This suggests a fundamental issue with Passet Hub testnet");
            console.log("Possible causes:");
            console.log("1. EVM functionality not fully enabled on Passet Hub testnet");
            console.log("2. Account permissions/allowlist restrictions");
            console.log("3. Runtime module configuration issues");
            console.log("4. Network-specific deployment restrictions");
        }
        
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Script failed:", error);
        process.exit(1);
    });
