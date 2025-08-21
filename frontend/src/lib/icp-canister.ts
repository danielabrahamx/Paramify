import { Actor, HttpAgent } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';

// Canister IDs (these will be updated after deployment)
const PARAMIFY_CORE_CANISTER_ID = process.env.VITE_PARAMIFY_CORE_CANISTER_ID || 'be2us-64aaa-aaaaa-qaabq-cai';
const PARAMIFY_ORACLE_CANISTER_ID = process.env.VITE_PARAMIFY_ORACLE_CANISTER_ID || 'be2us-64aaa-aaaaa-qaabq-cai';

// IDL definitions for the canisters
const paramifyCoreIdl = ({ IDL }: any) => {
  return IDL.Service({
    'getCurrentThreshold': IDL.Func([], [IDL.Nat64], ['query']),
    'getThresholdInFeet': IDL.Func([], [IDL.Float64], ['query']),
    'setThreshold': IDL.Func([IDL.Nat64], [IDL.Result(IDL.Null, IDL.Text)], []),
    'buyInsurance': IDL.Func([IDL.Nat64], [IDL.Result(IDL.Null, IDL.Text)], []),
    'getPolicy': IDL.Func([IDL.Principal], [IDL.Opt(IDL.Record({
      'customer': IDL.Principal,
      'premium': IDL.Nat64,
      'coverage': IDL.Nat64,
      'active': IDL.Bool,
      'paidOut': IDL.Bool,
      'purchaseTime': IDL.Int,
    }))], ['query']),
    'isPayoutEligible': IDL.Func([IDL.Principal], [IDL.Bool], ['query']),
    'triggerPayout': IDL.Func([], [IDL.Result(IDL.Null, IDL.Text)], []),
    'getContractBalance': IDL.Func([], [IDL.Nat], ['query']),
    'initialize': IDL.Func([], [IDL.Result(IDL.Null, IDL.Text)], []),
  });
};

const paramifyOracleIdl = ({ IDL }: any) => {
  return IDL.Service({
    'getLatestFloodData': IDL.Func([], [IDL.Opt(IDL.Record({
      'value': IDL.Float64,
      'timestamp': IDL.Int,
      'source': IDL.Text,
      'siteId': IDL.Text,
      'siteName': IDL.Text,
      'lastUpdate': IDL.Int,
    }))], ['query']),
    'getStatus': IDL.Func([], [IDL.Record({
      'isActive': IDL.Bool,
      'lastUpdate': IDL.Opt(IDL.Int),
      'currentFloodLevel': IDL.Opt(IDL.Float64),
      'updateInterval': IDL.Nat64,
      'nextUpdate': IDL.Opt(IDL.Int),
      'coreCanisterId': IDL.Opt(IDL.Principal),
    })], ['query']),
    'initialize': IDL.Func([IDL.Principal], [IDL.Result(IDL.Null, IDL.Text)], []),
    'startUpdates': IDL.Func([], [IDL.Result(IDL.Null, IDL.Text)], []),
    'manualUpdate': IDL.Func([], [IDL.Result(IDL.Null, IDL.Text)], []),
  });
};

class ICPService {
  private authClient: AuthClient | null = null;
  private agent: HttpAgent | null = null;
  private paramifyCore: any = null;
  private paramifyOracle: any = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize AuthClient
      this.authClient = await AuthClient.create();

