const { ethers } = require("hardhat");

async function main() {
    console.log("=== PolkaVM Deployment Verification ===");
    
    const [deployer] = await ethers.getSigners();
    console.log("Account:", deployer.address);
    
    // Check network
    const network = await ethers.provider.getNetwork();
    console.log("Network:", network.name, "Chain ID:", network.chainId.toString());
    
    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Balance:", ethers.formatEther(balance), "PAS");
    
    // Try to get contract factories to verify compilation
    try {
        const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
        console.log("✓ MockV3Aggregator factory loaded");
        
        const Paramify = await ethers.getContractFactory("Paramify");
        console.log("✓ Paramify factory loaded");
        
        // Check bytecode sizes
        const mockBytecode = MockV3Aggregator.bytecode;
        const mockSize = mockBytecode.length / 2;
        console.log("MockV3Aggregator bytecode size:", mockSize, "bytes");
        
        const paramifyBytecode = Paramify.bytecode;
        const paramifySize = paramifyBytecode.length / 2;
        console.log("Paramify bytecode size:", paramifySize, "bytes");
        
        // PolkaVM has a 100KB limit
        if (mockSize > 100000) {
            console.error("❌ MockV3Aggregator exceeds PolkaVM 100KB limit");
        } else {
            console.log("✓ MockV3Aggregator within PolkaVM size limit");
        }
        
        if (paramifySize > 100000) {
            console.error("❌ Paramify exceeds PolkaVM 100KB limit");
        } else {
            console.log("✓ Paramify within PolkaVM size limit");
        }
        
    } catch (error) {
        console.error("Error loading contract factories:", error.message);
        throw error;
    }
    
    console.log("\n=== Verification Complete ===");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Verification failed:", error);
        process.exit(1);
    });
