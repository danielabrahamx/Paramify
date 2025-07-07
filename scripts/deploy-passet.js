const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "PAS");
    
    try {
        // First, let's try to deploy the mock aggregator alone
        console.log("\n=== Deploying MockV3Aggregator ===");
        const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
        console.log("Contract factory created successfully");
        
        const mockPriceFeed = await MockV3Aggregator.deploy(8, 2000e8);
        console.log("Deployment transaction sent, waiting for confirmation...");
        
        await mockPriceFeed.waitForDeployment();
        const mockAddress = await mockPriceFeed.getAddress();
        console.log("✅ MockV3Aggregator deployed to:", mockAddress);
        
        // Now deploy Paramify
        console.log("\n=== Deploying Paramify ===");
        const Paramify = await ethers.getContractFactory("Paramify");
        console.log("Contract factory created successfully");
        
        const paramify = await Paramify.deploy(mockAddress);
        console.log("Deployment transaction sent, waiting for confirmation...");
        
        await paramify.waitForDeployment();
        const paramifyAddress = await paramify.getAddress();
        console.log("✅ Paramify deployed to:", paramifyAddress);
        
        console.log("\n=== Deployment Summary ===");
        console.log("MockV3Aggregator:", mockAddress);
        console.log("Paramify:", paramifyAddress);
        console.log("Network: Passet Hub Testnet");
        console.log("Chain ID: 420420422");
        
        // Save deployment info
        const deploymentInfo = {
            network: "passetHub",
            chainId: 420420422,
            contracts: {
                MockV3Aggregator: mockAddress,
                Paramify: paramifyAddress
            },
            deployer: deployer.address,
            timestamp: new Date().toISOString()
        };
        
        console.log("\n=== Next Steps ===");
        console.log("1. Update frontend contract addresses");
        console.log("2. Test the dApp with MetaMask connected to Passet Hub");
        console.log("3. Verify contracts are working correctly");
        
        return deploymentInfo;
        
    } catch (error) {
        console.error("❌ Deployment failed:", error);
        
        if (error.message.includes("CodeRejected")) {
            console.log("\n🔍 CodeRejected Error Analysis:");
            console.log("This error can occur due to:");
            console.log("1. Contract bytecode too large (>24576 bytes)");
            console.log("2. Invalid contract code or constructor parameters");
            console.log("3. Network-specific validation rules");
            console.log("4. Gas limit issues");
            
            // Check contract size
            try {
                const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
                const mockBytecode = MockV3Aggregator.bytecode;
                console.log("MockV3Aggregator bytecode size:", mockBytecode.length / 2, "bytes");
                
                const Paramify = await ethers.getContractFactory("Paramify");
                const paramifyBytecode = Paramify.bytecode;
                console.log("Paramify bytecode size:", paramifyBytecode.length / 2, "bytes");
                
                if (mockBytecode.length / 2 > 24576 || paramifyBytecode.length / 2 > 24576) {
                    console.log("⚠️  Contract size exceeds 24KB limit!");
                }
            } catch (e) {
                console.log("Could not analyze contract size:", e.message);
            }
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
