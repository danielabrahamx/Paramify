const { ethers } = require("hardhat");

async function main() {
    console.log("🔧 Testing Passet Hub Transaction Formats");
    console.log("========================================");
    
    const [deployer] = await ethers.getSigners();
    console.log("Account:", deployer.address);
    
    // Check network
    const network = await ethers.provider.getNetwork();
    console.log("Network:", network.name, "Chain ID:", network.chainId);
    
    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Balance:", ethers.formatEther(balance), "PAS");
    
    // Get fee data
    const feeData = await ethers.provider.getFeeData();
    console.log("Fee data:", {
        gasPrice: feeData.gasPrice?.toString(),
        maxFeePerGas: feeData.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString()
    });
    
    try {
        console.log("\n🧪 Test 1: Simple self-transfer");
        const tx1 = await deployer.sendTransaction({
            to: deployer.address,
            value: ethers.parseEther("0.001")
        });
        
        console.log("✅ Self-transfer successful:", tx1.hash);
        await tx1.wait();
        console.log("✅ Transaction confirmed");
        
    } catch (error) {
        console.error("❌ Self-transfer failed:", error.message);
    }
    
    try {
        console.log("\n🧪 Test 2: Contract deployment with automatic gas");
        const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
        
        // Let ethers handle gas estimation automatically
        const mockPriceFeed = await MockV3Aggregator.deploy(8, 2000e8);
        console.log("✅ Deploy transaction sent:", mockPriceFeed.deploymentTransaction().hash);
        
        await mockPriceFeed.waitForDeployment();
        const mockAddress = await mockPriceFeed.getAddress();
        console.log("✅ MockV3Aggregator deployed to:", mockAddress);
        
    } catch (error) {
        console.error("❌ Contract deployment failed:", error.message);
    }
    
    try {
        console.log("\n🧪 Test 3: Manual gas settings");
        const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
        
        // Use the exact gas settings from the network
        const mockPriceFeed = await MockV3Aggregator.deploy(8, 2000e8, {
            gasPrice: feeData.gasPrice,
            gasLimit: 1000000
        });
        
        console.log("✅ Deploy transaction sent:", mockPriceFeed.deploymentTransaction().hash);
        await mockPriceFeed.waitForDeployment();
        const mockAddress = await mockPriceFeed.getAddress();
        console.log("✅ MockV3Aggregator deployed to:", mockAddress);
        
    } catch (error) {
        console.error("❌ Manual gas deployment failed:", error.message);
    }
    
    try {
        console.log("\n🧪 Test 4: EIP-1559 transaction");
        const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
        
        // Use EIP-1559 format
        const mockPriceFeed = await MockV3Aggregator.deploy(8, 2000e8, {
            maxFeePerGas: feeData.maxFeePerGas,
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
            gasLimit: 1000000
        });
        
        console.log("✅ Deploy transaction sent:", mockPriceFeed.deploymentTransaction().hash);
        await mockPriceFeed.waitForDeployment();
        const mockAddress = await mockPriceFeed.getAddress();
        console.log("✅ MockV3Aggregator deployed to:", mockAddress);
        
    } catch (error) {
        console.error("❌ EIP-1559 deployment failed:", error.message);
    }
    
    try {
        console.log("\n🧪 Test 5: Legacy transaction format");
        const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
        
        // Force legacy transaction format
        const mockPriceFeed = await MockV3Aggregator.deploy(8, 2000e8, {
            gasPrice: feeData.gasPrice,
            gasLimit: 1000000,
            type: 0 // Legacy transaction
        });
        
        console.log("✅ Deploy transaction sent:", mockPriceFeed.deploymentTransaction().hash);
        await mockPriceFeed.waitForDeployment();
        const mockAddress = await mockPriceFeed.getAddress();
        console.log("✅ MockV3Aggregator deployed to:", mockAddress);
        
    } catch (error) {
        console.error("❌ Legacy transaction deployment failed:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Script failed:", error);
        process.exit(1);
    });
