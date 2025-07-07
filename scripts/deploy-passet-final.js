const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Deploying Paramify to Passet Hub Testnet (Final Attempt)");
    console.log("=========================================================\n");
    
    try {
        const [deployer] = await ethers.getSigners();
        console.log("Deployer:", deployer.address);
        
        const balance = await ethers.provider.getBalance(deployer.address);
        console.log("Balance:", ethers.formatEther(balance), "PAS");
        
        // Verify network
        const network = await ethers.provider.getNetwork();
        console.log("Network Chain ID:", network.chainId.toString());
        
        if (network.chainId !== 420420422n) {
            throw new Error("Not on Passet Hub testnet!");
        }
        
        // Deploy MockV3Aggregator
        console.log("\n📋 Deploying MockV3Aggregator...");
        const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
        console.log("Bytecode size:", MockV3Aggregator.bytecode.length / 2, "bytes");
        
        const mockPriceFeed = await MockV3Aggregator.deploy(
            8, // decimals
            381000000000, // initial answer (3.81 feet in contract units)
            {
                gasLimit: 1000000,
                gasPrice: ethers.parseUnits("1", "gwei")
            }
        );
        
        console.log("Waiting for MockV3Aggregator deployment...");
        await mockPriceFeed.waitForDeployment();
        
        const mockAddress = await mockPriceFeed.getAddress();
        console.log("✅ MockV3Aggregator deployed to:", mockAddress);
        
        // Verify deployment
        const latestAnswer = await mockPriceFeed.latestAnswer();
        console.log("Initial oracle value:", latestAnswer.toString());
        console.log("In feet:", Number(latestAnswer) / 100000000000);
        
        // Deploy Paramify
        console.log("\n📋 Deploying Paramify...");
        const Paramify = await ethers.getContractFactory("Paramify");
        console.log("Bytecode size:", Paramify.bytecode.length / 2, "bytes");
        
        const paramify = await Paramify.deploy(
            mockAddress,
            {
                gasLimit: 3000000,
                gasPrice: ethers.parseUnits("1", "gwei")
            }
        );
        
        console.log("Waiting for Paramify deployment...");
        await paramify.waitForDeployment();
        
        const paramifyAddress = await paramify.getAddress();
        console.log("✅ Paramify deployed to:", paramifyAddress);
        
        // Verify Paramify deployment
        const owner = await paramify.owner();
        console.log("Paramify owner:", owner);
        
        const threshold = await paramify.getCurrentThreshold();
        console.log("Initial threshold:", threshold.toString());
        console.log("In feet:", Number(threshold) / 100000000000);
        
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
        
        // Save deployment summary
        const deploymentSummary = {
            network: "Passet Hub Testnet",
            chainId: 420420422,
            deployer: deployer.address,
            contracts: {
                MockV3Aggregator: mockAddress,
                Paramify: paramifyAddress
            },
            timestamp: new Date().toISOString(),
            blockNumber: await ethers.provider.getBlockNumber()
        };
        
        const summaryPath = path.join(__dirname, "..", "passet-deployment.json");
        fs.writeFileSync(summaryPath, JSON.stringify(deploymentSummary, null, 2));
        
        console.log("\n🎉 DEPLOYMENT SUCCESSFUL!");
        console.log("========================");
        console.log("MockV3Aggregator:", mockAddress);
        console.log("Paramify:", paramifyAddress);
        console.log("\nAll configuration files have been updated.");
        console.log("You can now restart the backend server to use the new contracts.");
        
    } catch (error) {
        console.error("\n❌ Deployment failed:", error);
        
        if (error.message && error.message.includes("CodeRejected")) {
            console.log("\n💡 If you're still getting CodeRejected errors:");
            console.log("1. Try deploying contracts one at a time");
            console.log("2. Reduce contract complexity");
            console.log("3. Check Passet Hub documentation for specific requirements");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
