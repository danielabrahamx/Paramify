const { ethers } = require("hardhat");

async function main() {
  const [richSigner] = await ethers.getSigners();
  
  // Backend account that needs funding
  const backendAccount = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  
  // Send 1 ETH to backend account
  const amount = ethers.parseEther("1.0");
  
  console.log("Funding backend account...");
  console.log("From:", await richSigner.getAddress());
  console.log("To:", backendAccount);
  console.log("Amount:", ethers.formatEther(amount), "ETH");
  
  const tx = await richSigner.sendTransaction({
    to: backendAccount,
    value: amount
  });
  
  console.log("Transaction hash:", tx.hash);
  await tx.wait();
  
  // Check new balance
  const newBalance = await ethers.provider.getBalance(backendAccount);
  console.log("New backend account balance:", ethers.formatEther(newBalance), "ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