      // Check if user is already authenticated
      if (await this.authClient.isAuthenticated()) {
        this.agent = new HttpAgent({
          identity: this.authClient.getIdentity(),
          host: process.env.VITE_ICP_HOST || 'http://127.0.0.1:4943'
        });

        await this.agent.fetchRootKey(); // For local development only
        await this.initializeCanisters();
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize ICP service:', error);
      throw error;
    }
  }

  async login(): Promise<boolean> {
    if (!this.authClient) await this.initialize();

    try {
      await this.authClient!.login({
        identityProvider: process.env.VITE_INTERNET_IDENTITY_URL || 'https://identity.ic0.app',
        onSuccess: async () => {
          this.agent = new HttpAgent({
            identity: this.authClient!.getIdentity(),
            host: process.env.VITE_ICP_HOST || 'http://127.0.0.1:4943'
          });

          await this.agent!.fetchRootKey(); // For local development only
          await this.initializeCanisters();
        },
      });
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }

  async logout() {
    if (this.authClient) {
      await this.authClient.logout();
      this.agent = null;
      this.paramifyCore = null;
      this.paramifyOracle = null;
      this.isInitialized = false;
    }
  }

  isAuthenticated(): boolean {
    return this.authClient ? this.authClient.isAuthenticated() : false;
  }

  getPrincipal(): Principal | null {
    if (!this.authClient || !this.isAuthenticated()) return null;
    return this.authClient.getIdentity().getPrincipal();
  }

  private async initializeCanisters() {
    if (!this.agent) throw new Error('Agent not initialized');

    try {
      // Initialize Paramify Core canister
      this.paramifyCore = Actor.createActor(paramifyCoreIdl, {
        agent: this.agent,
        canisterId: PARAMIFY_CORE_CANISTER_ID,
      });

      // Initialize Paramify Oracle canister
      this.paramifyOracle = Actor.createActor(paramifyOracleIdl, {
        agent: this.agent,
        canisterId: PARAMIFY_ORACLE_CANISTER_ID,
      });

      console.log('✅ Canisters initialized successfully');
    } catch (error) {
      console.error('Failed to initialize canisters:', error);
      throw error;
    }
  }

  // Paramify Core methods
  async getCurrentThreshold(): Promise<bigint> {
    if (!this.paramifyCore) throw new Error('Core canister not initialized');
    return await this.paramifyCore.getCurrentThreshold();
  }

  async getThresholdInFeet(): Promise<number> {
    if (!this.paramifyCore) throw new Error('Core canister not initialized');
    return Number(await this.paramifyCore.getThresholdInFeet());
  }

  async setThreshold(threshold: bigint): Promise<Result<void, string>> {
    if (!this.paramifyCore) throw new Error('Core canister not initialized');
    return await this.paramifyCore.setThreshold(threshold);
  }

  async buyInsurance(coverage: bigint): Promise<Result<void, string>> {
    if (!this.paramifyCore) throw new Error('Core canister not initialized');
    return await this.paramifyCore.buyInsurance(coverage);
  }

  async getPolicy(customer: Principal): Promise<Policy | null> {
    if (!this.paramifyCore) throw new Error('Core canister not initialized');
    return await this.paramifyCore.getPolicy(customer);
  }

  async isPayoutEligible(customer: Principal): Promise<boolean> {
    if (!this.paramifyCore) throw new Error('Core canister not initialized');
    return await this.paramifyCore.isPayoutEligible(customer);
  }

  async triggerPayout(): Promise<Result<void, string>> {
    if (!this.paramifyCore) throw new Error('Core canister not initialized');
    return await this.paramifyCore.triggerPayout();
  }

  async getContractBalance(): Promise<bigint> {
    if (!this.paramifyCore) throw new Error('Core canister not initialized');
    return await this.paramifyCore.getContractBalance();
  }

  // Paramify Oracle methods
  async getLatestFloodData(): Promise<FloodData | null> {
    if (!this.paramifyOracle) throw new Error('Oracle canister not initialized');
    return await this.paramifyOracle.getLatestFloodData();
  }

  async getOracleStatus(): Promise<OracleStatus> {
    if (!this.paramifyOracle) throw new Error('Oracle canister not initialized');
    return await this.paramifyOracle.getStatus();
  }

  async manualUpdate(): Promise<Result<void, string>> {
    if (!this.paramifyOracle) throw new Error('Oracle canister not initialized');
    return await this.paramifyOracle.manualUpdate();
  }
}

// Types
export interface Policy {
  customer: Principal;
  premium: bigint;
  coverage: bigint;
  active: boolean;
  paidOut: boolean;
  purchaseTime: bigint;
}

export interface FloodData {
  value: number;
  timestamp: bigint;
  source: string;
  siteId: string;
  siteName: string;
  lastUpdate: bigint;
}

export interface OracleStatus {
  isActive: boolean;
  lastUpdate: bigint | null;
  currentFloodLevel: number | null;
  updateInterval: bigint;
  nextUpdate: bigint | null;
  coreCanisterId: Principal | null;
}

export type Result<T, E> = { ok: T } | { err: E };

// Export singleton instance
export const icpService = new ICPService();
export default icpService;