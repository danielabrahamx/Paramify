const { ethers } = require("hardhat");

async function main() {
    console.log("=== Testing Minimal Contract Deployment on Passet Hub ===\n");
    
    try {
        const [deployer] = await ethers.getSigners();
        console.log("Deployer:", deployer.address);
        
        // Get balance
        const balance = await ethers.provider.getBalance(deployer.address);
        console.log("Balance:", ethers.formatEther(balance), "PAS");
        
        // Create the absolutely minimal contract inline
        console.log("\n📝 Creating minimal contract...");
        
        // Minimal contract: just a constructor that does nothing
        const minimalBytecode = "0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fdfea26469706673582212206e8c8e5b7c6d7f8e9f0a1b2c3d4e5f6071829394a5b6c7d8e9f0a1b2c3d4e5f64736f6c63430008130033";
        
        // Deploy using raw transaction
        console.log("Sending deployment transaction...");
        
        const tx = {
            from: deployer.address,
            data: minimalBytecode,
            gasLimit: 100000,
            gasPrice: ethers.parseUnits("1", "gwei")
        };
        
        try {
            const sentTx = await deployer.sendTransaction(tx);
            console.log("Transaction sent:", sentTx.hash);
            
            const receipt = await sentTx.wait();
            console.log("✅ Contract deployed!");
            console.log("Contract address:", receipt.contractAddress);
            console.log("Block number:", receipt.blockNumber);
            console.log("Gas used:", receipt.gasUsed.toString());
            
        } catch (error) {
            console.log("❌ Deployment failed:", error.message);
            
            if (error.data) {
                console.log("Error data:", error.data);
            }
        }
        
        // Test with a different approach - using CREATE2
        console.log("\n📝 Testing CREATE2 deployment...");
        
        // Try deploying the SimpleTest contract
        const SimpleTest = await ethers.getContractFactory("SimpleTest");
        console.log("SimpleTest bytecode size:", SimpleTest.bytecode.length / 2, "bytes");
        
        try {
            const simpleTest = await SimpleTest.deploy({
                gasLimit: 300000,
                gasPrice: ethers.parseUnits("1", "gwei")
            });
            
            console.log("Waiting for deployment...");
            await simpleTest.waitForDeployment();
            
            const address = await simpleTest.getAddress();
            console.log("✅ SimpleTest deployed to:", address);
            
            // Test the contract
            const value = await simpleTest.value();
            console.log("Initial value:", value.toString());
            
        } catch (error) {
            console.log("❌ SimpleTest deployment failed:", error.message);
            
            // Check if it's the CodeRejected error
            if (error.message.includes("CodeRejected")) {
                console.log("\n🔍 CodeRejected Error Details:");
                console.log("Module index:", error.message.match(/index: (\d+)/)?.[1]);
                console.log("Error code:", error.message.match(/error: \[([\d, ]+)\]/)?.[1]);
                
                console.log("\n💡 This suggests Passet Hub has specific requirements for contract deployment.");
                console.log("Possible solutions:");
                console.log("1. Check if contracts need to be whitelisted");
                console.log("2. Verify if there's a specific deployment process for Passet Hub");
                console.log("3. Check if EVM module has special configuration");
                console.log("4. Contact Passet Hub team for deployment requirements");
            }
        }
        
    } catch (error) {
        console.error("\n❌ Script error:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
