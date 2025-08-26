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

  private func isNumericChar(c: Char) : Bool {
    c == '0' or c == '1' or c == '2' or c == '3' or c == '4' or
    c == '5' or c == '6' or c == '7' or c == '8' or c == '9' or
    c == '.'
  };

  private func looksLikeNumber(t: Text) : Bool {
    if (Text.size(t) == 0) { return false };
    var hasDigit = false;
    for (c in Text.toIter(t)) {
      if (isNumericChar(c)) {
        if (c != '.') { hasDigit := true };
      } else {
        return false;
      };
    };
    hasDigit
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

      // Parse the JSON response to extract the flood level
      // Look for the first "value":" followed by a number in the timeSeries data
      let value_pattern = "\"value\":[\"{\"\"value\":\"";
      let value_parts = Iter.toArray(Text.split(decoded_text, #text("\"value\":")));

      var level_str = "";
      if (value_parts.size() > 1) {
        // Find the first numeric value after "value":
        for (part in value_parts.vals()) {
          if (Text.size(part) > 0) {
            // Look for pattern: "number" followed by optional qualifiers
            let number_end = switch (findCharIndex(part, '"')) {
              case (null) { Text.size(part) };
              case (?idx) { idx };
            };
            if (number_end > 0) {
              let potential_number = subText(part, 1, number_end - 1); // Skip the opening quote
              // Check if it looks like a number (contains digits and optional decimal point)
              if (looksLikeNumber(potential_number)) {
                level_str := potential_number;
              };
            };
          };
        };
      };

      if (Text.equal(level_str, "")) {
        // Fallback: try a simpler approach
        let simple_pattern = "\"value\":\"";
        let simple_parts = Iter.toArray(Text.split(decoded_text, #text(simple_pattern)));
        if (simple_parts.size() > 1) {
          let after_pattern = simple_parts[1];
          let end_quote = switch (findCharIndex(after_pattern, '"')) {
            case (null) { Text.size(after_pattern) };
            case (?idx) { idx };
          };
          if (end_quote > 0) {
            level_str := subText(after_pattern, 0, end_quote);
          };
        };
      };

      if (Text.equal(level_str, "")) {
        throw Error.reject("Could not parse gauge height from USGS response");
      };

      // Convert the flood level string to a number
      // Handle decimal numbers like "1.43"
      let dot_index = switch (findCharIndex(level_str, '.')) {
        case (null) {
          // No decimal point, treat as integer
          let level = switch (Nat.fromText(level_str)) {
            case (null) { return #err("Invalid flood level format: " # level_str) };
            case (?n) { n };
          };
          lastFloodLevel := level * 100_000_000_000; // Convert feet to contract units
        };
        case (?idx) {
          // Has decimal point, parse integer and decimal parts
          let integer_part = subText(level_str, 0, idx);
          let decimal_part = subText(level_str, idx + 1, Text.size(level_str) - idx - 1);

          let integer = switch (Nat.fromText(integer_part)) {
            case (null) { return #err("Invalid integer part: " # integer_part) };
            case (?n) { n };
          };

          let decimal = switch (Nat.fromText(decimal_part)) {
            case (null) { 0 }; // Default to 0 if decimal parsing fails
            case (?n) { n };
          };

          // Convert to contract units (multiply by 100_000_000_000 for precision)
          let level = integer * 100_000_000_000 + decimal * 10_000_000_000;
          lastFloodLevel := level;
        };
      };

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
