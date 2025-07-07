require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          evmVersion: "paris", // More compatible EVM version
        },
      },
      {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          evmVersion: "paris", // More compatible EVM version
        },
      }
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // Passet Hub testnet - currently having deployment issues
    passetHub: {
      url: process.env.PASSET_HUB_RPC_URL || "https://testnet-passet-hub-eth-rpc.polkadot.io",
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 66 ? [process.env.PRIVATE_KEY] : [],
      chainId: 420420422,
      timeout: 120000,
    },
    // Moonbeam testnet (EVM compatible, works with MetaMask)
    moonbaseAlpha: {
      url: "https://rpc.api.moonbase.moonbeam.network",
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 66 ? [process.env.PRIVATE_KEY] : [],
      chainId: 1287,
      timeout: 120000,
    },
    // Astar Shibuya testnet (EVM compatible, works with MetaMask)  
    shibuya: {
      url: "https://evm.shibuya.astar.network",
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 66 ? [process.env.PRIVATE_KEY] : [],
      chainId: 81,
      timeout: 120000,
    },
  },
};
