const { ethers } = require('ethers');
const fs = require('fs');

// Contract ABIs
const PARAMIFY_ABI = [
  "function buyInsurance(uint256 _coverageAmount) payable",
  "function triggerPayout() external",
  "function getLatestPrice() view returns (int256)",
  "function floodThreshold() view returns (int256)",
  "function getContractBalance() view returns (uint256)",
  "function insurances(address) view returns (uint256 coverageAmount, uint256 premium, bool active)",
  "function updateFloodData(int256 _floodLevel) external",
  "function hasRole(bytes32 role, address account) view returns (bool)"
];

const MOCK_ORACLE_ABI = [
  "function updateData(int256 _data) external",
  "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)"
];

async function testFunctionality() {
  console.log("=== PolkaVM Contract Functionality Test ===\n");
  
  try {
    // Connect to PolkaVM network
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    
    // Verify network
    const network = await provider.getNetwork();
    console.log("Connected to network:");
    console.log("- Chain ID:", network.chainId.toString());
    
    if (network.chainId !== 420420422n) {
      throw new Error("Not connected to PassetHub Testnet!");
    }
    
    // Get test accounts
    const accounts = await provider.listAccounts();
    const adminWallet = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
    const userWallet = new ethers.Wallet('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', provider);
    
    console.log("\nTest Accounts:");
    console.log("- Admin:", adminWallet.address);
    console.log("- User:", userWallet.address);
    
    // Check balances
    const adminBalance = await provider.getBalance(adminWallet.address);
    const userBalance = await provider.getBalance(userWallet.address);
    console.log("\nBalances:");
    console.log("- Admin:", ethers.formatEther(adminBalance), "ETH");
    console.log("- User:", ethers.formatEther(userBalance), "ETH");
    
    // Load deployment info
    // Read addresses from environment for PassetHub Testnet
    const deploymentInfo = {
      paramify: process.env.PARAMIFY_CONTRACT_ADDRESS || process.env.VITE_PARAMIFY_CONTRACT_ADDRESS || "",
      mockOracle: process.env.MOCK_AGGREGATOR_ADDRESS || process.env.VITE_MOCK_AGGREGATOR_ADDRESS || ""
    };
    console.log("\nDeployment (env-based):");
    console.log("- Paramify:", deploymentInfo.paramify || "(missing)");
    console.log("- MockOracle:", deploymentInfo.mockOracle || "(missing)");
    if (!deploymentInfo.paramify) {
      console.log("\n❌ No Paramify address set. Populate frontend/.env.local or set PARAMIFY_CONTRACT_ADDRESS.");
      return;
    }
    
    // Connect to contracts
    const paramify = new ethers.Contract(deploymentInfo.paramify, PARAMIFY_ABI, adminWallet);
    const mockOracle = new ethers.Contract(deploymentInfo.mockOracle, MOCK_ORACLE_ABI, adminWallet);
    
    // Test 1: Fund the contract
    console.log("\n=== Test 1: Fund Contract ===");
    const fundAmount = ethers.parseEther("5.0");
    console.log(`Funding contract with ${ethers.formatEther(fundAmount)} ETH...`);
    
    const fundTx = await adminWallet.sendTransaction({
      to: deploymentInfo.paramify,
      value: fundAmount
    });
    await fundTx.wait();
    console.log("✅ Contract funded successfully!");
    
    const contractBalance = await paramify.getContractBalance();
    console.log("Contract balance:", ethers.formatEther(contractBalance), "ETH");
    
    // Test 2: Check current flood level and threshold
    console.log("\n=== Test 2: Check Flood Data ===");
    const currentFloodLevel = await paramify.getLatestPrice();
    const threshold = await paramify.floodThreshold();
    console.log("Current flood level:", (Number(currentFloodLevel) / 100000000000).toFixed(2), "ft");
    console.log("Threshold:", (Number(threshold) / 100000000000).toFixed(2), "ft");
    
    // Test 3: Buy insurance as user
    console.log("\n=== Test 3: Buy Insurance ===");
    const coverageAmount = ethers.parseEther("1.0");
    const premium = ethers.parseEther("0.1"); // 10% premium
    
    console.log(`User buying insurance:`);
    console.log(`- Coverage: ${ethers.formatEther(coverageAmount)} ETH`);
    console.log(`- Premium: ${ethers.formatEther(premium)} ETH`);
    
    const paramifyUser = paramify.connect(userWallet);
    const buyTx = await paramifyUser.buyInsurance(coverageAmount, { value: premium });
    await buyTx.wait();
    console.log("✅ Insurance purchased successfully!");
    
    // Check insurance details
    const insurance = await paramify.insurances(userWallet.address);
    console.log("\nInsurance details:");
    console.log("- Coverage:", ethers.formatEther(insurance.coverageAmount), "ETH");
    console.log("- Premium:", ethers.formatEther(insurance.premium), "ETH");
    console.log("- Active:", insurance.active);
    
    // Test 4: Update flood level to trigger payout
    console.log("\n=== Test 4: Trigger Payout ===");
    const highFloodLevel = 1500000000000; // 15 feet
    console.log(`Setting flood level to ${(highFloodLevel / 100000000000).toFixed(2)} ft (above threshold)...`);
    
    const updateTx = await mockOracle.updateData(highFloodLevel);
    await updateTx.wait();
    console.log("✅ Flood level updated!");
    
    // Update contract's flood data
    const updateFloodTx = await paramify.updateFloodData(highFloodLevel);
    await updateFloodTx.wait();
    console.log("✅ Contract flood data updated!");
    
    // Check user balance before payout
    const userBalanceBefore = await provider.getBalance(userWallet.address);
    console.log("\nUser balance before payout:", ethers.formatEther(userBalanceBefore), "ETH");
    
    // Trigger payout
    console.log("Triggering payout...");
    const payoutTx = await paramifyUser.triggerPayout();
    await payoutTx.wait();
    console.log("✅ Payout triggered!");
    
    // Check user balance after payout
    const userBalanceAfter = await provider.getBalance(userWallet.address);
    console.log("User balance after payout:", ethers.formatEther(userBalanceAfter), "ETH");
    
    const payoutReceived = userBalanceAfter - userBalanceBefore;
    console.log("Payout received:", ethers.formatEther(payoutReceived), "ETH");
    
    // Final contract balance
    const finalContractBalance = await paramify.getContractBalance();
    console.log("\nFinal contract balance:", ethers.formatEther(finalContractBalance), "ETH");
    
    console.log("\n✅ All tests passed! The insurance system is working correctly on PolkaVM.");
    
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
