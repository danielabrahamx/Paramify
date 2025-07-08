const { ethers } = require("hardhat");

async function main() {
  // The private key from backend/.env
  const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const wallet = new ethers.Wallet(privateKey);
  
  console.log("Backend account from private key:", wallet.address);
  
  // Connect to provider to check balance
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const connectedWallet = wallet.connect(provider);
  const balance = await provider.getBalance(wallet.address);
  
  console.log("Balance:", ethers.formatEther(balance), "ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
