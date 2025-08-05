require('@nomicfoundation/hardhat-toolbox');
require("@parity/hardhat-polkadot");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  // Pure PolkaVM toolchain
  solidity: '0.8.26',
  // Let @parity/hardhat-polkadot manage resolc internally (no explicit version).
  // Using npm-based resolc source only.
  resolc: {
    compilerSource: 'npm',
    settings: {
      optimizer: {
        enabled: true,
        parameters: 'z',
        fallbackOz: true,
        runs: 200,
      },
      standardJson: true,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  // @parity/hardhat-polkadot drives compilation/runtime for PolkaVM.
  // Note: The plugin’s recent versions removed resolc config from userland; compilation is handled internally.
  networks: {
    // (Optional) Local PolkaVM via node + ETH-RPC adapter.
    // Keeping this commented for the simplest workflow targeting PassetHub testnet only.
    // Uncomment and provide binaries later if you want a local node.
    // polkavmLocal: {
    //   polkavm: true,
    //   nodeConfig: {
    //     nodeBinaryPath: process.env.PVM_NODE_BIN || "tools/polkavm-node",
    //     rpcPort: Number(process.env.PVM_NODE_RPC_PORT || 8000),
    //     dev: true,
    //   },
    //   adapterConfig: {
    //     adapterBinaryPath: process.env.PVM_ADAPTER_BIN || "tools/eth-rpc-adapter",
    //     dev: true,
    //   },
    //   chainId: 420420420,
    //   timeout: 180000,
    // },

    // PassetHub testnet (PolkaVM)
    passetHub: {
      polkavm: true,
      url: 'https://testnet-passet-hub-eth-rpc.polkadot.io',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 420420422,
      timeout: 180000,
    },
  },
};
