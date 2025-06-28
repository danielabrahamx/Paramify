// This file contains the deployed contract addresses and ABIs for the frontend to use
export const PARAMIFY_ADDRESS = "0x68B1D87F95878fE05B998F19b66F4baba5De1aed";
export const MOCK_ORACLE_ADDRESS = "0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE";
import PARAMIFY_ABI_JSON from "../../../paramify-abi.json";
import MOCK_ORACLE_ABI_JSON from "../../../mock-aggregator-abi.json";
export const PARAMIFY_ABI = PARAMIFY_ABI_JSON.abi as any;
export const MOCK_ORACLE_ABI = MOCK_ORACLE_ABI_JSON as any;
