const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Testing with account:", deployer.address);
    
    // Contract addresses from deployment
    const PARAMIFY_ADDRESS = "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e";
    
    // Check if contract exists
    const code = await ethers.provider.getCode(PARAMIFY_ADDRESS);
    console.log("Contract code exists:", code !== '0x');
    
    if (code === '0x') {
        console.log("Contract not deployed! Need to deploy first.");
        return;
    }
    
    // Get contract instance
    const Paramify = await ethers.getContractFactory("Paramify");
    const paramify = Paramify.attach(PARAMIFY_ADDRESS);
    
    // Check initial balance
    const initialBalance = await paramify.getContractBalance();
    console.log("Initial contract balance:", ethers.formatEther(initialBalance), "ETH");
    
    // Test sending ETH to the contract
    console.log("Sending 0.1 ETH to contract...");
    const tx = await deployer.sendTransaction({
        to: PARAMIFY_ADDRESS,
        value: ethers.parseEther("0.1")
    });
    
    await tx.wait();
    console.log("Transaction successful!");
    
    // Check new balance
    const newBalance = await paramify.getContractBalance();
    console.log("New contract balance:", ethers.formatEther(newBalance), "ETH");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
