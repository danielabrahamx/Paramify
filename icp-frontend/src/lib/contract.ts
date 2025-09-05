import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { ICP_CONFIG } from './config';

// Define the canister interface based on the .did file
export interface Policy {
  policy_id: bigint;
  policyholder: Principal;
  premium: bigint;
  coverage: bigint;
  purchase_time: bigint;
  active: boolean;
  paid_out: boolean;
}

export interface PolicyStats {
  total: bigint;
  active: bigint;
  paid_out: bigint;
}

// Create ICP agent
export async function createActor(): Promise<any> {
  const agent = new HttpAgent({ 
    host: ICP_CONFIG.ICP_HOST,
    verifyQuerySignatures: false // For local development
  });
  
  // For local development, we need to fetch the root key
  if (ICP_CONFIG.ICP_HOST.includes('127.0.0.1') || ICP_CONFIG.ICP_HOST.includes('localhost')) {
    await agent.fetchRootKey();
  }
  
  // Note: In a real implementation, you would use the actual IDL factory
  // For now, we'll create a mock actor that calls the backend API
  return {
    get_flood_level: async () => {
      const response = await fetch(`${ICP_CONFIG.BACKEND_API_URL}/api/flood-data`);
      const data = await response.json();
      return data.value || 0;
    },
    get_flood_threshold: async () => {
      const response = await fetch(`${ICP_CONFIG.BACKEND_API_URL}/api/flood-data`);
      const data = await response.json();
      return data.threshold || ICP_CONFIG.DEFAULT_THRESHOLD_FEET;
    },
    get_policy_stats: async (): Promise<[bigint, bigint, bigint]> => {
      // Mock implementation - in real app, this would call the canister
      return [BigInt(0), BigInt(0), BigInt(0)];
    },
    create_policy: async (coverage: bigint, premium: bigint) => {
      // Mock implementation - in real app, this would call the canister
      console.log('Creating policy:', { coverage, premium });
      return { Ok: BigInt(1) };
    },
    get_policy: async (policyId: bigint) => {
      // Mock implementation
      return null;
    },
    get_policy_by_holder: async (holder: Principal) => {
      // Mock implementation
      return null;
    },
    is_payout_eligible: async (holder: Principal) => {
      // Mock implementation
      return false;
    },
    trigger_payout: async () => {
      // Mock implementation
      return { Ok: BigInt(0) };
    }
  };
}

// Backend API client
export class BackendAPI {
  private baseURL: string;
  
  constructor(baseURL: string = ICP_CONFIG.BACKEND_API_URL) {
    this.baseURL = baseURL;
  }
  
  async getHealth() {
    const response = await fetch(`${this.baseURL}/api/health`);
    return response.json();
  }
  
  async getFloodData() {
    const response = await fetch(`${this.baseURL}/api/flood-data`);
    return response.json();
  }
  
  async testUSGS() {
    const response = await fetch(`${this.baseURL}/api/test-usgs`);
    return response.json();
  }
}

export const backendAPI = new BackendAPI();
