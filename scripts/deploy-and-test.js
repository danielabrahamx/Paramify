const { ethers } = require("hardhat");

async function main() {
  console.log("\n=== Deploying and Testing Insurance System ===\n");
  
  try {
    // Get signers
    const [deployer, user] = await ethers.getSigners();
    
    console.log("Deployer:", deployer.address);
    console.log("User:", user.address);
    
    // Deploy MockV3Aggregator
    console.log("\n1. Deploying Mock Oracle...");
    const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
    const oracle = await MockV3Aggregator.deploy(
      8, // decimals
      200000000000 // initial price (2 feet - below threshold)
    );
    await oracle.waitForDeployment();
    const oracleAddress = await oracle.getAddress();
    console.log("✅ Oracle deployed to:", oracleAddress);
    
    // Deploy Paramify
    console.log("\n2. Deploying Paramify Contract...");
    const Paramify = await ethers.getContractFactory("Paramify");
    const paramify = await Paramify.deploy(oracleAddress);
    await paramify.waitForDeployment();
    const paramifyAddress = await paramify.getAddress();
    console.log("✅ Paramify deployed to:", paramifyAddress);
    
    // Fund the contract
    console.log("\n3. Funding Contract...");
    const fundTx = await deployer.sendTransaction({
      to: paramifyAddress,
      value: ethers.parseEther("5.0")
    });
    await fundTx.wait();
    console.log("✅ Contract funded with 5 ETH");
    
    // Check contract balance
    const contractBalance = await ethers.provider.getBalance(paramifyAddress);
    console.log("Contract balance:", ethers.formatEther(contractBalance), "ETH");
    
    // Test insurance purchase
    console.log("\n4. Testing Insurance Purchase...");
    const coverageAmount = ethers.parseEther("1.0");
    const premium = ethers.parseEther("0.1"); // 10% premium
    
    console.log("Buying insurance for 1 ETH coverage (0.1 ETH premium)...");
    const buyTx = await paramify.connect(user).buyInsurance(coverageAmount, { value: premium });
    await buyTx.wait();
    console.log("✅ Insurance purchased!");
    
    // Check insurance details
    const policy = await paramify.policies(user.address);
    console.log("\nPolicy details:");
    console.log("- Coverage:", ethers.formatEther(policy.coverage), "ETH");
    console.log("- Premium:", ethers.formatEther(policy.premium), "ETH");
    console.log("- Active:", policy.active);
    
    // Update flood level
    console.log("\n5. Testing Payout Trigger...");
    console.log("Updating flood level to 15 feet (above threshold)...");
    const updateTx = await oracle.updateAnswer(1500000000000); // 15 feet with correct decimals
    await updateTx.wait();
    console.log("✅ Flood level updated!");
    
    // Check flood data
    const latestData = await oracle.latestRoundData();
    console.log("Current flood level:", (Number(latestData[1]) / 100000000000).toFixed(2), "feet");
    
    // Check threshold
    const threshold = await paramify.floodThreshold();
    console.log("Threshold:", (Number(threshold) / 100000000000).toFixed(2), "feet");
    
    // Trigger payout
    console.log("\nTriggering payout...");
    const userBalanceBefore = await ethers.provider.getBalance(user.address);
    
    const payoutTx = await paramify.connect(user).triggerPayout();
    const receipt = await payoutTx.wait();
    console.log("✅ Payout triggered!");
    
    // Calculate net payout
    const userBalanceAfter = await ethers.provider.getBalance(user.address);
    const gasUsed = receipt.gasUsed * receipt.gasPrice;
    const netPayout = userBalanceAfter - userBalanceBefore + gasUsed;
    console.log("Net payout received:", ethers.formatEther(netPayout), "ETH");
    
    // Final contract balance
    const finalBalance = await ethers.provider.getBalance(paramifyAddress);
    console.log("\nFinal contract balance:", ethers.formatEther(finalBalance), "ETH");
    
    console.log("\n✅ All tests passed! Insurance system working correctly.");
    
    // Save deployment info
    const fs = require('fs');
    const deploymentInfo = {
      oracle: oracleAddress,
      paramify: paramifyAddress,
      timestamp: new Date().toISOString()
    };
    fs.writeFileSync('test-deployment.json', JSON.stringify(deploymentInfo, null, 2));
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
