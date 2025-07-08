const { ethers } = require("hardhat");

async function main() {
    console.log("=== Testing Paramify Contract Functionality ===\n");
    
    const [deployer, user1, user2] = await ethers.getSigners();
    
    // Contract addresses from deployment
    const PARAMIFY_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    const MOCK_ORACLE_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    
    // Get contract instances
    const Paramify = await ethers.getContractFactory("Paramify");
    const paramify = Paramify.attach(PARAMIFY_ADDRESS);
    
    const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
    const mockOracle = MockV3Aggregator.attach(MOCK_ORACLE_ADDRESS);
    
    console.log("📊 Initial Contract Status:");
    console.log("- Deployer:", deployer.address);
    console.log("- User1:", user1.address);
    console.log("- User2:", user2.address);
    
    const contractBalance = await paramify.getContractBalance();
    console.log("- Contract Balance:", ethers.formatEther(contractBalance), "ETH");
    
    const floodLevel = await paramify.getLatestPrice();
    console.log("- Current Flood Level:", floodLevel.toString());
    
    const threshold = await paramify.getCurrentThreshold();
    console.log("- Current Threshold:", threshold.toString());
    
    console.log("\n=== Test 1: Fund Contract ===");
    const fundAmount = ethers.parseEther("10"); // 10 ETH
    console.log("Funding contract with", ethers.formatEther(fundAmount), "ETH...");
    
    // Send ETH directly to contract (uses receive() function)
    const fundTx = await deployer.sendTransaction({
        to: PARAMIFY_ADDRESS,
        value: fundAmount
    });
    await fundTx.wait();
    console.log("✅ Contract funded successfully!");
    
    const newBalance = await paramify.getContractBalance();
    console.log("- New Contract Balance:", ethers.formatEther(newBalance), "ETH");
    
    console.log("\n=== Test 2: Buy Insurance (User2) ===");
    const coverage = ethers.parseEther("2"); // 2 ETH coverage
    const premium = ethers.parseEther("0.2"); // 10% premium
    
    // Check if user already has a policy
    const existingPolicy = await paramify.policies(user2.address);
    if (existingPolicy.active) {
        console.log("User2 already has an active policy:");
        console.log("- Policy Coverage:", ethers.formatEther(existingPolicy.coverage), "ETH");
        console.log("- Policy Active:", existingPolicy.active);
        console.log("- Policy Paid Out:", existingPolicy.paidOut);
    } else {
        console.log("User2 buying insurance with", ethers.formatEther(coverage), "ETH coverage...");
        console.log("Premium:", ethers.formatEther(premium), "ETH");
        
        const buyTx = await paramify.connect(user2).buyInsurance(coverage, { value: premium });
        await buyTx.wait();
        console.log("✅ Insurance purchased successfully!");
        
        // Check policy
        const policy = await paramify.policies(user2.address);
        console.log("- Policy Coverage:", ethers.formatEther(policy.coverage), "ETH");
        console.log("- Policy Active:", policy.active);
        console.log("- Policy Paid Out:", policy.paidOut);
    }
    
    console.log("\n=== Test 3: Update Flood Level ===");
    const newFloodLevel = 500000000000; // High flood level (5.0 feet)
    console.log("Updating flood level to:", newFloodLevel);
    
    const updateTx = await mockOracle.connect(deployer).updateAnswer(newFloodLevel);
    await updateTx.wait();
    console.log("✅ Flood level updated!");
    
    const updatedFloodLevel = await paramify.getLatestPrice();
    console.log("- New Flood Level:", updatedFloodLevel.toString());
    
    console.log("\n=== Test 4: Set Lower Threshold for Payout ===");
    // Set threshold lower than current flood level to trigger payout
    const newThreshold = 300000000000; // 3.0 feet (lower than current 5.0 feet)
    console.log("Setting threshold to:", newThreshold, "(3.0 feet)");
    
    const thresholdTx = await paramify.connect(deployer).setThreshold(newThreshold);
    await thresholdTx.wait();
    console.log("✅ Threshold updated!");
    
    const updatedThreshold = await paramify.getCurrentThreshold();
    console.log("- New Threshold:", updatedThreshold.toString());
    
    console.log("\n=== Test 5: Trigger Payout (Should Work Now) ===");
    console.log("Checking if payout can be triggered...");
    
    const user1BalanceBefore = await ethers.provider.getBalance(user1.address);
    console.log("- User1 Balance Before:", ethers.formatEther(user1BalanceBefore), "ETH");
    
    try {
        const payoutTx = await paramify.connect(user1).triggerPayout();
        await payoutTx.wait();
        console.log("✅ Payout triggered successfully!");
        
        const user1BalanceAfter = await ethers.provider.getBalance(user1.address);
        console.log("- User1 Balance After:", ethers.formatEther(user1BalanceAfter), "ETH");
        
        const finalPolicy = await paramify.policies(user1.address);
        console.log("- Policy Paid Out:", finalPolicy.paidOut);
        
    } catch (error) {
        console.log("❌ Payout failed:", error.message);
    }
    
    console.log("\n=== Test 6: Final Contract Status ===");
    
    // Final contract balance
    const finalContractBalance = await paramify.getContractBalance();
    console.log("- Final Contract Balance:", ethers.formatEther(finalContractBalance), "ETH");
    
    console.log("\n🎉 All tests completed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Test failed:", error);
        process.exit(1);
    });
