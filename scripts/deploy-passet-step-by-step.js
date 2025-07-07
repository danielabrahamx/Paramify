const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function deployContract(contractName, args = [], options = {}) {
    try {
        console.log(`\n📋 Deploying ${contractName}...`);
        const Contract = await ethers.getContractFactory(contractName);
        console.log(`Bytecode size: ${Contract.bytecode.length / 2} bytes`);
        
        // Deploy with minimal options first
        const deployOptions = {
            gasLimit: options.gasLimit || 3000000,
            ...options
        };
        
        console.log("Deploy options:", deployOptions);
        console.log("Constructor args:", args);
        
        const contract = await Contract.deploy(...args, deployOptions);
        console.log(`Waiting for ${contractName} deployment...`);
        
        await contract.waitForDeployment();
        const address = await contract.getAddress();
        
        console.log(`✅ ${contractName} deployed to:`, address);
        return contract;
        
    } catch (error) {
        console.error(`❌ Failed to deploy ${contractName}:`, error.message);
        if (error.data) {
            console.log("Error data:", error.data);
        }
        throw error;
    }
}

async function main() {
    console.log("🚀 Step-by-Step Deployment to Passet Hub Testnet");
    console.log("===============================================\n");
    
    try {
        const [deployer] = await ethers.getSigners();
        console.log("Deployer:", deployer.address);
        
        const balance = await ethers.provider.getBalance(deployer.address);
        console.log("Balance:", ethers.formatEther(balance), "PAS");
        
        // Get network info
        const network = await ethers.provider.getNetwork();
        console.log("Network Chain ID:", network.chainId.toString());
        
        if (network.chainId !== 420420422n) {
            throw new Error("Not on Passet Hub testnet!");
        }
        
        // First, try to deploy a simple test contract
        console.log("\n=== Testing with SimpleTest Contract ===");
        try {
            const simpleTest = await deployContract("SimpleTest");
            const number = await simpleTest.number();
            console.log("SimpleTest number:", number.toString());
        } catch (error) {
            console.log("SimpleTest deployment failed, continuing...");
        }
        
        // Try MockV3Aggregator with different parameter formats
        console.log("\n=== Deploying MockV3Aggregator ===");
        let mockPriceFeed;
        
        // Try 1: With BigInt
        try {
            console.log("\nAttempt 1: Using BigInt for initialAnswer");
            mockPriceFeed = await deployContract("MockV3Aggregator", [
                8, // decimals as number
                ethers.toBigInt("381000000000") // initialAnswer as BigInt
            ]);
        } catch (error) {
            console.log("BigInt attempt failed");
            
            // Try 2: With string
            try {
                console.log("\nAttempt 2: Using string for initialAnswer");
                mockPriceFeed = await deployContract("MockV3Aggregator", [
                    8,
                    "381000000000"
                ]);
            } catch (error) {
                console.log("String attempt failed");
                
                // Try 3: With smaller value
                try {
                    console.log("\nAttempt 3: Using smaller initialAnswer");
                    mockPriceFeed = await deployContract("MockV3Aggregator", [
                        8,
                        1000
                    ]);
                } catch (error) {
                    console.log("Smaller value attempt failed");
                    throw new Error("Could not deploy MockV3Aggregator with any parameter format");
                }
            }
        }
        
        if (mockPriceFeed) {
            const mockAddress = await mockPriceFeed.getAddress();
            const latestAnswer = await mockPriceFeed.latestAnswer();
            console.log("Oracle initial value:", latestAnswer.toString());
            
            // Now try to deploy Paramify
            console.log("\n=== Deploying Paramify ===");
            let paramify;
            
            try {
                paramify = await deployContract("Paramify", [mockAddress]);
                
                const paramifyAddress = await paramify.getAddress();
                const owner = await paramify.owner();
                console.log("Paramify owner:", owner);
                
                // Update configuration files
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
                    `MOCK_ORACLE_ADDRESS=${mockAddress}`
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
                    `VITE_MOCK_ORACLE_ADDRESS="${mockAddress}"`
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
                    `export const MOCK_ORACLE_ADDRESS = "${mockAddress}";`
                );
                
                fs.writeFileSync(contractTsPath, contractContent);
                console.log("✅ Updated frontend/src/lib/contract.ts");
                
                console.log("\n🎉 DEPLOYMENT SUCCESSFUL!");
                console.log("========================");
                console.log("MockV3Aggregator:", mockAddress);
                console.log("Paramify:", paramifyAddress);
                console.log("\nAll configuration files have been updated.");
                console.log("You can now:");
                console.log("1. Stop the backend server (Ctrl+C in its terminal)");
                console.log("2. Restart it with: cd backend && npm start");
                console.log("3. The frontend should automatically pick up the new addresses");
                
            } catch (error) {
                console.log("Failed to deploy Paramify:", error.message);
                console.log("\nBut MockV3Aggregator was deployed successfully to:", mockAddress);
                console.log("You may need to deploy Paramify separately.");
            }
        }
        
    } catch (error) {
        console.error("\n❌ Deployment failed:", error);
        
        console.log("\n🔍 Debugging Information:");
        console.log("This deployment issue appears to be specific to Passet Hub.");
        console.log("The network accepts simple contracts but has issues with:");
        console.log("- Contracts with complex constructors");
        console.log("- Certain parameter types or values");
        console.log("\nPossible solutions:");
        console.log("1. Deploy contracts without constructor parameters");
        console.log("2. Initialize contracts after deployment");
        console.log("3. Contact Passet Hub team for specific requirements");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
