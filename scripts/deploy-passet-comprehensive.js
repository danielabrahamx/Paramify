const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Deploying Paramify to Passet Hub Testnet");
    console.log("============================================");
    
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    
    // Check network
    const network = await ethers.provider.getNetwork();
    console.log("Network:", network.name);
    console.log("Chain ID:", network.chainId);
    
    if (network.chainId !== 420420422n) {
        throw new Error("❌ Not connected to Passet Hub testnet! Expected Chain ID: 420420422");
    }
    
    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "PAS");
    
    if (balance === 0n) {
        throw new Error("❌ Account has no PAS tokens! Please fund your account first.");
    }
    
    // Get fee data
    const feeData = await ethers.provider.getFeeData();
    console.log("Network fee data:");
    console.log("  Gas Price:", feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, "gwei") + " gwei" : "not available");
    console.log("  Max Fee Per Gas:", feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, "gwei") + " gwei" : "not available");
    
    try {
        // Deploy MockV3Aggregator first
        console.log("\n📋 Step 1: Deploying MockV3Aggregator");
        console.log("-------------------------------------");
        
        const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
        
        // Check bytecode size
        const mockBytecode = MockV3Aggregator.bytecode;
        console.log("MockV3Aggregator bytecode size:", mockBytecode.length / 2, "bytes");
        
        if (mockBytecode.length / 2 > 24576) {
            throw new Error("❌ MockV3Aggregator bytecode too large (>24KB)");
        }
        
        // Deploy with explicit gas settings
        const mockDeployOptions = {
            gasLimit: 500000, // Conservative gas limit
            gasPrice: feeData.gasPrice || ethers.parseUnits("1", "gwei"),
        };
        
        console.log("Deploying with options:", mockDeployOptions);
        const mockPriceFeed = await MockV3Aggregator.deploy(8, 2000e8, mockDeployOptions);
        
        console.log("Waiting for deployment...");
        await mockPriceFeed.waitForDeployment();
        
        const mockAddress = await mockPriceFeed.getAddress();
        console.log("✅ MockV3Aggregator deployed to:", mockAddress);
        
        // Deploy Paramify contract
        console.log("\n📋 Step 2: Deploying Paramify");
        console.log("---------------------------");
        
        const Paramify = await ethers.getContractFactory("Paramify");
        
        // Check bytecode size
        const paramifyBytecode = Paramify.bytecode;
        console.log("Paramify bytecode size:", paramifyBytecode.length / 2, "bytes");
        
        if (paramifyBytecode.length / 2 > 24576) {
            throw new Error("❌ Paramify bytecode too large (>24KB)");
        }
        
        // Deploy with explicit gas settings
        const paramifyDeployOptions = {
            gasLimit: 2000000, // Conservative gas limit for main contract
            gasPrice: feeData.gasPrice || ethers.parseUnits("1", "gwei"),
        };
        
        console.log("Deploying with options:", paramifyDeployOptions);
        const paramify = await Paramify.deploy(mockAddress, paramifyDeployOptions);
        
        console.log("Waiting for deployment...");
        await paramify.waitForDeployment();
        
        const paramifyAddress = await paramify.getAddress();
        console.log("✅ Paramify deployed to:", paramifyAddress);
        
        // Verify deployments
        console.log("\n🔍 Step 3: Verifying deployments");
        console.log("-------------------------------");
        
        // Test MockV3Aggregator
        const latestPrice = await mockPriceFeed.latestAnswer();
        console.log("MockV3Aggregator latest price:", latestPrice.toString());
        
        // Test Paramify
        const paramifyOwner = await paramify.owner();
        console.log("Paramify owner:", paramifyOwner);
        console.log("Expected owner:", deployer.address);
        
        if (paramifyOwner.toLowerCase() !== deployer.address.toLowerCase()) {
            throw new Error("❌ Paramify owner mismatch!");
        }
        
        // Update environment file
        console.log("\n📝 Step 4: Updating configuration files");
        console.log("--------------------------------------");
        
        const envPath = path.join(__dirname, "..", ".env");
        let envContent = fs.readFileSync(envPath, "utf8");
        
        // Update contract addresses
        envContent = envContent.replace(
            /PARAMIFY_ADDRESS=".*"/,
            `PARAMIFY_ADDRESS="${paramifyAddress}"`
        );
        envContent = envContent.replace(
            /MOCK_ORACLE_ADDRESS=".*"/,
            `MOCK_ORACLE_ADDRESS="${mockAddress}"`
        );
        
        fs.writeFileSync(envPath, envContent);
        console.log("✅ Updated .env file");
        
        // Update frontend contract.ts
        const contractTsPath = path.join(__dirname, "..", "frontend", "src", "lib", "contract.ts");
        if (fs.existsSync(contractTsPath)) {
            let contractContent = fs.readFileSync(contractTsPath, "utf8");
            
            // Update addresses
            contractContent = contractContent.replace(
                /export const PARAMIFY_ADDRESS = ".*";/,
                `export const PARAMIFY_ADDRESS = "${paramifyAddress}";`
            );
            contractContent = contractContent.replace(
                /export const MOCK_ORACLE_ADDRESS = ".*";/,
                `export const MOCK_ORACLE_ADDRESS = "${mockAddress}";`
            );
            
            fs.writeFileSync(contractTsPath, contractContent);
            console.log("✅ Updated frontend contract.ts");
        }
        
        // Generate deployment summary
        const deploymentSummary = {
            network: "Passet Hub Testnet",
            chainId: 420420422,
            rpcUrl: "https://testnet-passet-hub-eth-rpc.polkadot.io",
            deployer: deployer.address,
            contracts: {
                MockV3Aggregator: mockAddress,
                Paramify: paramifyAddress
            },
            timestamp: new Date().toISOString(),
            blockNumber: await ethers.provider.getBlockNumber(),
            gasUsed: {
                MockV3Aggregator: mockDeployOptions.gasLimit,
                Paramify: paramifyDeployOptions.gasLimit
            }
        };
        
        const summaryPath = path.join(__dirname, "..", "deployment-summary.json");
        fs.writeFileSync(summaryPath, JSON.stringify(deploymentSummary, null, 2));
        
        console.log("\n🎉 Deployment Successful!");
        console.log("========================");
        console.log("Network:", deploymentSummary.network);
        console.log("Chain ID:", deploymentSummary.chainId);
        console.log("MockV3Aggregator:", mockAddress);
        console.log("Paramify:", paramifyAddress);
        console.log("Deployer:", deployer.address);
        console.log("Block Number:", deploymentSummary.blockNumber);
        console.log("Deployment Summary saved to:", summaryPath);
        
        console.log("\n📋 Next Steps:");
        console.log("1. Add Passet Hub network to MetaMask:");
        console.log("   - Network Name: Passet Hub Testnet");
        console.log("   - RPC URL: https://testnet-passet-hub-eth-rpc.polkadot.io");
        console.log("   - Chain ID: 420420422");
        console.log("   - Currency Symbol: PAS");
        console.log("2. Import your account to MetaMask using the private key");
        console.log("3. Start the frontend and test the dApp");
        console.log("4. The contract addresses have been automatically updated");
        
        return deploymentSummary;
        
    } catch (error) {
        console.error("❌ Deployment failed:", error);
        
        // Enhanced error analysis
        if (error.message && error.message.includes("CodeRejected")) {
            console.log("\n🔍 CodeRejected Error Analysis:");
            console.log("This specific error suggests:");
            console.log("1. The contract bytecode is being rejected by the runtime");
            console.log("2. Possible EVM compatibility issues");
            console.log("3. Runtime restrictions on contract deployment");
            console.log("4. Gas limit or transaction format issues");
            console.log("\nTroubleshooting steps:");
            console.log("- Verify EVM compatibility is enabled on Passet Hub");
            console.log("- Check if there are specific deployment restrictions");
            console.log("- Try deploying a simpler contract first");
            console.log("- Contact Passet Hub support team");
        }
        
        if (error.message && error.message.includes("insufficient funds")) {
            console.log("\n💰 Insufficient Funds:");
            console.log("Your account needs more PAS tokens to deploy contracts.");
            console.log("Current balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "PAS");
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
