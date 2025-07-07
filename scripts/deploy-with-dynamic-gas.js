const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("=== Passet Hub Deployment with Dynamic Gas ===");
    console.log("Deployer:", deployer.address);
    console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "PAS");
    
    try {
        // Get fee data from the network
        const feeData = await ethers.provider.getFeeData();
        console.log("Network fee data:", {
            gasPrice: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, "gwei") + " gwei" : "null",
            maxFeePerGas: feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, "gwei") + " gwei" : "null",
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, "gwei") + " gwei" : "null"
        });
        
        console.log("\n=== Deploying SimpleTest ===");
        const SimpleTest = await ethers.getContractFactory("SimpleTest");
        console.log("Contract factory created");
        
        // Try deployment with explicit gas settings based on network
        const deploymentTx = {
            gasPrice: feeData.gasPrice,
        };
        
        console.log("Attempting deployment with network gas settings...");
        const simple = await SimpleTest.deploy(deploymentTx);
        console.log("Deployment transaction sent:", simple.deploymentTransaction().hash);
        
        console.log("Waiting for deployment confirmation...");
        await simple.waitForDeployment();
        
        const address = await simple.getAddress();
        console.log("✅ SimpleTest deployed to:", address);
        
        // Test the contract
        console.log("\n=== Testing Contract ===");
        const number = await simple.getNumber();
        console.log("Initial number:", number.toString());
        
        const setTx = await simple.setNumber(456, { gasPrice: feeData.gasPrice });
        console.log("Set number transaction sent:", setTx.hash);
        
        await setTx.wait();
        console.log("Transaction confirmed");
        
        const newNumber = await simple.getNumber();
        console.log("New number:", newNumber.toString());
        
        console.log("\n✅ Contract deployment and testing successful!");
        
    } catch (error) {
        console.error("❌ Deployment failed:", error);
        
        if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
            console.log("\n🔍 Trying manual gas estimation...");
            try {
                const SimpleTest = await ethers.getContractFactory("SimpleTest");
                const deployData = SimpleTest.interface.encodeDeploy([]);
                
                const gasEstimate = await ethers.provider.estimateGas({
                    data: SimpleTest.bytecode + deployData.slice(2),
                    from: deployer.address
                });
                
                console.log("Manual gas estimate:", gasEstimate.toString());
            } catch (e) {
                console.error("Manual gas estimation failed:", e.message);
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
