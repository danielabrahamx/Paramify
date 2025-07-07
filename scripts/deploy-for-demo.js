const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Paramify Demo Deployment");
    console.log("===========================\n");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with:", deployer.address);
    
    try {
        // Deploy MockV3Aggregator
        console.log("\n📋 Deploying MockV3Aggregator...");
        const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
        const mockPriceFeed = await MockV3Aggregator.deploy(
            8, // decimals
            381000000000 // 3.81 feet initial value
        );
        await mockPriceFeed.waitForDeployment();
        const mockAddress = await mockPriceFeed.getAddress();
        console.log("✅ MockV3Aggregator deployed to:", mockAddress);
        
        // Deploy Paramify
        console.log("\n📋 Deploying Paramify...");
        const Paramify = await ethers.getContractFactory("Paramify");
        const paramify = await Paramify.deploy(mockAddress);
        await paramify.waitForDeployment();
        const paramifyAddress = await paramify.getAddress();
        console.log("✅ Paramify deployed to:", paramifyAddress);
        
        // Verify deployment
        const owner = await paramify.owner();
        const threshold = await paramify.getCurrentThreshold();
        console.log("\n📊 Contract Details:");
        console.log("Owner:", owner);
        console.log("Threshold:", ethers.formatUnits(threshold, 11), "feet");
        
        // Update all configuration files
        await updateAllConfigs(mockAddress, paramifyAddress);
        
        console.log("\n🎉 DEPLOYMENT SUCCESSFUL!");
        console.log("========================");
        console.log("\n📋 Next Steps for Demo:");
        console.log("1. Keep this terminal open (local blockchain is running)");
        console.log("2. In a new terminal: cd backend && npm start");
        console.log("3. In another terminal: cd frontend && npm run dev");
        console.log("4. Open http://localhost:5173 in your browser");
        console.log("\n⚠️  IMPORTANT: This is running on local Hardhat network");
        console.log("For production, you'll need a fully EVM-compatible network");
        
        // Save deployment info
        const deploymentInfo = {
            network: "Local Hardhat Network",
            deployer: deployer.address,
            contracts: {
                MockV3Aggregator: mockAddress,
                Paramify: paramifyAddress
            },
            timestamp: new Date().toISOString(),
            notes: "Deployed locally due to Passet Hub restrictions"
        };
        
        fs.writeFileSync(
            path.join(__dirname, "..", "demo-deployment.json"),
            JSON.stringify(deploymentInfo, null, 2)
        );
        
    } catch (error) {
        console.error("\n❌ Deployment failed:", error);
    }
}

async function updateAllConfigs(oracleAddress, paramifyAddress) {
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
    .then(() => {
        console.log("\n✅ Script completed. Keep this terminal open!");
        // Don't exit - keep the local blockchain running
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
