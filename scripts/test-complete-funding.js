const { ethers } = require("hardhat");

async function main() {
    console.log("=== Complete Funding Workflow Test ===");
    
    const contractAddress = "0x0B306BF915C4d645ff596e518fAf3F9669b97016";
    const [deployer] = await ethers.getSigners();
    
    console.log("1. Testing with account:", deployer.address);
    
    // Get contract instance
    const Paramify = await ethers.getContractFactory("Paramify");
    const contract = Paramify.attach(contractAddress);
    
    // Check initial balance
    console.log("2. Initial contract balance:");
    const initialBalance = await contract.getContractBalance();
    console.log("   Balance:", ethers.formatEther(initialBalance), "ETH");
    
    // Fund the contract
    const fundAmount = ethers.parseEther("0.5");
    console.log("3. Funding contract with 0.5 ETH...");
    const tx = await deployer.sendTransaction({
        to: contractAddress,
        value: fundAmount
    });
    await tx.wait();
    console.log("   Transaction hash:", tx.hash);
    
    // Check balance after funding
    console.log("4. Balance after funding:");
    const newBalance = await contract.getContractBalance();
    console.log("   Balance:", ethers.formatEther(newBalance), "ETH");
    console.log("   Increase:", ethers.formatEther(newBalance - initialBalance), "ETH");
    
    console.log("✅ Funding workflow test completed successfully!");
}

main().catch(console.error);
