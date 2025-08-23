import Time "mo:base/Time";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Cycles "mo:base/ExperimentalCycles";
import Error "mo:base/Error";
import Blob "mo:base/Blob";
import Principal "mo:base/Principal";
import Buffer "mo:base/Buffer";
import Char "mo:base/Char";
import Iter "mo:base/Iter";
import Nat64 "mo:base/Nat64";

// Move types inside actor

actor {
  // HTTP types
  type HeaderField = {name : Text; value : Text};
  type HttpMethod = {#get; #head; #post};
  type HttpRequest = {
    url : Text;
    max_response_bytes : ?Nat64;
    headers : [HeaderField];
    body : ?Blob;
    method : HttpMethod;
    transform : ?TransformContext;
  };
  type HttpResponse = {
    body : Blob;
    headers : [HeaderField];
    status : Nat;
  };
  type TransformArgs = {
    response : HttpResponse;
    context : Blob;
  };
  type TransformContext = {
    function : shared query TransformArgs -> async HttpResponse;
    context : Blob;
  };
  type IC = actor {
    http_request : shared HttpRequest -> async HttpResponse;
  };

  private func findCharIndex(t: Text, ch: Char) : ?Nat {
    var i = 0;
    for (c in Text.toIter(t)) {
      if (c == ch) {
        return ?i;
      };
      i += 1;
    };
    null
  };

  private func subText(text: Text, start: Nat, len: Nat) : Text {
    let chars = Text.toIter(text);
    let buf = Buffer.Buffer<Char>(len);
    var i = 0;
    label l for (c in chars) {
      if (i < start) {
        i += 1;
        continue l;
      };
      if (i >= start + len) {
        break l;
      };
      buf.add(c);
      i += 1;
    };
    Text.fromIter(buf.vals())
  };

  var lastFloodLevel: Nat = 0;
  var lastUpdate: Time.Time = 0;
  var lastError: Text = "";
  var coreCanisterId: ?Principal = null;

  public shared func setCoreCanister(id: Principal) : async () {
    coreCanisterId := ?id;
  };

  public query func getLatestFloodData() : async Nat {
    lastFloodLevel
  };

  public query func getLastError() : async Text {
    lastError
  };

  public shared func manualUpdate() : async Result.Result<(), Text> {
    try {
      let ic : IC = actor("aaaaa-aa");
      let host = "waterservices.usgs.gov";
      let site = "07032000"; // Example site ID for Mississippi River at Memphis
      let url = "https://" # host # "/nwis/iv/?format=json&sites=" # site # "&parameterCd=00065&siteStatus=all";

      let request_headers = [
        { name = "Host"; value = host },
        { name = "User-Agent"; value = "paramify_oracle" },
        { name = "Accept"; value = "application/json" }
      ];

      let transform_context : TransformContext = {
        function = transform;
        context = Blob.fromArray([]);
      };

      let http_request : HttpRequest = {
        url = url;
        max_response_bytes = ?(2_000_000);
        headers = request_headers;
        body = null;
        method = #get;
        transform = ?transform_context
      };

      Cycles.add<system>(2_300_000_000);

      let http_response : HttpResponse = await ic.http_request(http_request);

      let response_body: Blob = http_response.body;
      let decoded_text = switch (Text.decodeUtf8(response_body)) {
        case (null) { "Decoding error" };
        case (?dt) { dt };
      };

      // Simple parsing: extract the first "value" from timeSeries.values.value
      // This is a basic string search; for production, use a proper JSON parser
      let value_prefix = "\"value\":\"";
      let value_suffix = "\"";
      var level_str = "";
      let parts = Iter.toArray(Text.split(decoded_text, #text(value_prefix)));
      if (parts.size() > 1) {
        let after_prefix = parts[1];
        let value_parts = Iter.toArray(Text.split(after_prefix, #text(value_suffix)));
        if (value_parts.size() > 0) {
          level_str := value_parts[0];
        };
      };

      if (Text.equal(level_str, "")) {
        throw Error.reject("Could not parse gauge height");
      };

      // Assuming value is like "3.50", convert to Nat as 350 (times 100)
      // Adjust scaling as needed
      let dot_index = switch (findCharIndex(level_str, '.')) {
        case (null) { return #err("Invalid number format") };
        case (?idx) { idx };
      };
      let integer_part = subText(level_str, 0, dot_index);
      let decimal_part = subText(level_str, dot_index + 1, Text.size(level_str) - dot_index - 1);
      let integer = switch (Nat.fromText(integer_part)) {
        case (null) { return #err("Invalid integer part") };
        case (?n) { n };
      };
      let decimal = switch (Nat.fromText(decimal_part)) {
        case (null) { return #err("Invalid decimal part") };
        case (?n) { n };
      };
      let scale = if (Text.size(decimal_part) == 1) { 10 } else { 100 };
      let level = integer * scale + decimal;

      // Scale to match simulation (e.g., 3.5 -> 350000000000)
      // Assuming simulation uses some large unit; adjust accordingly
      lastFloodLevel := level * 100_000_000_000; // Example scaling

      lastUpdate := Time.now();
      lastError := "";

      switch (coreCanisterId) {
        case (?cid) {
          type Core = actor {
            updateFloodLevel : shared (Nat) -> async Result.Result<(), Text>;
          };
          let core : Core = actor(Principal.toText(cid));
          ignore await core.updateFloodLevel(lastFloodLevel);
        };
        case null {};
      };

      #ok(())
    } catch (e) {
      lastError := Error.message(e);
      #err(lastError)
    }
  };

  public query func transform(raw: TransformArgs) : async HttpResponse {
    let transformed : HttpResponse = {
      status = raw.response.status;
      body = raw.response.body;
      headers = [
        { name = "Content-Security-Policy"; value = "default-src 'self'" },
        { name = "Referrer-Policy"; value = "strict-origin" },
        { name = "Permissions-Policy"; value = "" },
        { name = "Strict-Transport-Security"; value = "max-age=63072000" },
        { name = "X-Frame-Options"; value = "DENY" },
        { name = "X-Content-Type-Options"; value = "nosniff" }
      ];
    };
    transformed
  };
}
