import Buffer "mo:base/Buffer";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Map "mo:base/HashMap";
import Iter "mo:base/Iter";
import Text "mo:base/Text";
import Debug "mo:base/Debug";
import Float "mo:base/Float";

actor {
  // Data structures
  type FloodData = {
    timestamp: Time.Time;
    level: Float;
    location: Text;
    source: Text;
  };

  type UserActivity = {
    userId: Principal;
    action: Text;
    timestamp: Time.Time;
    metadata: Text;
  };

  type PolicyData = {
    policyId: Principal;
    holder: Principal;
    coverage: Nat;
    premium: Nat;
    startTime: Time.Time;
    endTime: Time.Time;
    status: Text;
    lastUpdated: Time.Time;
  };

  // Stable storage
  stable var floodDataEntries: [FloodData] = [];
  stable var userActivityEntries: [UserActivity] = [];
  stable var policyDataEntries: [(Principal, PolicyData)] = [];
  stable var adminEntries: [Principal] = [];

  // Runtime variables
  var floodData = Buffer.Buffer<FloodData>(0);
  var userActivities = Buffer.Buffer<UserActivity>(0);
  var policies = Map.HashMap<Principal, PolicyData>(0, Principal.equal, Principal.hash);
  var admins = Buffer.Buffer<Principal>(0);

  // Initialize first caller as admin
  private func ensureBootstrap(caller: Principal) {
    if (admins.size() == 0) { 
      admins.add(caller);
      Debug.print("Bootstrap admin: " # Principal.toText(caller));
    };
  };

  // System functions for upgrades
  system func preupgrade() {
    floodDataEntries := Buffer.toArray(floodData);
    userActivityEntries := Buffer.toArray(userActivities);
    policyDataEntries := Iter.toArray(policies.entries());
    adminEntries := Buffer.toArray(admins);
  };

  system func postupgrade() {
    for (data in floodDataEntries.vals()) {
      floodData.add(data);
    };
    for (activity in userActivityEntries.vals()) {
      userActivities.add(activity);
    };
    for ((id, policy) in policyDataEntries.vals()) {
      policies.put(id, policy);
    };
    for (admin in adminEntries.vals()) {
      admins.add(admin);
    };
  };

  // Admin functions
  private func isAdmin(caller: Principal) : Bool {
    for (admin in admins.vals()) {
      if (admin == caller) { return true; };
    };
    false
  };

  public shared(msg) func addAdmin(newAdmin: Principal) : async Result.Result<(), Text> {
    ensureBootstrap(msg.caller);
    if (not isAdmin(msg.caller)) {
      return #err("Caller is not an admin");
    };
    admins.add(newAdmin);
    #ok(())
  };

  // Flood data management
  public shared(msg) func recordFloodData(level: Float, location: Text, source: Text) : async Result.Result<(), Text> {
    ensureBootstrap(msg.caller);
    if (not isAdmin(msg.caller)) {
      return #err("Caller is not an admin");
    };

    let data: FloodData = {
      timestamp = Time.now();
      level = level;
      location = location;
      source = source;
    };
    
    floodData.add(data);
    
    // Keep only last 1000 records to prevent memory issues
    if (floodData.size() > 1000) {
      let newBuffer = Buffer.Buffer<FloodData>(1000);
      let start : Nat = floodData.size() - 1000;
      var idx : Nat = start;
      while (idx < floodData.size()) {
        newBuffer.add(floodData.get(idx));
        idx += 1;
      };
      floodData := newBuffer;
    };

    #ok(())
  };

  public query func getFloodData(limit: ?Nat) : async [FloodData] {
    let maxLimit = switch(limit) {
      case (?n) { Nat.min(n, floodData.size()) };
      case null { floodData.size() };
    };
    
    let result = Buffer.Buffer<FloodData>(maxLimit);
    let startIndex = if (floodData.size() > maxLimit) { floodData.size() - maxLimit } else { 0 };
    var i : Nat = startIndex;
    while (i < floodData.size()) {
      result.add(floodData.get(i));
      i += 1;
    };
    
    Buffer.toArray(result)
  };

  public query func getLatestFloodLevel() : async ?Float {
    if (floodData.size() == 0) { return null; };
    ?(floodData.get(floodData.size() - 1).level)
  };

  // User activity tracking
  public shared(msg) func recordActivity(action: Text, metadata: Text) : async Result.Result<(), Text> {
    let activity: UserActivity = {
      userId = msg.caller;
      action = action;
      timestamp = Time.now();
      metadata = metadata;
    };
    
    userActivities.add(activity);
    
    // Keep only last 5000 activities
    if (userActivities.size() > 5000) {
      let newBuffer = Buffer.Buffer<UserActivity>(5000);
      let startUa : Nat = userActivities.size() - 5000;
      var j : Nat = startUa;
      while (j < userActivities.size()) {
        newBuffer.add(userActivities.get(j));
        j += 1;
      };
      userActivities := newBuffer;
    };

    #ok(())
  };

  public query func getUserActivities(userId: Principal, limit: ?Nat) : async [UserActivity] {
    let maxLimit = switch(limit) {
      case (?n) { n };
      case null { 100 };
    };
    
    let result = Buffer.Buffer<UserActivity>(0);
    var count = 0;
    
    var k : Nat = userActivities.size();
    while (k > 0 and count < maxLimit) {
      k -= 1;
      let activity = userActivities.get(k);
      if (activity.userId == userId) {
        result.add(activity);
        count += 1;
      };
    };
    
    Buffer.toArray(result)
  };

  // Policy data management
  public shared(msg) func createPolicy(coverage: Nat, premium: Nat, durationDays: Nat) : async Result.Result<Principal, Text> {
    let policyId = msg.caller;
    let now = Time.now();
    let durationNs = durationDays * 86_400_000_000_000;
    
    let policy: PolicyData = {
      policyId = policyId;
      holder = msg.caller;
      coverage = coverage;
      premium = premium;
      startTime = now;
      endTime = now + durationNs;
      status = "active";
      lastUpdated = now;
    };
    
    policies.put(policyId, policy);
    
    // Record the activity
    ignore await recordActivity("policy_created", "Coverage: " # Nat.toText(coverage) # ", Premium: " # Nat.toText(premium));
    
    #ok(policyId)
  };

  public shared(msg) func updatePolicyStatus(policyId: Principal, newStatus: Text) : async Result.Result<(), Text> {
    switch (policies.get(policyId)) {
      case (?policy) {
        if (policy.holder != msg.caller and not isAdmin(msg.caller)) {
          return #err("Not authorized to update this policy");
        };
        
        let updatedPolicy: PolicyData = {
          policyId = policy.policyId;
          holder = policy.holder;
          coverage = policy.coverage;
          premium = policy.premium;
          startTime = policy.startTime;
          endTime = policy.endTime;
          status = newStatus;
          lastUpdated = Time.now();
        };
        
        policies.put(policyId, updatedPolicy);
        
        ignore await recordActivity("policy_updated", "Status changed to: " # newStatus);
        #ok(())
      };
      case null {
        #err("Policy not found")
      };
    };
  };

  public query func getPolicy(policyId: Principal) : async ?PolicyData {
    policies.get(policyId)
  };

  public query func getUserPolicies(userId: Principal) : async [PolicyData] {
    let result = Buffer.Buffer<PolicyData>(0);
    for ((id, policy) in policies.entries()) {
      if (policy.holder == userId) {
        result.add(policy);
      };
    };
    Buffer.toArray(result)
  };

  // Analytics and statistics
  public query func getStats() : async {
    totalFloodRecords: Nat;
    totalActivities: Nat;
    totalPolicies: Nat;
    activePolicies: Nat;
  } {
    var activeCount = 0;
    for ((_, policy) in policies.entries()) {
      if (policy.status == "active") { activeCount += 1; };
    };
    
    {
      totalFloodRecords = floodData.size();
      totalActivities = userActivities.size();
      totalPolicies = policies.size();
      activePolicies = activeCount;
    }
  };

  // Utility functions
  public query func getCanisterInfo() : async {
    adminCount: Nat;
    memorySize: Nat;
  } {
    {
      adminCount = admins.size();
      memorySize = floodData.size() + userActivities.size() + policies.size();
    }
  };
};
