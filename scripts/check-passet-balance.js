const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("Checking Passet Hub Testnet Balance");
    console.log("==================================");
    console.log("Account:", deployer.address);
    
    try {
        const balance = await ethers.provider.getBalance(deployer.address);
        console.log(`Balance: ${ethers.formatEther(balance)} PAS`);
        
        if (balance.toString() === '0') {
            console.log("\n⚠️  WARNING: Account has 0 PAS tokens!");
            console.log("You need PAS tokens to deploy contracts on Passet Hub testnet.");
            console.log("Please get testnet PAS tokens from a faucet or contact the network operators.");
        } else {
            console.log(`✅ Account has ${ethers.formatEther(balance)} PAS tokens`);
        }
        
        // Check network info
        const network = await ethers.provider.getNetwork();
        console.log("\nNetwork Info:");
        console.log(`Chain ID: ${network.chainId}`);
        console.log(`Network Name: ${network.name}`);
        
    } catch (error) {
        console.error("Error checking balance:", error.message);
        if (error.message.includes("could not detect network")) {
            console.log("Make sure you're connected to the correct network.");
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
