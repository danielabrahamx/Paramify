/**
 * PolkaVM Passet Hub configuration (reads from Vite env at runtime)
 * Addresses are provided via .env files after deployment.
 */
export const NETWORKS = {
  PASSET_HUB: 420420422
};

export const VITE_CHAIN_ID: number = (() => {
  const raw = (import.meta as any).env?.VITE_CHAIN_ID;
  if (!raw) return NETWORKS.PASSET_HUB;
  const s = String(raw).trim();
  const n = s.startsWith('0x') ? parseInt(s, 16) : parseInt(s, 10);
  return Number.isFinite(n) ? n : NETWORKS.PASSET_HUB;
})();

export const VITE_RPC_URL: string =
  (import.meta as any).env?.VITE_RPC_URL || 'https://testnet-passet-hub-eth-rpc.polkadot.io';

export const NETWORK_NAME = 'PassetHub Testnet';
export const CURRENCY_SYMBOL = 'ETH';

/**
 * Contract addresses (populated from env)
 */
export const PARAMIFY_CONTRACT_ADDRESS: string =
  (import.meta as any).env?.VITE_PARAMIFY_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

export const MOCK_AGGREGATOR_ADDRESS: string =
  (import.meta as any).env?.VITE_MOCK_AGGREGATOR_ADDRESS || '0x0000000000000000000000000000000000000000';

// Backward compatibility aliases
export const PARAMIFY_ADDRESS = PARAMIFY_CONTRACT_ADDRESS;
export const MOCK_ORACLE_ADDRESS = MOCK_AGGREGATOR_ADDRESS;

/**
 * PassetHub-only network check
 */
export function isPolkaVMNetwork(): boolean {
  if (!(globalThis as any).window?.ethereum) return false;
  const expectedHex = '0x' + VITE_CHAIN_ID.toString(16);
  const actual = (window as any).ethereum.chainId || '';
  return String(actual).toLowerCase() === expectedHex.toLowerCase();
}

/**
 * Contract address helper
 */
export function getContractAddresses() {
  return {
    paramify: PARAMIFY_CONTRACT_ADDRESS,
    oracle: MOCK_AGGREGATOR_ADDRESS,
  };
}
