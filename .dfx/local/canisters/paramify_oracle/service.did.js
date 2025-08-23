export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const HeaderField = IDL.Record({ 'value' : IDL.Text, 'name' : IDL.Text });
  const HttpResponse = IDL.Record({
    'status' : IDL.Nat,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(HeaderField),
  });
  const TransformArgs = IDL.Record({
    'context' : IDL.Vec(IDL.Nat8),
    'response' : HttpResponse,
  });
  return IDL.Service({
    'getLastError' : IDL.Func([], [IDL.Text], ['query']),
    'getLatestFloodData' : IDL.Func([], [IDL.Nat], ['query']),
    'manualUpdate' : IDL.Func([], [Result], []),
    'setCoreCanister' : IDL.Func([IDL.Principal], [], []),
    'transform' : IDL.Func([TransformArgs], [HttpResponse], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
