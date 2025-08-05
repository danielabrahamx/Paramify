require("@parity/hardhat-polkadot");
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Normalize env for deploy accounts: prefer DEPLOYER_PRIVATE_KEY, fallback to PRIVATE_KEY or backend ADMIN_PRIVATE_KEY
if (!process.env.DEPLOYER_PRIVATE_KEY) {
  if (process.env.PRIVATE_KEY) process.env.DEPLOYER_PRIVATE_KEY = process.env.PRIVATE_KEY;
  if (!process.env.DEPLOYER_PRIVATE_KEY && process.env.ADMIN_PRIVATE_KEY) {
    process.env.DEPLOYER_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
  }
}
// Keep PRIVATE_KEY in sync for tools that still read it
if (!process.env.PRIVATE_KEY && process.env.DEPLOYER_PRIVATE_KEY) {
  process.env.PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
}

/** @type import("hardhat/config").HardhatUserConfig */
module.exports = {
  // Pure PolkaVM toolchain
  // Set the Solidity compiler version per provided guidance.
  solidity: '0.8.28',

  // resolc configuration for PolkaVM compilation.
  // IMPORTANT: Do NOT pin a resolc version; let the plugin auto-select a compatible build.
  resolc: {
    // version: (process.env.RESOLC_VERSION || '0.8.28').trim(), // intentionally commented to avoid ResolcPluginError
    compilerSource: 'npm',
    optimizer: {
      enabled: true,
      parameters: 'z',
      fallbackOz: true,
      runs: 200
    },
    standardJson: true
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },

  // @parity/hardhat-polkadot drives compilation/runtime for PolkaVM.
  networks: {
    // PassetHub testnet (PolkaVM)
    passetHub: {
      polkavm: true,
      url: process.env.RPC_URL || 'https://testnet-passet-hub-eth-rpc.polkadot.io',
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : (process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []),
      chainId: Number(process.env.CHAIN_ID || 420420422),
      timeout: 180000,
    },
  },
};
