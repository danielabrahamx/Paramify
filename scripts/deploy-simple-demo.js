
const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("\n========================================");
  console.log("🚀 PARAMIFY SIMPLE LOCALHOST DEPLOYMENT");
  console.log("========================================\n");

  try {
    // Get signers
    const signers = await ethers.getSigners();
    const deployer = signers[0];
    const oracleAccount = signers[1] || deployer; // Use deployer if no second account
    
    console.log("📍 Deploying with account:", deployer.address);
    console.log("💰 Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");
    
    if (signers.length === 1) {
      console.log("⚠️  Only one account available, using same account for oracle updates");
    }

    // Deploy MockV3Aggregator (Oracle)
    console.log("1️⃣ Deploying Mock Oracle...");
    const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
    const oracle = await MockV3Aggregator.deploy(8, 2000000000); // 20.00 feet initial
    await oracle.waitForDeployment();
    const oracleAddress = await oracle.getAddress();
    console.log("✅ Oracle deployed to:", oracleAddress);

    // Deploy Paramify Insurance Contract
    console.log("\n2️⃣ Deploying Insurance Contract...");
    const Paramify = await ethers.getContractFactory("Paramify");
    const paramify = await Paramify.deploy(oracleAddress);
    await paramify.waitForDeployment();
    const paramifyAddress = await paramify.getAddress();
    console.log("✅ Insurance contract deployed to:", paramifyAddress);

    // Setup roles
    console.log("\n3️⃣ Setting up roles...");
    const ORACLE_ROLE = await paramify.ORACLE_UPDATER_ROLE();
    await paramify.grantRole(ORACLE_ROLE, oracleAccount.address);
    console.log("✅ Oracle role granted to:", oracleAccount.address);

    // Fund contracts
    console.log("\n4️⃣ Funding contracts...");
    
    // Fund oracle account
    await deployer.sendTransaction({
      to: oracleAccount.address,
      value: ethers.parseEther("5.0")
    });
    console.log("✅ Oracle account funded with 5 ETH");

    // Fund insurance contract
    await deployer.sendTransaction({
      to: paramifyAddress,
      value: ethers.parseEther("50.0")
    });
    console.log("✅ Insurance contract funded with 50 ETH");

    // Update all configuration files
    console.log("\n5️⃣ Updating configuration files...");
    
    // Backend .env
    const backendEnv = `PARAMIFY_CONTRACT_ADDRESS=${paramifyAddress}
MOCK_AGGREGATOR_ADDRESS=${oracleAddress}
PARAMIFY_ADDRESS=${paramifyAddress}
MOCK_ORACLE_ADDRESS=${oracleAddress}
PORT=3001
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133`;
    fs.writeFileSync('./backend/.env', backendEnv);
    console.log("✅ Updated backend/.env");

    // Frontend .env.local
    const frontendEnv = `VITE_PARAMIFY_CONTRACT_ADDRESS=${paramifyAddress}
VITE_MOCK_AGGREGATOR_ADDRESS=${oracleAddress}
VITE_BACKEND_URL=http://localhost:3001`;
    fs.writeFileSync('./frontend/.env.local', frontendEnv);
    console.log("✅ Updated frontend/.env.local");

    // Frontend contract.ts
    const contractTs = `// Auto-generated contract addresses
export const PARAMIFY_CONTRACT_ADDRESS = "${paramifyAddress}";
export const MOCK_AGGREGATOR_ADDRESS = "${oracleAddress}";
export const BACKEND_URL = "http://localhost:3001";`;
    fs.writeFileSync('./frontend/src/lib/contract.ts', contractTs);
    console.log("✅ Updated frontend/src/lib/contract.ts");

    // Save deployment info
    const deploymentInfo = {
      timestamp: new Date().toISOString(),
      network: "localhost",
      contracts: {
        oracle: oracleAddress,
        paramify: paramifyAddress
      }
    };
    fs.writeFileSync('demo-deployment.json', JSON.stringify(deploymentInfo, null, 2));

    console.log("\n========================================");
    console.log("✅ DEPLOYMENT SUCCESSFUL!");
    console.log("========================================");
    console.log("\n📋 Contract Addresses:");
    console.log("   Oracle:", oracleAddress);
    console.log("   Paramify:", paramifyAddress);
    console.log("\n🚀 Next Steps:");
    console.log("   1. Start backend: cd backend && npm start");
    console.log("   2. Start frontend: cd frontend && npm run dev");
    console.log("   3. Open browser: http://localhost:5173");
    console.log("\n💡 MetaMask Setup:");
    console.log("   - Network: Localhost 8545");
    console.log("   - Chain ID: 420420420 (PolkaVM Local Node)");
    console.log("   - Import test accounts from hardhat");
    console.log("========================================\n");

  } catch (error) {
    console.error("\n❌ Deployment failed:", error.message);
    console.log("\n🔧 Troubleshooting:");
    console.log("   1. Make sure PolkaVM node is running: npx hardhat node");
    console.log("   2. Check if ports 8545, 3001, 5173 are free");
    console.log("   3. Try again with: npx hardhat run scripts/deploy-simple-demo.js --network localNode");
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
