import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type Error = { 'PolicyAlreadyActive' : null } |
  { 'NoFundsToWithdraw' : null } |
  { 'InvalidAmount' : null } |
  { 'InvalidPrincipal' : null } |
  { 'FloodLevelBelowThreshold' : null } |
  { 'InsufficientPremium' : null } |
  { 'NotAuthorized' : null } |
  { 'InvalidThreshold' : null } |
  { 'ParseError' : null } |
  { 'HttpRequestFailed' : null } |
  { 'PayoutFailed' : null } |
  { 'PolicyAlreadyPaidOut' : null } |
  { 'NoPolicyFound' : null };
export interface Policy {
  'active' : boolean,
  'customer' : Principal,
  'premium' : bigint,
  'timestamp' : bigint,
  'paidOut' : boolean,
  'coverage' : bigint,
}
export type Result = { 'ok' : string } |
  { 'err' : Error };
export interface _SERVICE {
  'activatePolicy' : ActorMethod<[], Result>,
  'addAdmin' : ActorMethod<[Principal], Result>,
  'buyInsurance' : ActorMethod<[bigint], Result>,
  'canisterBalance' : ActorMethod<[], bigint>,
  'canisterStatus' : ActorMethod<
    [],
    {
      'balance' : bigint,
      'cycles' : bigint,
      'memorySize' : bigint,
      'policies' : bigint,
    }
  >,
  'checkForPayouts' : ActorMethod<[], Result>,
  'deactivatePolicy' : ActorMethod<[], Result>,
  'depositCycles' : ActorMethod<[], bigint>,
  'fundContract' : ActorMethod<[bigint], Result>,
  'getContractBalance' : ActorMethod<[], bigint>,
  'getCurrentFloodLevel' : ActorMethod<[], bigint>,
  'getFloodLevelInFeet' : ActorMethod<[], bigint>,
  'getLastOracleUpdate' : ActorMethod<[], bigint>,
  'getMyPolicy' : ActorMethod<[], [] | [Policy]>,
  'getMyUsername' : ActorMethod<[], [] | [string]>,
  'hello' : ActorMethod<[], string>,
  'init' : ActorMethod<[], Result>,
  'listAdmins' : ActorMethod<[], Array<Principal>>,
  'listUsers' : ActorMethod<[], Array<[Principal, string]>>,
  'payPremium' : ActorMethod<[], Result>,
  'register' : ActorMethod<[string], Result>,
  'removeAdmin' : ActorMethod<[Principal], Result>,
  'runAutoPayouts' : ActorMethod<[], Result>,
  'triggerPayout' : ActorMethod<[], Result>,
  'updateFloodData' : ActorMethod<[], Result>,
  'withdraw' : ActorMethod<[bigint], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
