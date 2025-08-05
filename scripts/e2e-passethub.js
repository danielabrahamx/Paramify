/**
 * Minimal E2E smoke test against PassetHub (or polkavmLocal if envs point there).
 * - Reads RPC_URL, CHAIN_ID, PRIVATE_KEY/DEPLOYER_PRIVATE_KEY
 * - Reads deployed addresses from backend/.env or frontend/.env.local
 * - Connects with ethers and performs simple sanity checks:
 *   - Reads Paramify owner/threshold if available
 *   - Reads MockV3Aggregator decimals and latestRoundData if available
 *   - Optionally attempts a test write to MockV3Aggregator if ABI supports it (non-critical)
 *
 * Usage:
 *   npm run polkavm:e2e
 *   or: node scripts/e2e-passethub.js
 */
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

// Load ABIs
const PARAMIFY_ABI = require('../frontend/src/lib/minimal-abi.json');
const MOCK_AGGREGATOR_ABI = require('../mock-aggregator-abi.json');

function loadEnvFile(filepath) {
  if (!fs.existsSync(filepath)) return {};
  const raw = fs.readFileSync(filepath, 'utf8');
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    out[key] = val;
  }
  return out;
}

function firstNonEmpty(...vals) {
  for (const v of vals) {
    if (v !== undefined && v !== null && String(v).trim() !== '') return v;
  }
  return undefined;
}

(async () => {
  console.log('=== Paramify E2E Smoke Test ===');

  // Gather envs
  const rootEnv = process.env;
  const backendEnv = loadEnvFile(path.join('backend', '.env'));
  const frontendEnv = loadEnvFile(path.join('frontend', '.env.local'));

  const rpcUrl = firstNonEmpty(rootEnv.RPC_URL, frontendEnv.VITE_RPC_URL, 'https://testnet-passet-hub-eth-rpc.polkadot.io');
  const chainId = Number(firstNonEmpty(rootEnv.CHAIN_ID, frontendEnv.VITE_CHAIN_ID, 420420422));
  const pk = firstNonEmpty(rootEnv.PRIVATE_KEY, rootEnv.DEPLOYER_PRIVATE_KEY, backendEnv.ADMIN_PRIVATE_KEY);

  if (!pk || !/^0x[0-9a-fA-F]{64}$/.test(pk)) {
    console.error('❌ Missing or invalid PRIVATE_KEY/DEPLOYER_PRIVATE_KEY for E2E.');
    process.exit(1);
  }

  const paramifyAddr = firstNonEmpty(backendEnv.PARAMIFY_CONTRACT_ADDRESS, frontendEnv.VITE_PARAMIFY_CONTRACT_ADDRESS);
  const mockAddr = firstNonEmpty(backendEnv.MOCK_AGGREGATOR_ADDRESS, frontendEnv.VITE_MOCK_AGGREGATOR_ADDRESS);

  console.log('RPC_URL:', rpcUrl);
  console.log('CHAIN_ID:', chainId);
  console.log('PARAMIFY:', paramifyAddr || '(not set)');
  console.log('MOCK:', mockAddr || '(not set)');

  // Provider + wallet
  const provider = new ethers.JsonRpcProvider(rpcUrl, chainId);
  const wallet = new ethers.Wallet(pk, provider);

  // Network sanity
  const net = await provider.getNetwork();
  console.log('Connected chainId:', net.chainId.toString());

  const bal = await provider.getBalance(wallet.address);
  console.log('Wallet:', wallet.address, 'Balance:', ethers.formatEther(bal), 'ETH');

  // Contracts
  if (!paramifyAddr || !mockAddr) {
    console.warn('⚠ Contract addresses are missing. Ensure deployment completed and env files were updated.');
  }

  // Mock checks
  if (mockAddr) {
    try {
      const mock = new ethers.Contract(mockAddr, MOCK_AGGREGATOR_ABI, wallet);
      const decimals = await mock.decimals();
      const latest = await mock.latestRoundData();
      console.log('MockV3Aggregator decimals:', decimals.toString());
      console.log('Mock latest answer:', latest.answer ? latest.answer.toString() : JSON.stringify(latest));

      // Optional write if function exists (non-fatal if not present)
      if (typeof mock.updateAnswer === 'function') {
        console.log('Attempting mock updateAnswer write (optional)...');
        const tx = await mock.updateAnswer(2000n * 10n ** BigInt(decimals));
        await tx.wait();
        const latest2 = await mock.latestRoundData();
        console.log('Updated mock latest answer:', latest2.answer ? latest2.answer.toString() : JSON.stringify(latest2));
      }
    } catch (e) {
      console.warn('Mock aggregator interaction warning:', e.message);
    }
  }

  // Paramify checks
  if (paramifyAddr) {
    try {
      const paramify = new ethers.Contract(paramifyAddr, PARAMIFY_ABI, wallet);
      if (paramify.owner) {
        const owner = await paramify.owner();
        console.log('Paramify owner:', owner);
      }
      if (paramify.floodThreshold) {
        const thr = await paramify.floodThreshold();
        console.log('Paramify threshold:', thr.toString());
      }
      // More interactions can be added if ABI supports purchase/claim flows
    } catch (e) {
      console.warn('Paramify interaction warning:', e.message);
    }
  }

  console.log('=== E2E Smoke Test Completed ===');
})();