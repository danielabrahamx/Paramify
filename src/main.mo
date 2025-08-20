import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Time "mo:base/Time";
import Error "mo:base/Error";
import Text "mo:base/Text";
// import Set "mo:base/Set"; // Not available in DFX 0.18.0
// import Http "mo:http/Http"; // Temporarily disabled for local testing
import Debug "mo:base/Debug";
import Cycles "mo:base/ExperimentalCycles";

actor Main {
  // Stable variables for canister upgrades
  stable var policiesEntries : [(Principal, Policy)] = [];
  stable var contractBalance : Nat = 0;
  stable var floodThreshold : Nat = 0;
  stable var currentFloodLevel : Nat = 0;
  stable var lastOracleUpdate : Int = 0;
  stable var owner : Principal = Principal.fromText("aaaaa-aa"); // Default to management canister
  stable var admins : [Principal] = [];
  // let adminSet = Set.fromArray<Principal>(admins, Principal.equal, Principal.hash); // Not available in DFX 0.18.0

  // Access control functions
  func isAdmin(p: Principal) : Bool {
    p == owner or Array.find<Principal>(admins, func(admin) { admin == p }) != null
  };

  public shared(msg) func addAdmin(newAdmin: Principal) : async Result {
    if (msg.caller != owner) {
      logError(#NotAuthorized, "addAdmin unauthorized attempt");
      return #err(#NotAuthorized);
    };
    if (isAdmin(newAdmin)) {
      logError(#InvalidPrincipal, "addAdmin: already admin");
      return #err(#InvalidPrincipal);
    };
    admins := Array.append(admins, [newAdmin]);
    // adminSet := Set.add<Principal>(adminSet, newAdmin, Principal.equal); // Not available in DFX 0.18.0
    logEvent("AdminAdded", "New admin: " # Principal.toText(newAdmin));
    #ok("Admin added successfully")
  };

  public shared(msg) func removeAdmin(admin: Principal) : async Result {
    if (msg.caller != owner) {
      logError(#NotAuthorized, "removeAdmin unauthorized attempt");
      return #err(#NotAuthorized);
    };
    if (admin == owner) {
      logError(#InvalidPrincipal, "removeAdmin: cannot remove owner");
      return #err(#InvalidPrincipal);
    };
    admins := Array.filter<Principal>(admins, func(p) { p != admin });
    // adminSet := Set.delete<Principal>(adminSet, admin, Principal.equal); // Not available in DFX 0.18.0
    logEvent("AdminRemoved", "Removed admin: " # Principal.toText(admin));
    #ok("Admin removed successfully")
  };

  public shared query(msg) func listAdmins() : async [Principal] {
    if (msg.caller != owner) {
      logError(#NotAuthorized, "listAdmins unauthorized attempt");
      return [];
    };
    admins
  };

  // Runtime state
  var policies = HashMap.fromIter<Principal, Policy>(
    policiesEntries.vals(), 10, Principal.equal, Principal.hash
  );

  // Policy structure matching frontend IDL
  public type Policy = {
    customer : Principal;
    premium : Nat;
    coverage : Nat;
    active : Bool;
    paidOut : Bool;
    timestamp : Int;
  };

  // Error types matching frontend IDL
  public type Error = {
    #NotAuthorized;
    #PolicyAlreadyActive;
    #NoPolicyFound;
    #PolicyAlreadyPaidOut;
    #InsufficientPremium;
    #InvalidAmount;
    #FloodLevelBelowThreshold;
    #PayoutFailed;
    #NoFundsToWithdraw;
    #InvalidThreshold;
    #InvalidPrincipal;
    #ParseError;
    #HttpRequestFailed;
  };

  public type Result = Result.Result<Text, Error>;

  public type Stats = {
    totalPolicies : Nat;
    activePolicies : Nat;
    totalPayouts : Nat;
    contractBalance : Nat;
    currentFloodLevel : Nat;
    floodThreshold : Nat;
    lastOracleUpdate : Int;
  };

  // Logging functions - moved to top so they can be called by other functions
  func logError(err: Error, context: Text) {
    Debug.print("Error [" # context # "]: " # debug_show(err));
  };

  func logEvent(event: Text, details: Text) {
    Debug.print("Event [" # event # "]: " # details);
  };

  // Upgrade hooks
  system func preupgrade() {
    policiesEntries := Iter.toArray(policies.entries());
    users := Iter.toArray(userMap.entries());
    // admins := Iter.toArray(adminSet.entries()); // Not available in DFX 0.18.0
  };

  system func postupgrade() {
    policies := HashMap.fromIter<Principal, Policy>(
      policiesEntries.vals(), 10, Principal.equal, Principal.hash
    );
    policiesEntries := [];
    userMap := HashMap.fromIter<Principal, Text>(
      users.vals(), 10, Principal.equal, Principal.hash
    );
    users := [];
    // adminSet := Set.fromArray<Principal>(admins, Principal.equal, Principal.hash); // Not available in DFX 0.18.0
    admins := [];
  };

  // HTTP outcall types - temporarily disabled
  // type HttpRequest = Http.Request;
  // type HttpResponse = Http.Response;

  // USGS API configuration - temporarily disabled
  // let USGS_API_URL = "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=01491000&parameterCd=00065&siteStatus=all";

  // Initialization function
  public shared(msg) func init() : async Result {
    if (msg.caller != owner) return #err(#NotAuthorized);
    // Can add initialization logic here
    #ok("Canister initialized");
  };

  // Fetch flood data from USGS API - temporarily disabled
  public shared(msg) func updateFloodData() : async Result {
    if (msg.caller != owner) return #err(#NotAuthorized);
    
    // Temporarily return mock data for local testing
    currentFloodLevel := 1000;
    lastOracleUpdate := Time.now();
    #ok("Mock flood data updated successfully");
  };

  // Parse flood level from USGS response - temporarily disabled
  // func parseFloodLevel(json : Text) : ?Nat {
  //   // TODO: Implement proper JSON parsing
  //   // For now return a mock value
  //   ?1000;
  // };

  // Query functions for flood data
  public query func getCurrentFloodLevel() : async Nat {
    currentFloodLevel
  };

  public query func getFloodLevelInFeet() : async Nat {
    // Convert from mm to feet (1 foot = 304.8 mm)
    currentFloodLevel / 304
  };

  public query func getLastOracleUpdate() : async Int {
    lastOracleUpdate
  };

  // User management
  stable var users : [(Principal, Text)] = []; // Principal -> username
  var userMap = HashMap.fromIter<Principal, Text>(
    users.vals(), 10, Principal.equal, Principal.hash
  );

  // Register new user
  public shared(msg) func register(username: Text) : async Result {
    if (Text.size(username) < 3) return #err(#InvalidPrincipal);
    if (userMap.get(msg.caller) != null) return #err(#InvalidPrincipal);
    
    userMap.put(msg.caller, username);
    #ok("User registered successfully")
  };

  // Get current user's username
  public shared query(msg) func getMyUsername() : async ?Text {
    userMap.get(msg.caller)
  };

  // Admin function to list all users
  public shared query(msg) func listUsers() : async [(Principal, Text)] {
    if (msg.caller != owner) return [];
    Iter.toArray(userMap.entries())
  };

  // Upgrade hooks are now handled above

  // Policy lifecycle functions - buyInsurance is defined below with enhanced error handling

  public shared(msg) func activatePolicy() : async Result {
    switch (policies.get(msg.caller)) {
      case (?policy) {
        if (policy.active) return #err(#PolicyAlreadyActive);
        let updated = {
          policy with active = true;
        };
        policies.put(msg.caller, updated);
        #ok("Policy activated successfully")
      };
      case null {
        #err(#NoPolicyFound)
      };
    }
  };

  public shared(msg) func deactivatePolicy() : async Result {
    switch (policies.get(msg.caller)) {
      case (?policy) {
        if (not policy.active) return #err(#PolicyAlreadyActive);
        if (policy.paidOut) return #err(#PolicyAlreadyPaidOut);
        let updated = {
          policy with active = false;
        };
        policies.put(msg.caller, updated);
        #ok("Policy deactivated successfully")
      };
      case null {
        #err(#NoPolicyFound)
      };
    }
  };

  // triggerPayout is defined below with enhanced error handling

  public shared query(msg) func getMyPolicy() : async ?Policy {
    policies.get(msg.caller)
  };

  // Automated payout check (to be called periodically)
  public shared(msg) func checkForPayouts() : async Result {
    if (msg.caller != owner) return #err(#NotAuthorized);
    if (currentFloodLevel < floodThreshold) return #err(#FloodLevelBelowThreshold);
    
    var payoutCount = 0;
    for ((principal, policy) in policies.entries()) {
      if (policy.active and not policy.paidOut and currentFloodLevel >= floodThreshold) {
        if (contractBalance >= policy.coverage) {
          contractBalance -= policy.coverage;
          let updated = {
            policy with paidOut = true;
          };
          policies.put(principal, updated);
          payoutCount += 1;
        };
      };
    };

    if (payoutCount > 0) {
      #ok(Nat.toText(payoutCount) # " payouts processed successfully")
    } else {
      #ok("No eligible payouts found")
    }
  };

  // Admin function to manually trigger payout checks
  public shared(msg) func runAutoPayouts() : async Result {
    if (msg.caller != owner) return #err(#NotAuthorized);
    await checkForPayouts()
  };

  // Fund management functions
  public shared(msg) func payPremium() : async Result {
    switch (policies.get(msg.caller)) {
      case (?policy) {
        if (not policy.active) return #err(#NoPolicyFound);
        if (policy.paidOut) return #err(#PolicyAlreadyPaidOut);
        
        // In a real implementation, this would transfer ICP from caller
        // For now we'll just simulate the premium payment
        contractBalance += policy.premium;
        #ok("Premium payment processed")
      };
      case null {
        #err(#NoPolicyFound)
      };
    }
  };

  public shared(msg) func fundContract(amount: Nat) : async Result {
    if (msg.caller != owner) return #err(#NotAuthorized);
    if (amount == 0) return #err(#InvalidAmount);
    
    // In real implementation, would transfer ICP from owner
    contractBalance += amount;
    #ok("Contract funded successfully")
  };

  public shared(msg) func withdraw(amount: Nat) : async Result {
    if (msg.caller != owner) return #err(#NotAuthorized);
    if (amount == 0) return #err(#InvalidAmount);
    if (contractBalance < amount) return #err(#NoFundsToWithdraw);
    
    contractBalance -= amount;
    #ok("Withdrawal processed successfully")
  };

  public query func getContractBalance() : async Nat {
    contractBalance
  };

  // Cycle management
  public func canisterBalance() : async Nat {
    Cycles.balance()
  };

  public shared(msg) func depositCycles() : async Nat {
    if (msg.caller != owner) return 0;
    let available = Cycles.available();
    let accepted = Cycles.accept(available);
    accepted
  };

  public shared query(msg) func canisterStatus() : async {
    balance: Nat;
    memorySize: Nat;
    cycles: Nat;
    policies: Nat;
  } {
    if (msg.caller != owner) return {
      balance = 0;
      memorySize = 0;
      cycles = 0;
      policies = 0;
    };
    {
      balance = contractBalance;
      memorySize = 0; // Would use actual memory measurement in production
      cycles = Cycles.balance();
      policies = policies.size();
    }
  };

  // Placeholder for hello function (to be removed later)

  // Enhanced error handling for key functions
  public shared(msg) func buyInsurance(coverage: Nat) : async Result {
    try {
      if (coverage == 0) {
        logError(#InvalidAmount, "buyInsurance: zero coverage");
        return #err(#InvalidAmount);
      };
      
      let premium = coverage / 10;
      let policy : Policy = {
        customer = msg.caller;
        premium = premium;
        coverage = coverage;
        active = false;
        paidOut = false;
        timestamp = Time.now();
      };

      policies.put(msg.caller, policy);
      logEvent("PolicyCreated", "Customer: " # Principal.toText(msg.caller) # " Coverage: " # Nat.toText(coverage));
      #ok("Insurance policy created. Please activate when ready.")
    } catch (e) {
      logError(#PayoutFailed, "buyInsurance error: " # Error.message(e));
      #err(#PayoutFailed)
    }
  };

  public shared(msg) func triggerPayout() : async Result {
    try {
      switch (policies.get(msg.caller)) {
        case (?policy) {
          if (not policy.active) {
            logError(#NoPolicyFound, "triggerPayout: policy not active");
            return #err(#NoPolicyFound);
          };
          if (policy.paidOut) {
            logError(#PolicyAlreadyPaidOut, "triggerPayout: already paid");
            return #err(#PolicyAlreadyPaidOut);
          };
          if (currentFloodLevel < floodThreshold) {
            logError(#FloodLevelBelowThreshold, "triggerPayout: flood level " # Nat.toText(currentFloodLevel));
            return #err(#FloodLevelBelowThreshold);
          };
          if (contractBalance < policy.coverage) {
            logError(#PayoutFailed, "triggerPayout: insufficient funds");
            return #err(#PayoutFailed);
          };
          
          contractBalance -= policy.coverage;
          let updated = {
            policy with paidOut = true;
          };
          policies.put(msg.caller, updated);
          logEvent("PayoutProcessed", "Customer: " # Principal.toText(msg.caller) # " Amount: " # Nat.toText(policy.coverage));
          #ok("Payout processed successfully")
        };
        case null {
          logError(#NoPolicyFound, "triggerPayout: no policy found");
          #err(#NoPolicyFound)
        };
      }
    } catch (e) {
      logError(#PayoutFailed, "triggerPayout error: " # Error.message(e));
      #err(#PayoutFailed)
    }
  };

  public query func hello() : async Text {
    "Paramify - Flood Insurance";
  };
}