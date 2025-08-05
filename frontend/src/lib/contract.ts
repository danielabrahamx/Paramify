/**
 * PassetHub Testnet addresses and config are sourced from environment variables.
 * This removes legacy Hardhat/PolkaVM-local hardcoded addresses.
 */
const env = (import.meta as any).env || {};
export const PARAMIFY_CONTRACT_ADDRESS = env.VITE_PARAMIFY_CONTRACT_ADDRESS || "";
export const MOCK_AGGREGATOR_ADDRESS = env.VITE_MOCK_AGGREGATOR_ADDRESS || "";
export const BACKEND_URL = env.VITE_BACKEND_URL || "";

// For backward compatibility
export const PARAMIFY_ADDRESS = PARAMIFY_CONTRACT_ADDRESS;
export const MOCK_ORACLE_ADDRESS = MOCK_AGGREGATOR_ADDRESS;

// Import ABIs directly as arrays
import paramifyAbiJson from './minimal-abi.json';
import mockOracleAbiJson from '../../../mock-aggregator-abi.json';

// Export ABIs as arrays (explicitly cast to ensure they're iterable)
export const PARAMIFY_ABI = paramifyAbiJson as any[];
export const MOCK_ORACLE_ABI = mockOracleAbiJson as any[];

/**
 * Network helpers (PassetHub-only)
 */
export const VITE_CHAIN_ID = Number(env.VITE_CHAIN_ID || 420420422);
export const VITE_RPC_URL = env.VITE_RPC_URL || 'https://testnet-passet-hub-eth-rpc.polkadot.io';
export const NETWORK_NAME = 'PassetHub Testnet';
export const CURRENCY_SYMBOL = 'ETH';

// PassetHub-only network check
export function isPolkaVMNetwork() {
  if (!window.ethereum) return false;
  // Compare to hex chain id for 420420422
  const expectedHex = '0x' + VITE_CHAIN_ID.toString(16);
  return window.ethereum.chainId?.toLowerCase() === expectedHex.toLowerCase();
}

/**
 * Contract addresses helper
 */
export function getContractAddresses() {
  if (!PARAMIFY_CONTRACT_ADDRESS || !VITE_RPC_URL) {
    console.warn("Contract addresses or RPC not set. Ensure .env.local has VITE_PARAMIFY_CONTRACT_ADDRESS, VITE_RPC_URL, VITE_CHAIN_ID.");
  }
  return {
    paramify: PARAMIFY_CONTRACT_ADDRESS,
    oracle: MOCK_AGGREGATOR_ADDRESS,
  };
}
