// Auto-generated contract addresses
export const PARAMIFY_CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
export const MOCK_AGGREGATOR_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const BACKEND_URL = "http://localhost:3001";
export const PARAMIFY_ADDRESS = PARAMIFY_CONTRACT_ADDRESS;

// Import ABIs from JSON files
import paramifyAbiJson from '../../../paramify-abi.json';
import mockAggregatorAbiJson from '../../../mock-aggregator-abi.json';

// Extract the ABI from the JSON files
export const PARAMIFY_ABI = paramifyAbiJson.abi;
export const MOCK_ORACLE_ABI = mockAggregatorAbiJson;

// Function to get contract addresses for different networks
export function getContractAddresses(chainId: number) {
  // Default to localhost Hardhat network addresses
  const defaultAddresses = {
    paramify: PARAMIFY_CONTRACT_ADDRESS,
    mockOracle: MOCK_AGGREGATOR_ADDRESS,
  };

  // PolkaVM Local is currently using chainId 420420420
  if (chainId === 420420420) {
    return defaultAddresses;
  }

  // Return default addresses if network not specifically handled
  return defaultAddresses;
}

// Helper function to check if current network is PolkaVM
export function isPolkaVMNetwork(chainId: number): boolean {
  return chainId === 420420420;
}