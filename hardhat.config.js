require('@nomicfoundation/hardhat-toolbox');
require('@parity/hardhat-polkadot');  // PolkaVM support plugin
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: '0.8.26',
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
  networks: {
    hardhat: {
      polkavm: true,  // in-memory PolkaVM node for tests
      nodeConfig: {
        mode: 'mock'
      }
    },
    localNode: {
      polkavm: true,  // connect to standalone PolkaVM node
      url: 'http://127.0.0.1:8545',
      chainId: 420420420,
      nodeConfig: {
        mode: 'mock'
      }
    },
    polkadotHubTestnet: {
      polkavm: true,
      url: 'https://testnet-passet-hub-eth-rpc.polkadot.io',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 420420422,
      timeout: 120000,
    },
  },
};
