const { ethers } = require("hardhat");

async function main() {
  // Get the accounts
  const [deployer] = await ethers.getSigners();
  
  // The wallet address that needs funding (from the error message)
  const targetAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  
  console.log("Funding account:", targetAddress);
  console.log("From deployer:", deployer.address);
  
  // Check current balance
  const provider = ethers.provider;
  const currentBalance = await provider.getBalance(targetAddress);
  console.log("Current balance:", ethers.formatEther(currentBalance), "ETH");
  
  // Fund with 10,000 ETH
  const fundAmount = ethers.parseEther("10000");
  
  try {
    const tx = await deployer.sendTransaction({
      to: targetAddress,
      value: fundAmount
    });
    
    console.log("Funding transaction hash:", tx.hash);
    await tx.wait();
    
    // Check new balance
    const newBalance = await provider.getBalance(targetAddress);
    console.log("New balance:", ethers.formatEther(newBalance), "ETH");
    console.log("✅ Account successfully funded with 10,000 ETH!");
    
  } catch (error) {
    console.error("❌ Funding failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
