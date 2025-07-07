const { ethers } = require("hardhat");

async function main() {
    console.log("=== Investigating Existing Contract on Passet Hub ===\n");
    
    const ORACLE_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    
    try {
        // Connect to Passet Hub
        const provider = new ethers.JsonRpcProvider("https://testnet-passet-hub-eth-rpc.polkadot.io");
        const [signer] = await ethers.getSigners();
        
        console.log("Connected to Passet Hub testnet");
        
        // Get contract bytecode
        const code = await provider.getCode(ORACLE_ADDRESS);
        console.log("\nContract at", ORACLE_ADDRESS);
        console.log("Code length:", code.length, "bytes");
        console.log("Code hash:", ethers.keccak256(code).substring(0, 10) + "...");
        
        // Try to identify the contract by testing different function selectors
        console.log("\n=== Testing Function Selectors ===");
        
        const testSelectors = [
            // MockV3Aggregator functions
            { selector: "0x50d25bcd", name: "latestAnswer()" },
            { selector: "0xa87a20ce", name: "updateAnswer(int256)" },
            { selector: "0x313ce567", name: "decimals()" },
            { selector: "0x54fd4d50", name: "version()" },
            { selector: "0x668a0f02", name: "latestRound()" },
            { selector: "0x9a6fc8f5", name: "getRoundData(uint80)" },
            { selector: "0xfeaf968c", name: "latestRoundData()" },
            
            // Common contract functions
            { selector: "0x8da5cb5b", name: "owner()" },
            { selector: "0x06fdde03", name: "name()" },
            { selector: "0x95d89b41", name: "symbol()" },
            { selector: "0x18160ddd", name: "totalSupply()" },
            { selector: "0x70a08231", name: "balanceOf(address)" },
            
            // Paramify functions
            { selector: "0x0f6ba2fa", name: "getCurrentThreshold()" },
            { selector: "0xb6c6ec46", name: "getThresholdInFeet()" },
            { selector: "0x8205bf6a", name: "getLatestPrice()" },
            
            // Minimal/test contract functions
            { selector: "0x60fe47b1", name: "set(uint256)" },
            { selector: "0x6d4ce63c", name: "get()" },
            { selector: "0x2e64cec1", name: "retrieve()" },
            { selector: "0x6057361d", name: "store(uint256)" }
        ];
        
        for (const { selector, name } of testSelectors) {
            try {
                const result = await provider.call({
                    to: ORACLE_ADDRESS,
                    data: selector
                });
                console.log(`✅ ${name} - Success! Result: ${result}`);
                
                // Try to decode the result if it's not empty
                if (result !== "0x" && result.length > 2) {
                    try {
                        const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], result);
                        console.log(`   Decoded as uint256: ${decoded[0].toString()}`);
                    } catch (e) {
                        // Try as int256
                        try {
                            const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["int256"], result);
                            console.log(`   Decoded as int256: ${decoded[0].toString()}`);
                        } catch (e2) {
                            // Ignore decode errors
                        }
                    }
                }
            } catch (error) {
                // Only log if it's not a revert
                if (!error.message.includes("require(false)")) {
                    console.log(`❌ ${name} - ${error.message.substring(0, 50)}...`);
                }
            }
        }
        
        // Check transaction history
        console.log("\n=== Checking Recent Transactions ===");
        const latestBlock = await provider.getBlockNumber();
        console.log("Latest block:", latestBlock);
        
        // Note: Passet Hub might not support all Ethereum RPC methods
        try {
            const history = await provider.getLogs({
                address: ORACLE_ADDRESS,
                fromBlock: Math.max(0, latestBlock - 1000),
                toBlock: latestBlock
            });
            console.log("Recent events:", history.length);
        } catch (error) {
            console.log("Could not fetch logs:", error.message);
        }
        
    } catch (error) {
        console.error("\n❌ Script error:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
