export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const Result_2 = IDL.Variant({ 'ok' : IDL.Principal, 'err' : IDL.Text });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  const Time = IDL.Int;
  const Policy = IDL.Record({
    'startTime' : Time,
    'policyHolder' : IDL.Principal,
    'endTime' : Time,
    'isActive' : IDL.Bool,
    'coverageAmount' : IDL.Nat,
    'premiumAmount' : IDL.Nat,
    'hasClaimed' : IDL.Bool,
  });
  return IDL.Service({
    'addAdmin' : IDL.Func([IDL.Principal], [Result], []),
    'buyInsurance' : IDL.Func([IDL.Nat, IDL.Nat], [Result_2], []),
    'claimPayout' : IDL.Func([IDL.Principal], [Result_1], []),
    'getCurrentFloodLevel' : IDL.Func([], [IDL.Nat], ['query']),
    'getFloodThreshold' : IDL.Func([], [IDL.Nat], ['query']),
    'getPolicy' : IDL.Func([IDL.Principal], [IDL.Opt(Policy)], ['query']),
    'removeAdmin' : IDL.Func([IDL.Principal], [Result], []),
    'setFloodThreshold' : IDL.Func([IDL.Nat], [Result], []),
    'setOracleUpdater' : IDL.Func([IDL.Principal], [Result], []),
    'updateFloodLevel' : IDL.Func([IDL.Nat], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
