/**
 * Pre-deployment checks for Paramify PolkaVM deployments.
 * Usage:
 *   node scripts/predeploy-checks.js passetHub
 *   node scripts/predeploy-checks.js polkavmLocal
 *
 * Exits with non-zero code if checks fail.
 */
const fs = require('fs');
const path = require('path');

const network = process.argv[2] || 'passetHub';

function banner(msg) {
  console.log('\n=== ' + msg + ' ===');
}

function getEnv(name, fallback = undefined) {
  if (process.env[name] !== undefined && process.env[name] !== '') return process.env[name];
  return fallback;
}

function fail(msg) {
  console.error('❌ ' + msg);
  process.exit(1);
}

(async () => {
  banner('Pre-deployment Checks');

  // Keys
  const privateKey = getEnv('PRIVATE_KEY') || getEnv('DEPLOYER_PRIVATE_KEY');
  if (!privateKey || !/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    fail('Missing or invalid PRIVATE_KEY/DEPLOYER_PRIVATE_KEY. Expected a 0x-prefixed 64-hex string.');
  } else {
    console.log('✓ Private key present');
  }

  // RPC/Chain
  if (network === 'passetHub') {
    const rpcUrl = getEnv('RPC_URL', 'https://testnet-passet-hub-eth-rpc.polkadot.io');
    const chainId = Number(getEnv('CHAIN_ID', '420420422'));
    if (!rpcUrl) fail('RPC_URL not set for passetHub');
    if (!Number.isFinite(chainId)) fail('CHAIN_ID not numeric for passetHub');
    console.log('Target:', network, 'RPC_URL=', rpcUrl, 'CHAIN_ID=', chainId);
    try {
      const { ethers } = require('ethers');
      const provider = new ethers.JsonRpcProvider(rpcUrl, chainId);
      const net = await provider.getNetwork();
      console.log('✓ RPC reachable. Reported chainId:', net.chainId.toString());
    } catch (e) {
      fail('Cannot reach RPC_URL: ' + e.message);
    }
  } else if (network === 'polkavmLocal') {
    const nodeBin = getEnv('PVM_NODE_BIN', '/home/danie/polkadot-sdk/target/release/substrate-node');
    const adapterBin = getEnv('PVM_ADAPTER_BIN', '/home/danie/polkadot-sdk/target/release/eth-rpc');
    const rpcPort = Number(getEnv('PVM_NODE_RPC_PORT', '8000'));

    console.log('Local binaries:');
    console.log('  PVM_NODE_BIN=', nodeBin);
    console.log('  PVM_ADAPTER_BIN=', adapterBin);
    console.log('  PVM_NODE_RPC_PORT=', rpcPort);

    if (!fs.existsSync(nodeBin)) fail(`Node binary not found at ${nodeBin}`);
    if (!fs.existsSync(adapterBin)) fail(`Adapter binary not found at ${adapterBin}`);

    // Try connecting to local RPC if adapter exposes http://localhost:rpcPort
    // This is best-effort: user must run node and adapter in their terminals.
    try {
      const { ethers } = require('ethers');
      const provider = new ethers.JsonRpcProvider(`http://127.0.0.1:${rpcPort}`);
      const net = await provider.getNetwork();
      console.log('✓ Local RPC reachable. Reported chainId:', net.chainId.toString());
    } catch (e) {
      console.warn('⚠ Could not reach local RPC on port', rpcPort, '- ensure node and adapter are running. Proceeding anyway.');
    }
  } else {
    console.log('Unknown network param:', network);
  }

  // Node version check
  banner('Node Environment');
  console.log('Node:', process.version);
  const pkgPath = path.resolve(process.cwd(), 'package.json');
  if (!fs.existsSync(pkgPath)) fail('package.json not found at project root');
  console.log('✓ package.json present');

  banner('Checks complete');
})();