const { ethers } = require("hardhat");

async function main() {
  const provider = ethers.provider;
  
  // Contract addresses from deployment
  const paramifyAddress = "0x3649E46eCD6A0bd187f0046C4C35a7B31C92bA1E";
  const oracleAddress = "0xd528a533599223CA6B5EBdd1C32A241432FB1AE8";
  
  console.log("🔍 Verifying contract deployments...");
  
  // Check if contracts have code deployed
  const paramifyCode = await provider.getCode(paramifyAddress);
  const oracleCode = await provider.getCode(oracleAddress);
  
  console.log("Paramify contract at", paramifyAddress);
  console.log("Has code deployed:", paramifyCode !== "0x" ? "✅ YES" : "❌ NO");
  
  console.log("Oracle contract at", oracleAddress);
  console.log("Has code deployed:", oracleCode !== "0x" ? "✅ YES" : "❌ NO");
  
  // Check contract balances
  const paramifyBalance = await provider.getBalance(paramifyAddress);
  const oracleBalance = await provider.getBalance(oracleAddress);
  
  console.log("\n💰 Contract balances:");
  console.log("Paramify contract:", ethers.formatEther(paramifyBalance), "ETH");
  console.log("Oracle contract:", ethers.formatEther(oracleBalance), "ETH");
  
  // Test contract interaction
  if (paramifyCode !== "0x") {
    try {
      const Paramify = await ethers.getContractFactory("Paramify");
      const paramify = Paramify.attach(paramifyAddress);
      
      // Try to call a view function
      const latestFloodLevel = await paramify.getLatestFloodLevel();
      console.log("\n🌊 Current flood level from contract:", latestFloodLevel.toString());
      console.log("✅ Contract is responding correctly!");
      
    } catch (error) {
      console.log("❌ Contract interaction error:", error.message);
    }
  }
  
  // Check network info
  const network = await provider.getNetwork();
  console.log("\n🌐 Network info:");
  console.log("Chain ID:", network.chainId.toString());
  console.log("Network name:", network.name);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
