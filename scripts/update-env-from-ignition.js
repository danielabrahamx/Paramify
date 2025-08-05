/**
 * Update frontend/.env.local and backend/.env with deployed addresses
 * by reading Hardhat Ignition artifacts.
 *
 * Usage:
 *   node scripts/update-env-from-ignition.js passetHub
 *   node scripts/update-env-from-ignition.js polkavmLocal
 *
 * Strategy:
 * - Determine chainId (from env or known defaults)
 * - Read ignition/deployments/{chainId}/deployed_addresses.json (preferred)
 *   Fallbacks:
 *    - ignition/deployments/{chainId}/artifacts/ (module artifacts with addresses)
 * - Update:
 *    frontend/.env.local: VITE_PARAMIFY_CONTRACT_ADDRESS, VITE_MOCK_AGGREGATOR_ADDRESS
 *    backend/.env: PARAMIFY_CONTRACT_ADDRESS, MOCK_AGGREGATOR_ADDRESS
 */
const fs = require('fs');
const path = require('path');

const network = (process.argv[2] || 'passetHub').trim();

const DEFAULTS = {
  passetHub: { chainId: 420420422 },
  polkavmLocal: { chainId: 420420420 },
};

function banner(msg) {
  console.log('\n=== ' + msg + ' ===');
}

function fail(msg) {
  console.error('❌ ' + msg);
  process.exit(1);
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function tryFindDeployedAddresses(baseDir) {
  const file = path.join(baseDir, 'deployed_addresses.json');
  if (fs.existsSync(file)) {
    return readJson(file);
  }
  return null;
}

function scanArtifactsForAddresses(artifactsDir) {
  // Fallback: scan JSONs under artifactsDir for known contract names and addresses
  let result = {};
  if (!fs.existsSync(artifactsDir)) return result;
  const entries = fs.readdirSync(artifactsDir);
  for (const f of entries) {
    const full = path.join(artifactsDir, f);
    if (fs.statSync(full).isFile() && f.endsWith('.json')) {
      try {
        const data = readJson(full);
        // Heuristics: look for "address" and "contractName" or "name"
        const address = data.address || data.contractAddress || data.deployedAddress;
        const name = data.contractName || data.name || data.moduleName;
        if (address && name) {
          result[name] = address;
        }
      } catch { /* ignore */ }
    }
  }
  return result;
}

function updateEnvFile(filePath, kv) {
  const lines = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8').split(/\r?\n/) : [];
  const keys = Object.keys(kv);

  const present = new Set();
  const out = lines.map((line) => {
    const idx = line.indexOf('=');
    if (idx === -1) return line;
    const key = line.slice(0, idx).trim();
    if (keys.includes(key)) {
      present.add(key);
      return key + '=' + kv[key];
    }
    return line;
  });

  for (const k of keys) {
    if (!present.has(k)) {
      out.push(k + '=' + kv[k]);
    }
  }

  fs.writeFileSync(filePath, out.join('\n'));
}

(async () => {
  banner('Update Env From Ignition');
  const chainIdEnv = process.env.CHAIN_ID ? Number(process.env.CHAIN_ID) : undefined;
  const chainId = chainIdEnv || (DEFAULTS[network] ? DEFAULTS[network].chainId : undefined);
  if (!chainId) fail('Cannot determine chainId. Set CHAIN_ID or use a known network (passetHub/polkavmLocal).');

  const base = path.join('ignition', 'deployments', String(chainId));
  if (!fs.existsSync(base)) {
    fail(`Ignition deployments directory not found: ${base}`);
  }

  // Preferred source
  let deployed = tryFindDeployedAddresses(base);
  if (!deployed) {
    // Fallback: scan artifacts dir
    const artifactsDir = path.join(base, 'artifacts');
    const scanned = scanArtifactsForAddresses(artifactsDir);
    if (Object.keys(scanned).length === 0) {
      fail('Could not find deployed addresses in Ignition outputs.');
    }
    deployed = scanned;
  }

  // Resolve addresses by contract name heuristics
  // Common module naming: Paramify, MockV3Aggregator
  const candidates = [
    { key: 'Paramify', envFront: 'VITE_PARAMIFY_CONTRACT_ADDRESS', envBack: 'PARAMIFY_CONTRACT_ADDRESS' },
    { key: 'MockV3Aggregator', envFront: 'VITE_MOCK_AGGREGATOR_ADDRESS', envBack: 'MOCK_AGGREGATOR_ADDRESS' },
  ];

  // Flatten potential structures: either { "Paramify#Paramify": "0x..." } or { "Paramify": { address: "0x..." } }
  function findAddress(name) {
    // Exact key
    if (typeof deployed[name] === 'string') return deployed[name];
    if (deployed[name] && typeof deployed[name].address === 'string') return deployed[name].address;

    // Try keys like "Module#Contract"
    const hit = Object.entries(deployed).find(([k, v]) => k.toLowerCase().includes(name.toLowerCase()) && (typeof v === 'string' || (v && typeof v.address === 'string')));
    if (hit) {
      const v = hit[1];
      return typeof v === 'string' ? v : v.address;
    }
    return undefined;
  }

  const updatesFront = {};
  const updatesBack = {};

  for (const c of candidates) {
    const addr = findAddress(c.key);
    if (addr) {
      updatesFront[c.envFront] = addr;
      updatesBack[c.envBack] = addr;
    }
  }

  if (!updatesFront['VITE_PARAMIFY_CONTRACT_ADDRESS']) {
    console.warn('⚠ Could not detect Paramify address. Env files will not be updated for Paramify.');
  }
  if (!updatesFront['VITE_MOCK_AGGREGATOR_ADDRESS']) {
    console.warn('⚠ Could not detect MockV3Aggregator address. Env files will not be updated for Mock.');
  }

  const frontEnv = path.join('frontend', '.env.local');
  const backEnv = path.join('backend', '.env');

  if (Object.keys(updatesFront).length > 0) {
    banner('Updating frontend/.env.local');
    updateEnvFile(frontEnv, updatesFront);
    console.log('✓ frontend/.env.local updated:', updatesFront);
  } else {
    console.log('No frontend updates detected.');
  }

  if (Object.keys(updatesBack).length > 0) {
    banner('Updating backend/.env');
    updateEnvFile(backEnv, updatesBack);
    console.log('✓ backend/.env updated:', updatesBack);
  } else {
    console.log('No backend updates detected.');
  }

  banner('Env update complete');
})();