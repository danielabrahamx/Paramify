import { Principal } from '@dfinity/principal';

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

export interface OracleStatus {
  isRunning: boolean;
  lastUpdate: bigint;
  lastFloodLevel: number;
  updateInterval: bigint;
  backendConfigured: boolean;
}

export interface FloodData {
  value: number | null;
  timestamp: string | null;
  lastUpdate: string | null;
  status: 'initializing' | 'active' | 'partial' | 'error';
  error: string | null;
  source: string;
  siteInfo: {
    name: string;
    siteId: string;
  };
  threshold?: {
    thresholdUnits: string;
    thresholdFeet: number;
  };
}

export interface UserData {
  principal: Principal | null;
  isAuthenticated: boolean;
  policy: Policy | null;
  balance: bigint;
}

export type Result<T, E> = { ok: T } | { err: E };

export enum ErrorType {
  NotAuthorized = 'NotAuthorized',
  PolicyAlreadyActive = 'PolicyAlreadyActive',
  NoPolicyFound = 'NoPolicyFound',
  PolicyAlreadyPaidOut = 'PolicyAlreadyPaidOut',
  InsufficientPremium = 'InsufficientPremium',
  InvalidAmount = 'InvalidAmount',
  FloodLevelBelowThreshold = 'FloodLevelBelowThreshold',
  PayoutFailed = 'PayoutFailed',
  NoFundsToWithdraw = 'NoFundsToWithdraw',
  InvalidThreshold = 'InvalidThreshold',
  InvalidPrincipal = 'InvalidPrincipal',
}
