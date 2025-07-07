const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("=== Deploying Simplified Contracts to Passet Hub ===");
    console.log("Deployer account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "PAS");
    
    try {
        // Get network info
        const network = await ethers.provider.getNetwork();
        console.log("Network:", network.name);
        console.log("Chain ID:", network.chainId);
        
        // First, deploy the mock aggregator
        console.log("\n=== Deploying MockV3Aggregator ===");
        const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
        const mockPriceFeed = await MockV3Aggregator.deploy(8, 2000e8);
        
        console.log("Waiting for MockV3Aggregator deployment...");
        await mockPriceFeed.waitForDeployment();
        const mockAddress = await mockPriceFeed.getAddress();
        console.log("✅ MockV3Aggregator deployed to:", mockAddress);
        
        // Now deploy the simplified Paramify contract
        console.log("\n=== Deploying ParamifySimple ===");
        const ParamifySimple = await ethers.getContractFactory("ParamifySimple");
        const paramify = await ParamifySimple.deploy(mockAddress);
        
        console.log("Waiting for ParamifySimple deployment...");
        await paramify.waitForDeployment();
        const paramifyAddress = await paramify.getAddress();
        console.log("✅ ParamifySimple deployed to:", paramifyAddress);
        
        // Test basic functionality
        console.log("\n=== Testing Basic Functions ===");
        
        // Test threshold getter
        const threshold = await paramify.getCurrentThreshold();
        console.log("Current threshold:", threshold.toString(), "units");
        
        const thresholdInFeet = await paramify.getThresholdInFeet();
        console.log("Current threshold:", thresholdInFeet.toString(), "feet");
        
        // Test oracle data
        const price = await paramify.getLatestPrice();
        console.log("Current flood level:", price.toString(), "units");
        
        console.log("\n=== Deployment Summary ===");
        console.log("Network: Passet Hub Testnet");
        console.log("Chain ID:", network.chainId);
        console.log("MockV3Aggregator:", mockAddress);
        console.log("ParamifySimple:", paramifyAddress);
        console.log("Deployer:", deployer.address);
        
        console.log("\n=== Contract Addresses for Configuration ===");
        console.log("Update your .env file:");
        console.log(`PARAMIFY_ADDRESS="${paramifyAddress}"`);
        console.log(`MOCK_ORACLE_ADDRESS="${mockAddress}"`);
        
        console.log("\n=== Next Steps ===");
        console.log("1. Update backend/.env with the contract addresses above");
        console.log("2. Update frontend/src/lib/contract.ts with the contract addresses");
        console.log("3. Update the ABI in contract.ts if needed");
        console.log("4. Test the dApp with MetaMask connected to Passet Hub testnet");
        
    } catch (error) {
        console.error("❌ Deployment failed:", error);
        
        // More detailed error analysis
        if (error.message.includes("CodeRejected")) {
            console.log("\n🔍 CodeRejected Error - Possible Issues:");
            console.log("1. Passet Hub testnet may not support certain opcodes");
            console.log("2. Contract may be too complex for the network");
            console.log("3. There might be specific runtime restrictions");
            console.log("4. The account may need specific permissions");
        }
        
        if (error.message.includes("insufficient funds")) {
            console.log("\n💰 Insufficient Funds - Get testnet tokens:");
            console.log("1. Request PAS tokens from Passet Hub faucet");
            console.log("2. Check if your account has enough PAS for gas");
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
