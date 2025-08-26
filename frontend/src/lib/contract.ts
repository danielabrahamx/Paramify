// This file contains the deployed contract addresses and ABIs for the frontend to use
// Note: Frontend should primarily use ICP canisters, not direct contract calls
// These addresses are for reference only

export const PARAMIFY_ADDRESS = "0x8ac041884E37281b6649326bBD9Fb210A5849a91";
export const MOCK_ORACLE_ADDRESS = "0x8D6Bfc2169154911F83aFc6B5A4Ff7f86Ed205a6";

import PARAMIFY_ABI_JSON from "../../../paramify-abi.json";
import MOCK_ORACLE_ABI_JSON from "../../../mock-aggregator-abi.json";
export const PARAMIFY_ABI = PARAMIFY_ABI_JSON.abi as any;
export const MOCK_ORACLE_ABI = MOCK_ORACLE_ABI_JSON as any;

// ICP Canister Integration
export const CORE_CANISTER_ID = import.meta.env.VITE_PARAMIFY_CORE_CANISTER_ID;
export const ORACLE_CANISTER_ID = import.meta.env.VITE_PARAMIFY_ORACLE_CANISTER_ID;
export const ICP_HOST = import.meta.env.VITE_ICP_HOST || 'http://127.0.0.1:4943';
