const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("=== Passet Hub Network Analysis ===");
    console.log("Account:", deployer.address);
    
    try {
        const balance = await ethers.provider.getBalance(deployer.address);
        console.log("Balance:", ethers.formatEther(balance), "PAS");
        
        const network = await ethers.provider.getNetwork();
        console.log("Network:", network.name);
        console.log("Chain ID:", network.chainId);
        
        const blockNumber = await ethers.provider.getBlockNumber();
        console.log("Current block:", blockNumber);
        
        const feeData = await ethers.provider.getFeeData();
        console.log("Fee data:", {
            gasPrice: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, "gwei") + " gwei" : "null",
            maxFeePerGas: feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, "gwei") + " gwei" : "null",
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, "gwei") + " gwei" : "null"
        });
        
        // Try to get block details
        const block = await ethers.provider.getBlock("latest");
        console.log("Latest block:");
        console.log("  Hash:", block.hash);
        console.log("  Number:", block.number);
        console.log("  Gas limit:", block.gasLimit);
        console.log("  Gas used:", block.gasUsed);
        console.log("  Timestamp:", new Date(block.timestamp * 1000).toISOString());
        
        // Try to estimate gas for a simple transaction
        console.log("\n=== Gas Estimation Test ===");
        const testTx = {
            to: "0x0000000000000000000000000000000000000000",
            value: ethers.parseEther("0.001"),
            data: "0x"
        };
        
        const gasEstimate = await ethers.provider.estimateGas(testTx);
        console.log("Gas estimate for simple transfer:", gasEstimate);
        
        console.log("\n=== Transaction Test ===");
        // Try sending a small amount to self
        const selfTx = {
            to: deployer.address,
            value: ethers.parseEther("0.001"),
            gasLimit: 21000
        };
        
        const txResponse = await deployer.sendTransaction(selfTx);
        console.log("Self-transaction sent:", txResponse.hash);
        
        const receipt = await txResponse.wait();
        console.log("Transaction confirmed in block:", receipt.blockNumber);
        console.log("Gas used:", receipt.gasUsed);
        
    } catch (error) {
        console.error("Error during analysis:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Script failed:", error);
        process.exit(1);
    });
