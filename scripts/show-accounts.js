const { ethers } = require("hardhat");

async function main() {
    const accounts = await ethers.getSigners();
    
    console.log("Available accounts on Hardhat local network:");
    console.log("==========================================");
    
    for (let i = 0; i < Math.min(accounts.length, 10); i++) {
        const account = accounts[i];
        const balance = await ethers.provider.getBalance(account.address);
        console.log(`Account #${i}: ${account.address}`);
        console.log(`Private Key: 0x${account.privateKey}`);
        console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
        console.log("---");
    }
    
    console.log("\nFor MetaMask setup:");
    console.log("Network Name: Hardhat Local");
    console.log("RPC URL: http://127.0.0.1:8545");
    console.log("Chain ID: 31337");
    console.log("Currency Symbol: ETH");
    console.log("\nThe admin/deployer account is Account #0 (first one listed above)");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
