const { ethers } = require("hardhat");

async function main() {
    console.log("=== Debugging Contract Deployment on Passet Hub ===\n");
    
    const PARAMIFY_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    const MOCK_ORACLE_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    
    try {
        // Connect to Passet Hub
        const provider = new ethers.JsonRpcProvider("https://testnet-passet-hub-eth-rpc.polkadot.io");
        const [signer] = await ethers.getSigners();
        
        console.log("Connected to Passet Hub testnet");
        console.log("Signer address:", signer.address);
        console.log("Signer balance:", ethers.formatEther(await provider.getBalance(signer.address)), "PAS\n");
        
        // Check if contracts exist
        console.log("=== Checking Contract Existence ===");
        const oracleCode = await provider.getCode(MOCK_ORACLE_ADDRESS);
        const paramifyCode = await provider.getCode(PARAMIFY_ADDRESS);
        
        console.log("Oracle contract code exists:", oracleCode !== "0x");
        console.log("Oracle code length:", oracleCode.length);
        console.log("Paramify contract code exists:", paramifyCode !== "0x");
        console.log("Paramify code length:", paramifyCode.length);
        
        if (paramifyCode === "0x") {
            console.error("\n❌ Paramify contract doesn't exist at the specified address!");
            console.log("We need to redeploy to Passet Hub testnet properly.");
        }
        
        // Try to interact with the oracle
        console.log("\n=== Testing Oracle Contract ===");
        
        // First, let's try with a minimal ABI to see what functions exist
        const minimalOracleABI = [
            "function latestAnswer() view returns (int256)",
            "function updateAnswer(int256) external",
            "function owner() view returns (address)",
            "function decimals() view returns (uint8)"
        ];
        
        const oracleContract = new ethers.Contract(MOCK_ORACLE_ADDRESS, minimalOracleABI, provider);
        
        // Try to read current value
        try {
            const currentAnswer = await oracleContract.latestAnswer();
            console.log("✅ Current oracle answer:", currentAnswer.toString());
            console.log("   In feet:", Number(currentAnswer) / 100000000000);
        } catch (error) {
            console.log("❌ Failed to read latestAnswer:", error.message);
        }
        
        // Try to check decimals
        try {
            const decimals = await oracleContract.decimals();
            console.log("✅ Oracle decimals:", decimals.toString());
        } catch (error) {
            console.log("❌ Failed to read decimals:", error.message);
        }
        
        // Try to check owner (if it has one)
        try {
            const owner = await oracleContract.owner();
            console.log("✅ Oracle owner:", owner);
        } catch (error) {
            console.log("❌ No owner function or failed to read owner:", error.message);
        }
        
        // Now let's try to update the answer
        console.log("\n=== Attempting Oracle Update ===");
        const connectedOracle = oracleContract.connect(signer);
        const newValue = ethers.toBigInt(381000000000); // 3.81 feet
        
        try {
            // First try to estimate gas
            console.log("Estimating gas for updateAnswer...");
            const gasEstimate = await connectedOracle.updateAnswer.estimateGas(newValue);
            console.log("✅ Gas estimate:", gasEstimate.toString());
            
            // If gas estimation works, try the actual transaction
            console.log("Sending transaction...");
            const tx = await connectedOracle.updateAnswer(newValue);
            console.log("✅ Transaction sent:", tx.hash);
            
            const receipt = await tx.wait();
            console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
            
            // Verify the update
            const updatedAnswer = await oracleContract.latestAnswer();
            console.log("✅ Updated oracle answer:", updatedAnswer.toString());
            
        } catch (error) {
            console.log("❌ Failed to update oracle:", error.message);
            
            // Try to decode the error
            if (error.data) {
                console.log("Error data:", error.data);
            }
            if (error.reason) {
                console.log("Error reason:", error.reason);
            }
            
            // Check if it's actually the MockV3Aggregator we expect
            console.log("\n=== Checking Contract Type ===");
            
            // Let's check if this is actually a Paramify contract instead
            const paramifyABI = [
                "function getCurrentThreshold() view returns (uint256)",
                "function getThresholdInFeet() view returns (uint256)"
            ];
            
            const testAsParamify = new ethers.Contract(MOCK_ORACLE_ADDRESS, paramifyABI, provider);
            
            try {
                const threshold = await testAsParamify.getCurrentThreshold();
                console.log("⚠️  This might be a Paramify contract! Threshold:", threshold.toString());
            } catch (e) {
                console.log("✅ Not a Paramify contract (good)");
            }
        }
        
        // Check the actual Paramify contract
        console.log("\n=== Testing Paramify Contract ===");
        const paramifyABI = [
            "function getCurrentThreshold() view returns (uint256)",
            "function getThresholdInFeet() view returns (uint256)",
            "function getLatestPrice() view returns (int256)"
        ];
        
        const paramifyContract = new ethers.Contract(PARAMIFY_ADDRESS, paramifyABI, provider);
        
        try {
            const threshold = await paramifyContract.getCurrentThreshold();
            console.log("✅ Current threshold:", threshold.toString());
            console.log("   In feet:", Number(threshold) / 100000000000);
        } catch (error) {
            console.log("❌ Failed to read threshold:", error.message);
        }
        
        try {
            const price = await paramifyContract.getLatestPrice();
            console.log("✅ Latest price from Paramify:", price.toString());
            console.log("   In feet:", Number(price) / 100000000000);
        } catch (error) {
            console.log("❌ Failed to read latest price:", error.message);
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
