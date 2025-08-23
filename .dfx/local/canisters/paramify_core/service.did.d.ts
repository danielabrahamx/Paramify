import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Policy {
  'startTime' : Time,
  'policyHolder' : Principal,
  'endTime' : Time,
  'isActive' : boolean,
  'coverageAmount' : bigint,
  'premiumAmount' : bigint,
  'hasClaimed' : boolean,
}
export type Result = { 'ok' : null } |
  { 'err' : string };
export type Result_1 = { 'ok' : bigint } |
  { 'err' : string };
export type Result_2 = { 'ok' : Principal } |
  { 'err' : string };
export type Time = bigint;
export interface _SERVICE {
  'addAdmin' : ActorMethod<[Principal], Result>,
  'buyInsurance' : ActorMethod<[bigint, bigint], Result_2>,
  'claimPayout' : ActorMethod<[Principal], Result_1>,
  'getCurrentFloodLevel' : ActorMethod<[], bigint>,
  'getFloodThreshold' : ActorMethod<[], bigint>,
  'getPolicy' : ActorMethod<[Principal], [] | [Policy]>,
  'removeAdmin' : ActorMethod<[Principal], Result>,
  'setFloodThreshold' : ActorMethod<[bigint], Result>,
  'setOracleUpdater' : ActorMethod<[Principal], Result>,
  'updateFloodLevel' : ActorMethod<[bigint], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
