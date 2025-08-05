require("@parity/hardhat-polkadot");
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// normalize keys (your existing code)
if (!process.env.DEPLOYER_PRIVATE_KEY) {
  if (process.env.PRIVATE_KEY) process.env.DEPLOYER_PRIVATE_KEY = process.env.PRIVATE_KEY;
  if (!process.env.DEPLOYER_PRIVATE_KEY && process.env.ADMIN_PRIVATE_KEY) {
    process.env.DEPLOYER_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
  }
}
if (!process.env.PRIVATE_KEY && process.env.DEPLOYER_PRIVATE_KEY) {
  process.env.PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
}

// Defaults for gas controls on passetHub to avoid dropped txs due to null/unsupported fee data
const GAS_PRICE = Number(process.env.GAS_PRICE || 1e9);     // 1 gwei
const GAS_LIMIT = Number(process.env.GAS_LIMIT || 5_000_000);

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  // Standard Solidity config (used by Hardhat for normal compile steps)
  solidity: {
    version: '0.8.28',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  // PolkaVM resolc config for hardhat-polkadot plugin.
  // Remove explicit version to allow the plugin to auto-resolve a valid compiler.
  // Keep optimizer/settings intact.
  resolc: {
    compilerSource: 'npm',
    optimizer: {
      enabled: true,
      parameters: 'z',
      fallbackOz: true,
      runs: 200,
    },
    standardJson: true
  },

  // Explicitly disable gas-reporter against PolkaVM endpoints to avoid unsupported RPCs
  gasReporter: {
    enabled: false,
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    // Local PolkaVM node + ETH-RPC adapter configuration
    // Fill in the binary paths or set via environment variables:
    //   PVM_NODE_BIN=/path/to/substrate-node
    //   PVM_ADAPTER_BIN=/path/to/eth-rpc-adapter
    hardhat: {
      polkavm: true,
      nodeConfig: {
        nodeBinaryPath: process.env.PVM_NODE_BIN || '/home/danie/polkadot-sdk/target/release/substrate-node',
        rpcPort: Number(process.env.PVM_RPC_PORT || 8000),
        dev: true,
      },
      adapterConfig: {
        adapterBinaryPath: process.env.PVM_ADAPTER_BIN || '/home/danie/polkadot-sdk/target/release/eth-rpc',
        dev: true,
      },
    },

    passetHub: {
      polkavm: true,
      url: process.env.RPC_URL || 'https://testnet-passet-hub-eth-rpc.polkadot.io',
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : (process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []),
      chainId: Number(process.env.CHAIN_ID || 420420422),
      timeout: 180000,

      // Force legacy-style gas to avoid adapter returning null fee data
      gasPrice: GAS_PRICE,
      gas: GAS_LIMIT,
    },
  },
};