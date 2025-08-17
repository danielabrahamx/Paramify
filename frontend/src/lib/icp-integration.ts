import { AuthClient } from '@dfinity/auth-client';
import { Actor, HttpAgent, Identity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';

// Canister IDs (will be populated after deployment)
const PARAMIFY_BACKEND_CANISTER_ID = process.env.VITE_PARAMIFY_BACKEND_CANISTER_ID || '';
const ORACLE_SERVICE_CANISTER_ID = process.env.VITE_ORACLE_SERVICE_CANISTER_ID || '';

// Local or mainnet URL
const HOST = process.env.VITE_DFX_NETWORK === 'ic' 
  ? 'https://ic0.app' 
  : 'http://127.0.0.1:4943';

// Internet Identity URL
const IDENTITY_PROVIDER = process.env.VITE_DFX_NETWORK === 'ic'
  ? 'https://identity.ic0.app'
  : `http://127.0.0.1:4943?canisterId=${process.env.VITE_INTERNET_IDENTITY_CANISTER_ID}`;

// Paramify Backend Interface (IDL)
const paramifyBackendIDL = ({ IDL }: any) => {
  const Error = IDL.Variant({
    'NotAuthorized': IDL.Null,
    'PolicyAlreadyActive': IDL.Null,
    'NoPolicyFound': IDL.Null,
    'PolicyAlreadyPaidOut': IDL.Null,
    'InsufficientPremium': IDL.Null,
    'InvalidAmount': IDL.Null,
    'FloodLevelBelowThreshold': IDL.Null,
    'PayoutFailed': IDL.Null,
    'NoFundsToWithdraw': IDL.Null,
    'InvalidThreshold': IDL.Null,
    'InvalidPrincipal': IDL.Null,
  });

  const Policy = IDL.Record({
    'customer': IDL.Principal,
    'premium': IDL.Nat,
    'coverage': IDL.Nat,
    'active': IDL.Bool,
    'paidOut': IDL.Bool,
    'timestamp': IDL.Int,
  });

  const Result = IDL.Variant({
    'ok': IDL.Text,
    'err': Error,
  });

  const Stats = IDL.Record({
    'totalPolicies': IDL.Nat,
    'activePolicies': IDL.Nat,
    'totalPayouts': IDL.Nat,
    'contractBalance': IDL.Nat,
    'currentFloodLevel': IDL.Nat,
    'floodThreshold': IDL.Nat,
    'lastOracleUpdate': IDL.Int,
  });

  return IDL.Service({
    'init': IDL.Func([], [Result], []),
    'buyInsurance': IDL.Func([IDL.Nat], [Result], []),
    'triggerPayout': IDL.Func([], [Result], []),
    'isPayoutEligible': IDL.Func([IDL.Principal], [IDL.Bool], ['query']),
    'getMyPolicy': IDL.Func([], [IDL.Opt(Policy)], ['query']),
    'getPolicy': IDL.Func([IDL.Principal], [IDL.Opt(Policy)], ['query']),
    'getThreshold': IDL.Func([], [IDL.Nat], ['query']),
    'getThresholdInFeet': IDL.Func([], [IDL.Nat], ['query']),
    'getCurrentFloodLevel': IDL.Func([], [IDL.Nat], ['query']),
    'getFloodLevelInFeet': IDL.Func([], [IDL.Nat], ['query']),
    'setThreshold': IDL.Func([IDL.Nat], [Result], []),
    'getStats': IDL.Func([], [Stats], ['query']),
    'getContractBalance': IDL.Func([], [IDL.Nat], ['query']),
    'fundContract': IDL.Func([IDL.Nat], [Result], []),
    'withdraw': IDL.Func([IDL.Nat], [Result], []),
    'transferOwnership': IDL.Func([IDL.Principal], [Result], []),
  });
};

// Oracle Service Interface (IDL)
const oracleServiceIDL = ({ IDL }: any) => {
  const Error = IDL.Variant({
    'NotAuthorized': IDL.Null,
    'HttpRequestFailed': IDL.Text,
    'ParseError': IDL.Text,
    'BackendUpdateFailed': IDL.Text,
    'InvalidConfiguration': IDL.Null,
  });

  const Result = IDL.Variant({
    'ok': IDL.Text,
    'err': Error,
  });

  const Status = IDL.Record({
    'isRunning': IDL.Bool,
    'lastUpdate': IDL.Int,
    'lastFloodLevel': IDL.Float64,
    'updateInterval': IDL.Nat,
    'backendConfigured': IDL.Bool,
  });

  return IDL.Service({
    'init': IDL.Func([], [Result], []),
    'setParamifyBackend': IDL.Func([IDL.Principal], [Result], []),
    'startAutoUpdate': IDL.Func([], [Result], []),
    'stopAutoUpdate': IDL.Func([], [Result], []),
    'manualUpdate': IDL.Func([], [Result], []),
    'getStatus': IDL.Func([], [Status], ['query']),
    'setUpdateInterval': IDL.Func([IDL.Nat], [Result], []),
    'transferOwnership': IDL.Func([IDL.Principal], [Result], []),
  });
};

class ICPService {
  private authClient: AuthClient | null = null;
  private identity: Identity | null = null;
  private agent: HttpAgent | null = null;
  private paramifyBackendActor: any = null;
  private oracleServiceActor: any = null;
  private isAuthenticated = false;

  async init(): Promise<void> {
    this.authClient = await AuthClient.create();
    const isAuthenticated = await this.authClient.isAuthenticated();
    
    if (isAuthenticated) {
      await this.handleAuthenticated();
    }
  }

  private async handleAuthenticated(): Promise<void> {
    if (!this.authClient) return;
    
    this.identity = this.authClient.getIdentity();
    this.agent = new HttpAgent({
      identity: this.identity,
      host: HOST,
    });

    // When developing locally, we need to disable certificate verification
    if (process.env.VITE_DFX_NETWORK !== 'ic') {
      await this.agent.fetchRootKey();
    }

    this.isAuthenticated = true;
    await this.createActors();
  }

  private async createActors(): Promise<void> {
    if (!this.agent) return;

    // Create Paramify Backend actor
    if (PARAMIFY_BACKEND_CANISTER_ID) {
      this.paramifyBackendActor = Actor.createActor(paramifyBackendIDL, {
        agent: this.agent,
        canisterId: PARAMIFY_BACKEND_CANISTER_ID,
      });
    }

    // Create Oracle Service actor
    if (ORACLE_SERVICE_CANISTER_ID) {
      this.oracleServiceActor = Actor.createActor(oracleServiceIDL, {
        agent: this.agent,
        canisterId: ORACLE_SERVICE_CANISTER_ID,
      });
    }
  }

  async login(): Promise<boolean> {
    if (!this.authClient) {
      await this.init();
    }

    return new Promise((resolve) => {
      this.authClient?.login({
        identityProvider: IDENTITY_PROVIDER,
        onSuccess: async () => {
          await this.handleAuthenticated();
          resolve(true);
        },
        onError: (error) => {
          console.error('Login failed:', error);
          resolve(false);
        },
      });
    });
  }

  async logout(): Promise<void> {
    if (this.authClient) {
      await this.authClient.logout();
      this.isAuthenticated = false;
      this.identity = null;
      this.agent = null;
      this.paramifyBackendActor = null;
      this.oracleServiceActor = null;
    }
  }

  getPrincipal(): Principal | null {
    return this.identity ? this.identity.getPrincipal() : null;
  }

  getIsAuthenticated(): boolean {
    return this.isAuthenticated;
  }

  // Paramify Backend Methods
  async buyInsurance(coverage: bigint): Promise<{ ok?: string; err?: any }> {
    if (!this.paramifyBackendActor) {
      throw new Error('Not connected to Paramify backend');
    }
    return await this.paramifyBackendActor.buyInsurance(coverage);
  }

  async triggerPayout(): Promise<{ ok?: string; err?: any }> {
    if (!this.paramifyBackendActor) {
      throw new Error('Not connected to Paramify backend');
    }
    return await this.paramifyBackendActor.triggerPayout();
  }

  async getMyPolicy(): Promise<any> {
    if (!this.paramifyBackendActor) {
      throw new Error('Not connected to Paramify backend');
    }
    const result = await this.paramifyBackendActor.getMyPolicy();
    return result.length > 0 ? result[0] : null;
  }

  async isPayoutEligible(principal?: Principal): Promise<boolean> {
    if (!this.paramifyBackendActor) {
      throw new Error('Not connected to Paramify backend');
    }
    const p = principal || this.getPrincipal();
    if (!p) return false;
    return await this.paramifyBackendActor.isPayoutEligible(p);
  }

  async getStats(): Promise<any> {
    if (!this.paramifyBackendActor) {
      throw new Error('Not connected to Paramify backend');
    }
    return await this.paramifyBackendActor.getStats();
  }

  async getCurrentFloodLevel(): Promise<bigint> {
    if (!this.paramifyBackendActor) {
      throw new Error('Not connected to Paramify backend');
    }
    return await this.paramifyBackendActor.getCurrentFloodLevel();
  }

  async getFloodLevelInFeet(): Promise<bigint> {
    if (!this.paramifyBackendActor) {
      throw new Error('Not connected to Paramify backend');
    }
    return await this.paramifyBackendActor.getFloodLevelInFeet();
  }

  async getThreshold(): Promise<bigint> {
    if (!this.paramifyBackendActor) {
      throw new Error('Not connected to Paramify backend');
    }
    return await this.paramifyBackendActor.getThreshold();
  }

  async getThresholdInFeet(): Promise<bigint> {
    if (!this.paramifyBackendActor) {
      throw new Error('Not connected to Paramify backend');
    }
    return await this.paramifyBackendActor.getThresholdInFeet();
  }

  async setThreshold(threshold: bigint): Promise<{ ok?: string; err?: any }> {
    if (!this.paramifyBackendActor) {
      throw new Error('Not connected to Paramify backend');
    }
    return await this.paramifyBackendActor.setThreshold(threshold);
  }

  async getContractBalance(): Promise<bigint> {
    if (!this.paramifyBackendActor) {
      throw new Error('Not connected to Paramify backend');
    }
    return await this.paramifyBackendActor.getContractBalance();
  }

  // Oracle Service Methods
  async getOracleStatus(): Promise<any> {
    if (!this.oracleServiceActor) {
      throw new Error('Not connected to Oracle service');
    }
    return await this.oracleServiceActor.getStatus();
  }

  async triggerManualUpdate(): Promise<{ ok?: string; err?: any }> {
    if (!this.oracleServiceActor) {
      throw new Error('Not connected to Oracle service');
    }
    return await this.oracleServiceActor.manualUpdate();
  }

  // Utility methods
  formatICP(e8s: bigint): string {
    const icp = Number(e8s) / 100_000_000;
    return icp.toFixed(8);
  }

  e8sToICP(e8s: bigint): number {
    return Number(e8s) / 100_000_000;
  }

  icpToE8s(icp: number): bigint {
    return BigInt(Math.floor(icp * 100_000_000));
  }
}

// Export singleton instance
export const icpService = new ICPService();

// Export types
export type { Policy, Stats } from './types';

// Define types
export interface Policy {
  customer: Principal;
  premium: bigint;
  coverage: bigint;
  active: boolean;
  paidOut: boolean;
  timestamp: bigint;
}

export interface Stats {
  totalPolicies: bigint;
  activePolicies: bigint;
  totalPayouts: bigint;
  contractBalance: bigint;
  currentFloodLevel: bigint;
  floodThreshold: bigint;
  lastOracleUpdate: bigint;
}
