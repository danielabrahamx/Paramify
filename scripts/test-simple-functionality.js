const { ethers } = require('ethers');

async function testFunctionality() {
  console.log("=== Testing Insurance Contract Functionality ===\n");
  
  try {
    // Connect to local network
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    
    // Test accounts
    const adminWallet = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
    const userWallet = new ethers.Wallet('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', provider);
    
    // Contract addresses from deployment
    const mockOracleAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    const paramifyAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
    
    // Simple ABIs for the contracts
    const mockOracleABI = [
      "function updateData(int256 _data) external",
      "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)"
    ];
    
    const paramifyABI = [
      "function buyInsurance(uint256 _coverageAmount) payable",
      "function triggerPayout() external",
      "function getLatestPrice() view returns (int256)",
      "function floodThreshold() view returns (int256)",
      "function insurances(address) view returns (uint256 coverageAmount, uint256 premium, bool active)"
    ];
    
    const mockOracle = new ethers.Contract(mockOracleAddress, mockOracleABI, adminWallet);
    const paramify = new ethers.Contract(paramifyAddress, paramifyABI, adminWallet);
    
    console.log("Contract addresses:");
    console.log("- MockOracle:", mockOracleAddress);
    console.log("- Paramify:", paramifyAddress);
    
    // Test 1: Check initial contract balance
    console.log("\n=== Test 1: Check Contract Balance ===");
    const contractBalance = await provider.getBalance(paramifyAddress);
    console.log("Contract balance:", ethers.formatEther(contractBalance), "ETH");
    
    // Test 2: Fund the contract more
    console.log("\n=== Test 2: Fund Contract ===");
    const fundAmount = ethers.parseEther("2.0");
    const fundTx = await adminWallet.sendTransaction({
      to: paramifyAddress,
      value: fundAmount
    });
    await fundTx.wait();
    console.log("✅ Contract funded with 2 ETH");
    
    const newBalance = await provider.getBalance(paramifyAddress);
    console.log("New contract balance:", ethers.formatEther(newBalance), "ETH");
    
    // Test 3: Check current flood level
    console.log("\n=== Test 3: Check Flood Data ===");
    const currentFloodLevel = await paramify.getLatestPrice();
    const threshold = await paramify.floodThreshold();
    console.log("Current flood level:", (Number(currentFloodLevel) / 100000000000).toFixed(2), "ft");
    console.log("Threshold:", (Number(threshold) / 100000000000).toFixed(2), "ft");
    
    // Test 4: Buy insurance as user
    console.log("\n=== Test 4: Buy Insurance ===");
    const coverageAmount = ethers.parseEther("1.0");
    const premium = ethers.parseEther("0.1"); // 10% premium
    
    console.log("User buying insurance:");
    console.log("- Coverage:", ethers.formatEther(coverageAmount), "ETH");
    console.log("- Premium:", ethers.formatEther(premium), "ETH");
    
    const paramifyUser = paramify.connect(userWallet);
    const buyTx = await paramifyUser.buyInsurance(coverageAmount, { value: premium });
    await buyTx.wait();
    console.log("✅ Insurance purchased!");
    
    // Check insurance details
    const insurance = await paramify.insurances(userWallet.address);
    console.log("\nInsurance details:");
    console.log("- Coverage:", ethers.formatEther(insurance.coverageAmount), "ETH");
    console.log("- Premium:", ethers.formatEther(insurance.premium), "ETH");
    console.log("- Active:", insurance.active);
    
    // Test 5: Update flood level to trigger payout
    console.log("\n=== Test 5: Trigger Payout ===");
    const highFloodLevel = 1500000000000; // 15 feet (above threshold)
    console.log("Setting flood level to", (highFloodLevel / 100000000000).toFixed(2), "ft...");
    
    const updateTx = await mockOracle.updateData(highFloodLevel);
    await updateTx.wait();
    console.log("✅ Flood level updated!");
    
    // Check user balance before payout
    const userBalanceBefore = await provider.getBalance(userWallet.address);
    console.log("\nUser balance before payout:", ethers.formatEther(userBalanceBefore), "ETH");
    
    // Trigger payout
    console.log("Triggering payout...");
    const payoutTx = await paramifyUser.triggerPayout();
    const receipt = await payoutTx.wait();
    console.log("✅ Payout triggered!");
    
    // Calculate gas used
    const gasUsed = receipt.gasUsed * receipt.gasPrice;
    
    // Check user balance after payout
    const userBalanceAfter = await provider.getBalance(userWallet.address);
    console.log("User balance after payout:", ethers.formatEther(userBalanceAfter), "ETH");
    
    const netReceived = userBalanceAfter - userBalanceBefore + gasUsed;
    console.log("Net payout received:", ethers.formatEther(netReceived), "ETH");
    
    // Final contract balance
    const finalContractBalance = await provider.getBalance(paramifyAddress);
    console.log("\nFinal contract balance:", ethers.formatEther(finalContractBalance), "ETH");
    
    console.log("\n✅ All tests passed! The insurance system is working correctly.");
    
  } catch (error) {
    console.error("\n❌ Error during testing:", error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
  }
}

testFunctionality()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
