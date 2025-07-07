const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Passet Hub Deployment Solution");
    console.log("=================================\n");
    
    try {
        const [deployer] = await ethers.getSigners();
        const provider = ethers.provider;
        
        console.log("Deployer:", deployer.address);
        
        // Get current state
        const balance = await provider.getBalance(deployer.address);
        const nonce = await provider.getTransactionCount(deployer.address);
        console.log("Balance:", ethers.formatEther(balance), "PAS");
        console.log("Current nonce:", nonce);
        
        // Get network info
        const network = await provider.getNetwork();
        const latestBlock = await provider.getBlock("latest");
        console.log("\nNetwork:", network.name);
        console.log("Chain ID:", network.chainId.toString());
        console.log("Block number:", latestBlock.number);
        console.log("Gas limit:", latestBlock.gasLimit.toString());
        
        // SOLUTION 1: Try different transaction formats
        console.log("\n📋 Solution 1: Testing transaction formats");
        
        // Test with legacy transaction
        console.log("\nTrying legacy transaction format...");
        try {
            const legacyTx = {
                to: deployer.address,
                value: 1n, // 1 wei
                gasLimit: 21000,
                gasPrice: 1000000n, // 0.001 gwei
                nonce: nonce,
                type: 0 // Legacy transaction
            };
            
            const tx = await deployer.sendTransaction(legacyTx);
            console.log("✅ Legacy transaction sent:", tx.hash);
            await tx.wait();
        } catch (error) {
            console.log("❌ Legacy format failed:", error.message);
        }
        
        // SOLUTION 2: Deploy to local network first, then check differences
        console.log("\n📋 Solution 2: Deploying to local network for comparison");
        
        // First, let me check if the contracts are already deployed locally
        const localAddresses = {
            oracle: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
            paramify: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
        };
        
        console.log("\nChecking if contracts exist locally...");
        for (const [name, addr] of Object.entries(localAddresses)) {
            const code = await provider.getCode(addr);
            if (code !== "0x") {
                console.log(`✅ ${name} exists at ${addr} (${code.length} bytes)`);
            }
        }
        
        // SOLUTION 3: Use a different approach - deploy contracts without Hardhat
        console.log("\n📋 Solution 3: Raw deployment without Hardhat abstractions");
        
        try {
            // Get the compiled bytecode directly
            const SimpleTest = await ethers.getContractFactory("SimpleTest");
            const bytecode = SimpleTest.bytecode;
            
            console.log("SimpleTest bytecode length:", bytecode.length);
            
            // Create deployment transaction manually
            const deployData = bytecode;
            
            // Try with minimal gas settings
            const deployTx = {
                data: deployData,
                gasLimit: 1000000n,
                gasPrice: 1000000n, // Very low gas price
                nonce: await provider.getTransactionCount(deployer.address),
                chainId: 420420422,
                type: 0 // Force legacy transaction
            };
            
            console.log("Deployment transaction:", {
                ...deployTx,
                data: deployTx.data.substring(0, 50) + "..."
            });
            
            // Sign and send manually
            const signedTx = await deployer.signTransaction(deployTx);
            console.log("Signed transaction:", signedTx.substring(0, 100) + "...");
            
            const txResponse = await provider.broadcastTransaction(signedTx);
            console.log("✅ Transaction broadcast:", txResponse.hash);
            
            const receipt = await txResponse.wait();
            console.log("✅ Contract deployed to:", receipt.contractAddress);
            
        } catch (error) {
            console.log("❌ Raw deployment failed:", error.message);
            
            // FINAL SOLUTION: Provide clear instructions
            console.log("\n🔍 CRITICAL FINDING:");
            console.log("Passet Hub appears to have restrictions on contract deployment.");
            console.log("\n📋 RECOMMENDED ACTIONS:");
            console.log("1. Contact Passet Hub team directly about deployment requirements");
            console.log("2. Check if there's a whitelist for contract deployers");
            console.log("3. Verify if EVM module is fully enabled on the testnet");
            console.log("4. Consider using an alternative testnet that's fully EVM-compatible");
            
            console.log("\n💡 ALTERNATIVE TESTNETS:");
            console.log("- Ethereum Sepolia: Fully compatible, well-supported");
            console.log("- Polygon Mumbai: Fast, cheap, EVM-compatible");
            console.log("- Avalanche Fuji: High performance, EVM-compatible");
            console.log("- Base Goerli: Optimism-based, EVM-compatible");
            
            console.log("\n📝 TEMPORARY WORKAROUND:");
            console.log("For demo purposes, you can:");
            console.log("1. Deploy to local Hardhat network");
            console.log("2. Use 'npx hardhat node' to run persistent local blockchain");
            console.log("3. Deploy contracts: 'npx hardhat run scripts/deploy.js'");
            console.log("4. Frontend will work with local contracts");
        }
        
    } catch (error) {
        console.error("\n❌ Script error:", error);
    }
}

// Helper to update configuration files
async function updateConfigs(oracleAddress, paramifyAddress) {
    console.log("\n📝 Updating configuration files...");
    
    // Update backend .env
    const backendEnvPath = path.join(__dirname, "..", "backend", ".env");
    let backendEnvContent = fs.readFileSync(backendEnvPath, "utf8");
    
    backendEnvContent = backendEnvContent.replace(
        /PARAMIFY_ADDRESS=.*/,
        `PARAMIFY_ADDRESS=${paramifyAddress}`
    );
    backendEnvContent = backendEnvContent.replace(
        /MOCK_ORACLE_ADDRESS=.*/,
        `MOCK_ORACLE_ADDRESS=${oracleAddress}`
    );
    
    fs.writeFileSync(backendEnvPath, backendEnvContent);
    console.log("✅ Updated backend/.env");
    
    // Update frontend .env
    const frontendEnvPath = path.join(__dirname, "..", "frontend", ".env");
    let frontendEnvContent = fs.readFileSync(frontendEnvPath, "utf8");
    
    frontendEnvContent = frontendEnvContent.replace(
        /VITE_PARAMIFY_ADDRESS=.*/,
        `VITE_PARAMIFY_ADDRESS="${paramifyAddress}"`
    );
    frontendEnvContent = frontendEnvContent.replace(
        /VITE_MOCK_ORACLE_ADDRESS=.*/,
        `VITE_MOCK_ORACLE_ADDRESS="${oracleAddress}"`
    );
    
    fs.writeFileSync(frontendEnvPath, frontendEnvContent);
    console.log("✅ Updated frontend/.env");
    
    // Update frontend contract.ts
    const contractTsPath = path.join(__dirname, "..", "frontend", "src", "lib", "contract.ts");
    let contractContent = fs.readFileSync(contractTsPath, "utf8");
    
    contractContent = contractContent.replace(
        /export const PARAMIFY_ADDRESS = ".*";/,
        `export const PARAMIFY_ADDRESS = "${paramifyAddress}";`
    );
    contractContent = contractContent.replace(
        /export const MOCK_ORACLE_ADDRESS = ".*";/,
        `export const MOCK_ORACLE_ADDRESS = "${oracleAddress}";`
    );
    
    fs.writeFileSync(contractTsPath, contractContent);
    console.log("✅ Updated frontend/src/lib/contract.ts");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
