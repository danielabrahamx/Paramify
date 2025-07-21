// Auto-generated contract addresses
export const PARAMIFY_CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
export const MOCK_AGGREGATOR_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const BACKEND_URL = "http://localhost:3001";

// For backward compatibility
export const PARAMIFY_ADDRESS = PARAMIFY_CONTRACT_ADDRESS;
export const MOCK_ORACLE_ADDRESS = MOCK_AGGREGATOR_ADDRESS;

// Import ABIs directly as arrays
import paramifyAbiJson from './minimal-abi.json';
import mockOracleAbiJson from '../../../mock-aggregator-abi.json';

// Export ABIs as arrays (explicitly cast to ensure they're iterable)
export const PARAMIFY_ABI = paramifyAbiJson as any[];
export const MOCK_ORACLE_ABI = mockOracleAbiJson as any[];

// Helper function to detect PolkaVM network
export function isPolkaVMNetwork() {
  // Check if the chain ID is one of the PolkaVM networks
  // Chain ID 420420420 for local PolkaVM, 420420422 for Passet Hub
  return window.ethereum && (
    window.ethereum.chainId === '0x19064a14' || // 420420420 in hex
    window.ethereum.chainId === '0x19064a16'     // 420420422 in hex
  );
}

// Helper function to get contract addresses
export function getContractAddresses() {
  return {
    paramify: PARAMIFY_CONTRACT_ADDRESS,
    oracle: MOCK_AGGREGATOR_ADDRESS
  };
}