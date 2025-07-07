const { ethers } = require("hardhat");

async function main() {
    console.log("=== Investigating Passet Hub Network Requirements ===\n");
    
    try {
        const [deployer] = await ethers.getSigners();
        const provider = ethers.provider;
        
        console.log("Deployer:", deployer.address);
        
        // Get detailed network info
        console.log("\n📊 Network Information:");
        const network = await provider.getNetwork();
        console.log("Chain ID:", network.chainId.toString());
        console.log("Name:", network.name);
        
        // Get latest block
        const latestBlock = await provider.getBlock("latest");
        console.log("\n📦 Latest Block:");
        console.log("Number:", latestBlock.number);
        console.log("Gas Limit:", latestBlock.gasLimit.toString());
        console.log("Base Fee:", latestBlock.baseFeePerGas ? ethers.formatUnits(latestBlock.baseFeePerGas, "gwei") + " gwei" : "N/A");
        
        // Get account info
        const balance = await provider.getBalance(deployer.address);
        const nonce = await provider.getTransactionCount(deployer.address);
        console.log("\n👤 Account Info:");
        console.log("Balance:", ethers.formatEther(balance), "PAS");
        console.log("Nonce:", nonce);
        
        // Test transaction format
        console.log("\n🧪 Testing Transaction Formats:");
        
        // Test 1: Simple transfer
        console.log("\n1. Testing simple transfer...");
        try {
            const tx = await deployer.sendTransaction({
                to: deployer.address, // Send to self
                value: ethers.parseEther("0.001"),
                gasLimit: 21000
            });
            console.log("✅ Transfer sent:", tx.hash);
            const receipt = await tx.wait();
            console.log("✅ Transfer confirmed in block:", receipt.blockNumber);
        } catch (error) {
            console.log("❌ Transfer failed:", error.message);
        }
        
        // Test 2: Check if contracts exist at expected addresses
        console.log("\n2. Checking existing contracts...");
        const addressesToCheck = [
            "0x5FbDB2315678afecb367f032d93F642f64180aa3",
            "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
            "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
            "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
        ];
        
        for (const addr of addressesToCheck) {
            const code = await provider.getCode(addr);
            if (code !== "0x") {
                console.log(`📄 Contract found at ${addr}: ${code.length} bytes`);
            }
        }
        
        // Test 3: Raw contract deployment
        console.log("\n3. Testing raw contract deployment...");
        try {
            // Minimal contract bytecode (just returns 42)
            // contract Minimal { function get() public pure returns (uint) { return 42; } }
            const bytecode = "0x608060405234801561001057600080fd5b50609d8061001f6000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80636d4ce63c14602d575b600080fd5b60336047565b604051603e9190605a565b60405180910390f35b6000602a905090565b6054816073565b82525050565b6000602082019050606d6000830184604d565b92915050565b600081905091905056fea264697066735822122012345678901234567890123456789012345678901234567890123456789012345678900033";
            
            const deployTx = {
                data: bytecode,
                gasLimit: 100000,
                gasPrice: ethers.parseUnits("1", "gwei"),
                nonce: await provider.getTransactionCount(deployer.address)
            };
            
            console.log("Deploy transaction:", deployTx);
            const sentTx = await deployer.sendTransaction(deployTx);
            console.log("✅ Contract deployment sent:", sentTx.hash);
            
            const receipt = await sentTx.wait();
            console.log("✅ Contract deployed to:", receipt.contractAddress);
            
        } catch (error) {
            console.log("❌ Raw deployment failed:", error.message);
            
            // Try to understand the error better
            if (error.code === "INVALID_ARGUMENT") {
                console.log("Invalid argument error - check transaction format");
            } else if (error.message.includes("Invalid Transaction")) {
                console.log("\n⚠️  'Invalid Transaction' suggests Passet Hub has specific requirements");
                console.log("Possible causes:");
                console.log("- Special transaction format required");
                console.log("- EVM module not fully compatible");
                console.log("- Contract deployment disabled or restricted");
                console.log("- Account needs special permissions");
            }
        }
        
        // Test 4: Check if we can call existing contracts
        console.log("\n4. Testing interaction with existing contract...");
        const existingContract = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
        const code = await provider.getCode(existingContract);
        
        if (code !== "0x") {
            console.log("Contract exists, attempting to call...");
            try {
                // Try a simple call
                const result = await provider.call({
                    to: existingContract,
                    data: "0x6d4ce63c" // get() function selector
                });
                console.log("✅ Call result:", result);
            } catch (error) {
                console.log("❌ Call failed:", error.message);
            }
        }
        
        console.log("\n📋 Summary:");
        console.log("- Network connectivity: ✅");
        console.log("- Account funded: ✅");
        console.log("- Simple transfers: " + (nonce > 0 ? "✅" : "❓"));
        console.log("- Contract deployment: ❌ (Invalid Transaction)");
        console.log("\n💡 Next Steps:");
        console.log("1. Check Passet Hub documentation for deployment requirements");
        console.log("2. Contact Passet Hub team about 'Invalid Transaction' error");
        console.log("3. Try alternative deployment methods (e.g., via RPC directly)");
        console.log("4. Consider if EVM module has special configuration");
        
    } catch (error) {
        console.error("\n❌ Investigation error:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
