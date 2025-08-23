import Buffer "mo:base/Buffer";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Map "mo:base/HashMap";
import Iter "mo:base/Iter";
import Text "mo:base/Text";
import Debug "mo:base/Debug";

actor {
  type Policy = {
    policyHolder: Principal;
    coverageAmount: Nat;
    premiumAmount: Nat;
    startTime: Time.Time;
    endTime: Time.Time;
    isActive: Bool;
    hasClaimed: Bool;
  };

  // Use stable types for stable variables
  stable var policiesEntries: [(Principal, Policy)] = [];
  stable var adminsEntries: [Principal] = [];
  stable var oracleUpdater: ?Principal = null;
  stable var floodThreshold: Nat = 0;
  stable var currentFloodLevel: Nat = 0;

  // Runtime variables (not stable)
  var policies = Map.HashMap<Principal, Policy>(0, Principal.equal, Principal.hash);
  var admins = Buffer.Buffer<Principal>(0);

  // No hardcoded default admin; the first caller of an admin method becomes admin.
  private func ensureBootstrap(caller: Principal) {
    if (admins.size() == 0) { admins.add(caller) };
  };

  system func preupgrade() {
    // Convert runtime data to stable format
    policiesEntries := Iter.toArray(policies.entries());
    adminsEntries := Buffer.toArray(admins);
  };

  system func postupgrade() {
    // Convert stable data back to runtime format
    for ((id, policy) in policiesEntries.vals()) {
      policies.put(id, policy);
    };
    for (admin in adminsEntries.vals()) {
      admins.add(admin);
    };
    // No default admin; bootstrap happens on first admin call.
  };

  public shared(msg) func addAdmin(newAdmin: Principal) : async Result.Result<(), Text> {
    ensureBootstrap(msg.caller);
    if (not isAdmin(msg.caller)) {
      return #err("Caller is not an admin");
    };
    admins.add(newAdmin);
    #ok(())
  };

  public shared(msg) func removeAdmin(adminToRemove: Principal) : async Result.Result<(), Text> {
    ensureBootstrap(msg.caller);
    if (not isAdmin(msg.caller)) {
      return #err("Caller is not an admin");
    };
    let newAdmins = Buffer.Buffer<Principal>(0);
    for (admin in admins.vals()) {
      if (admin != adminToRemove) {
        newAdmins.add(admin);
      };
    };
    admins := newAdmins;
    #ok(())
  };

  public shared(msg) func setOracleUpdater(updater: Principal) : async Result.Result<(), Text> {
    ensureBootstrap(msg.caller);
    if (not isAdmin(msg.caller)) {
      return #err("Caller is not an admin");
    };
    oracleUpdater := ?updater;
    #ok(())
  };

  public shared(msg) func setFloodThreshold(threshold: Nat) : async Result.Result<(), Text> {
    ensureBootstrap(msg.caller);
    if (not isAdmin(msg.caller)) {
      return #err("Caller is not an admin");
    };
    floodThreshold := threshold;
    #ok(())
  };

  public shared(msg) func updateFloodLevel(level: Nat) : async Result.Result<(), Text> {
    switch (oracleUpdater) {
      case (?updater) {
        if (msg.caller != updater) {
          return #err("Caller is not the oracle updater");
        };
      };
      case null {
        return #err("Oracle updater not set");
      };
    };
    currentFloodLevel := level;
    #ok(())
  };

  public shared(msg) func buyInsurance(coverage: Nat, duration: Nat) : async Result.Result<Principal, Text> {
    // For simplicity, assume premium is coverage / 10
    let premium = coverage / 10;
    // In real scenario, handle payment here
    let policyId = msg.caller; // Using caller as ID for simplicity
    let policy: Policy = {
      policyHolder = msg.caller;
      coverageAmount = coverage;
      premiumAmount = premium;
      startTime = Time.now();
      endTime = Time.now() + duration * 86_400_000_000_000; // duration in days
      isActive = true;
      hasClaimed = false;
    };
    policies.put(policyId, policy);
    #ok(policyId)
  };

  public shared(msg) func claimPayout(policyId: Principal) : async Result.Result<Nat, Text> {
    switch (policies.get(policyId)) {
      case (?policy) {
        if (policy.policyHolder != msg.caller) {
          return #err("Not the policy holder");
        };
        if (not policy.isActive) {
          return #err("Policy is not active");
        };
        if (policy.hasClaimed) {
          return #err("Already claimed");
        };
        if (currentFloodLevel < floodThreshold) {
          return #err("Flood level below threshold");
        };
        // Deactivate and mark as claimed
        let updatedPolicy = { policy with isActive = false; hasClaimed = true };
        policies.put(policyId, updatedPolicy);
        // In real scenario, transfer payout
        #ok(policy.coverageAmount)
      };
      case null {
        #err("Policy not found")
      };
    };
  };

  private func isAdmin(caller: Principal) : Bool {
    for (admin in admins.vals()) {
      if (admin == caller) {
        return true;
      };
    };
    false
  };

  public query func getFloodThreshold() : async Nat {
    floodThreshold
  };

  public query func getCurrentFloodLevel() : async Nat {
    currentFloodLevel
  };

  public query func getPolicy(policyId: Principal) : async ?Policy {
    policies.get(policyId)
  };
};
