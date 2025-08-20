export const idlFactory = ({ IDL }) => {
  const Error = IDL.Variant({
    'PolicyAlreadyActive' : IDL.Null,
    'NoFundsToWithdraw' : IDL.Null,
    'InvalidAmount' : IDL.Null,
    'InvalidPrincipal' : IDL.Null,
    'FloodLevelBelowThreshold' : IDL.Null,
    'InsufficientPremium' : IDL.Null,
    'NotAuthorized' : IDL.Null,
    'InvalidThreshold' : IDL.Null,
    'ParseError' : IDL.Null,
    'HttpRequestFailed' : IDL.Null,
    'PayoutFailed' : IDL.Null,
    'PolicyAlreadyPaidOut' : IDL.Null,
    'NoPolicyFound' : IDL.Null,
  });
  const Result = IDL.Variant({ 'ok' : IDL.Text, 'err' : Error });
  const Policy = IDL.Record({
    'active' : IDL.Bool,
    'customer' : IDL.Principal,
    'premium' : IDL.Nat,
    'timestamp' : IDL.Int,
    'paidOut' : IDL.Bool,
    'coverage' : IDL.Nat,
  });
  return IDL.Service({
    'activatePolicy' : IDL.Func([], [Result], []),
    'addAdmin' : IDL.Func([IDL.Principal], [Result], []),
    'buyInsurance' : IDL.Func([IDL.Nat], [Result], []),
    'canisterBalance' : IDL.Func([], [IDL.Nat], []),
    'canisterStatus' : IDL.Func(
        [],
        [
          IDL.Record({
            'balance' : IDL.Nat,
            'cycles' : IDL.Nat,
            'memorySize' : IDL.Nat,
            'policies' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'checkForPayouts' : IDL.Func([], [Result], []),
    'deactivatePolicy' : IDL.Func([], [Result], []),
    'depositCycles' : IDL.Func([], [IDL.Nat], []),
    'fundContract' : IDL.Func([IDL.Nat], [Result], []),
    'getContractBalance' : IDL.Func([], [IDL.Nat], ['query']),
    'getCurrentFloodLevel' : IDL.Func([], [IDL.Nat], ['query']),
    'getFloodLevelInFeet' : IDL.Func([], [IDL.Nat], ['query']),
    'getLastOracleUpdate' : IDL.Func([], [IDL.Int], ['query']),
    'getMyPolicy' : IDL.Func([], [IDL.Opt(Policy)], ['query']),
    'getMyUsername' : IDL.Func([], [IDL.Opt(IDL.Text)], ['query']),
    'hello' : IDL.Func([], [IDL.Text], ['query']),
    'init' : IDL.Func([], [Result], []),
    'listAdmins' : IDL.Func([], [IDL.Vec(IDL.Principal)], ['query']),
    'listUsers' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Text))],
        ['query'],
      ),
    'payPremium' : IDL.Func([], [Result], []),
    'register' : IDL.Func([IDL.Text], [Result], []),
    'removeAdmin' : IDL.Func([IDL.Principal], [Result], []),
    'runAutoPayouts' : IDL.Func([], [Result], []),
    'triggerPayout' : IDL.Func([], [Result], []),
    'updateFloodData' : IDL.Func([], [Result], []),
    'withdraw' : IDL.Func([IDL.Nat], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
