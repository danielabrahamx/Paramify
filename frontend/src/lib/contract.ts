// ICP Canister Configuration
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { idlFactory } from '../declarations/paramify_insurance';
import { _SERVICE } from '../declarations/paramify_insurance/paramify_insurance.did';

// Canister configuration
export const CANISTER_ID = 'uxrrr-q7777-77774-qaaaq-cai';
export const ICP_HOST = 'http://127.0.0.1:4943';
export const BACKEND_API_URL = 'http://localhost:3001';

// Create ICP agent
export async function createActor(): Promise<Actor<_SERVICE>> {
  const agent = new HttpAgent({ 
    host: ICP_HOST,
    verifyQuerySignatures: false // For local development
  });
  
  // For local development, we need to fetch the root key
  if (ICP_HOST.includes('127.0.0.1') || ICP_HOST.includes('localhost')) {
    await agent.fetchRootKey();
  }
  
  return Actor.createActor(idlFactory, {
    agent,
    canisterId: CANISTER_ID,
  });
}

// Backend API client
export class BackendAPI {
  private baseURL: string;
  
  constructor(baseURL: string = BACKEND_API_URL) {
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
