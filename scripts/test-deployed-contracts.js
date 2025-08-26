const { ethers } = require("hardhat");

async function main() {
  // Use the deployed contract addresses from .env
  const paramifyAddress = process.env.PARAMIFY_CONTRACT_ADDRESS;
  const mockAddress = process.env.MOCK_AGGREGATOR_ADDRESS;

  console.log("🧪 Testing deployed contracts on PassetHub testnet");
  console.log("============================================");

  try {
    // Test MockV3Aggregator
    console.log("\n📊 Testing MockV3Aggregator...");
    const mockContract = await ethers.getContractAt("MockV3Aggregator", mockAddress);
    const mockVersion = await mockContract.version();
    console.log("✅ MockV3Aggregator version:", mockVersion);

    // Test Paramify contract
    console.log("\n🏛️  Testing Paramify contract...");
    const paramifyContract = await ethers.getContractAt("Paramify", paramifyAddress);

    const owner = await paramifyContract.owner();
    console.log("✅ Contract owner:", owner);

    const threshold = await paramifyContract.getThresholdInFeet();
    console.log("✅ Current flood threshold:", threshold, "feet");

    const balance = await paramifyContract.getContractBalance();
    console.log("✅ Contract balance:", ethers.formatEther(balance), "ETH");

    // Test price feed
    const price = await paramifyContract.getLatestPrice();
    console.log("✅ Current flood level:", price.toString());

    console.log("\n🎉 All deployed contracts are working correctly!");
    console.log("   You can proceed with ICP deployment using these contracts.");

  } catch (error) {
    console.log("❌ Error testing deployed contracts:", error.message);
    console.log("   You may need to deploy new contracts.");
  }
}

main().catch(console.error);