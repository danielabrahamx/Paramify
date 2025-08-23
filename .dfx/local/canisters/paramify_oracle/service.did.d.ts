import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface HeaderField { 'value' : string, 'name' : string }
export interface HttpResponse {
  'status' : bigint,
  'body' : Uint8Array | number[],
  'headers' : Array<HeaderField>,
}
export type Result = { 'ok' : null } |
  { 'err' : string };
export interface TransformArgs {
  'context' : Uint8Array | number[],
  'response' : HttpResponse,
}
export interface _SERVICE {
  'getLastError' : ActorMethod<[], string>,
  'getLatestFloodData' : ActorMethod<[], bigint>,
  'manualUpdate' : ActorMethod<[], Result>,
  'setCoreCanister' : ActorMethod<[Principal], undefined>,
  'transform' : ActorMethod<[TransformArgs], HttpResponse>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
