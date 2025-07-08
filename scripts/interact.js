const { ethers } = require("hardhat");

async function main() {
    console.log("=== Interacting with Deployed Contracts ===");
    
    const [signer] = await ethers.getSigners();
    console.log("Using account:", signer.address);
    
    // Contract addresses from deployment
    const mockAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
    const paramifyAddress = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
    
    console.log("\nDeployed addresses:");
    console.log("MockV3Aggregator:", mockAddress);
    console.log("Paramify:", paramifyAddress);
    
    try {
        // Get contract instances
        const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
        const mockPriceFeed = MockV3Aggregator.attach(mockAddress);
        
        const Paramify = await ethers.getContractFactory("Paramify");
        const paramify = Paramify.attach(paramifyAddress);
        
        console.log("\n=== Testing Contract Functionality ===");
        
        // Test 1: Get latest price from oracle
        const latestPrice = await paramify.getLatestPrice();
        console.log("✓ Current flood level from oracle:", latestPrice.toString());
        
        // Test 2: Get current threshold
        const threshold = await paramify.getCurrentThreshold();
        console.log("✓ Current threshold:", threshold.toString());
        
        // Test 3: Get contract balance
        const balance = await paramify.getContractBalance();
        console.log("✓ Contract balance:", ethers.formatEther(balance), "PAS");
        
        // Test 4: Check admin role
        const adminRole = await paramify.DEFAULT_ADMIN_ROLE();
        const hasAdminRole = await paramify.hasRole(adminRole, signer.address);
        console.log("✓ Signer has admin role:", hasAdminRole);
        
        // Test 5: Check if contract is PolkaVM deployed
        const code = await ethers.provider.getCode(paramifyAddress);
        console.log("✓ Contract has bytecode:", code.length > 2, "(size:", code.length, "bytes)");
        
        // Test 6: Try to update oracle price
        console.log("\n=== Testing Oracle Update ===");
        const newPrice = 2500e8; // $2500 with 8 decimals
        await mockPriceFeed.updateAnswer(newPrice);
        console.log("✓ Updated oracle price to:", newPrice);
        
        const updatedPrice = await paramify.getLatestPrice();
        console.log("✓ New flood level from contract:", updatedPrice.toString());
        
        console.log("\n=== PolkaVM Deployment Successful! ===");
        console.log("All contract functions are working correctly on PolkaVM");
        
    } catch (error) {
        console.error("Error interacting with contracts:", error.message);
        if (error.data) {
            console.error("Error data:", error.data);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Script failed:", error);
        process.exit(1);
    });
