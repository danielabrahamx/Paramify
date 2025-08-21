import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Cycles "mo:base/Cycles";
import Debug "mo:base/Debug";
import Error "mo:base/Error";
import Float "mo:base/Float";
import HashMap "mo:base/HashMap";
import Int "mo:base/Int";
import Int64 "mo:base/Int64";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Timer "mo:base/Timer";

import Types "./types";

shared ({ caller = owner }) actor class ParamifyCore() = this {

    // Types
    type Policy = Types.Policy;
    type Result<T, E> = Result.Result<T, E>;

    // State variables
    stable var floodThreshold : Nat64 = 1200000000000; // 12 feet in contract units
    stable var insuranceAmount : Nat64 = 0;
    stable var isInitialized : Bool = true;

    // Policies storage using stable memory
    stable var policiesEntries : [(Principal, Policy)] = [];
    var policies : HashMap.HashMap<Principal, Policy> = HashMap.fromIter(
        policiesEntries.vals(),
        0,
        Principal.equal,
        Principal.hash
    );

    // Role-based access control
    stable var adminRoles : [(Principal, [Text])] = [];
    var roles : HashMap.HashMap<Principal, [Text]> = HashMap.fromIter(
        adminRoles.vals(),
        0,
        Principal.equal,
        Principal.hash
    );

    // Constants
    let ORACLE_UPDATER_ROLE = "ORACLE_UPDATER_ROLE";
    let INSURANCE_ADMIN_ROLE = "INSURANCE_ADMIN_ROLE";
    let DEFAULT_ADMIN_ROLE = "DEFAULT_ADMIN_ROLE";

    // Events (simulated with stable variables for logging)
    stable var eventLog : [Text] = [];

    // Initialize roles for owner
    private func initializeRoles() {
        let ownerRoles = [DEFAULT_ADMIN_ROLE, ORACLE_UPDATER_ROLE, INSURANCE_ADMIN_ROLE];
        roles.put(owner, ownerRoles);
    };

    // Check if caller has a specific role
    private func hasRole(caller : Principal, role : Text) : Bool {
        switch (roles.get(caller)) {
            case (?userRoles) {
                Option.isSome(Array.find(userRoles, func(r : Text) : Bool { r == role }))
            };
            case null { false };
        };
    };

    // Add role to a principal
    private func grantRole(caller : Principal, role : Text) : Result<(), Text> {
        if (not hasRole(caller, DEFAULT_ADMIN_ROLE)) {
            return #err("Unauthorized: Not an admin");
        };

        switch (roles.get(role)) {
            case (?userRoles) {
                let newRoles = Array.append(userRoles, [role]);
                roles.put(role, newRoles);
            };
            case null {
                roles.put(role, [role]);
            };
        };

        #ok(())
    };

    // Remove role from a principal
    private func revokeRole(caller : Principal, role : Text, target : Principal) : Result<(), Text> {
        if (not hasRole(caller, DEFAULT_ADMIN_ROLE)) {
            return #err("Unauthorized: Not an admin");
        };

        switch (roles.get(target)) {
            case (?userRoles) {
                let newRoles = Array.filter(userRoles, func(r : Text) : Bool { r != role });
                roles.put(target, newRoles);
            };
            case null { };
        };

        #ok(())
    };

    // System functions
    system func preupgrade() {
        policiesEntries := Iter.toArray(policies.entries());
        adminRoles := Iter.toArray(roles.entries());
    };

    system func postupgrade() {
        policies := HashMap.fromIter(
            policiesEntries.vals(),
            0,
            Principal.equal,
            Principal.hash
        );
        roles := HashMap.fromIter(
            adminRoles.vals(),
            0,
            Principal.equal,
            Principal.hash
        );
        policiesEntries := [];
        adminRoles := [];
    };

    // Initialize the contract
    public shared ({ caller }) func initialize() : async Result<(), Text> {
        if (caller != owner) {
            return #err("Only owner can initialize");
        };

        if (not isInitialized) {
            initializeRoles();
            isInitialized := true;
        };

        #ok(())
    };

    // Get current flood threshold
    public query func getCurrentThreshold() : async Nat64 {
        floodThreshold;
    };

    // Get threshold in feet (divide by 100000000000)
    public query func getThresholdInFeet() : async Float {
        Float.fromInt64(Int64.fromNat64(floodThreshold)) / 100000000000.0;
    };

    // Set flood threshold (only owner)
    public shared ({ caller }) func setThreshold(newThreshold : Nat64) : async Result<(), Text> {
        if (caller != owner) {
            return #err("Unauthorized: Not owner");
        };

        if (newThreshold == 0) {
            return #err("Threshold must be positive");
        };

        if (newThreshold > 10000000000000) { // Max 100 feet
            return #err("Threshold too high");
        };

        let oldThreshold = floodThreshold;
        floodThreshold := newThreshold;

        // Log event
        let event = "ThresholdChanged: " # Nat64.toText(oldThreshold) # " -> " # Nat64.toText(newThreshold);
        eventLog := Array.append(eventLog, [event]);

        #ok(())
    };

    // Set insurance amount (insurance admin only)
    public shared ({ caller }) func setInsuranceAmount(amount : Nat64) : async Result<(), Text> {
        if (not hasRole(caller, INSURANCE_ADMIN_ROLE)) {
            return #err("Unauthorized: Not an insurance admin");
        };

        insuranceAmount := amount;
        #ok(())
    };

    // Buy insurance policy
    public shared ({ caller }) func buyInsurance(coverage : Nat64) : async Result<(), Text> {
        if (coverage == 0) {
            return #err("Coverage must be greater than 0");
        };

        // Check if caller already has an active policy
        switch (policies.get(caller)) {
            case (?existingPolicy) {
                if (existingPolicy.active) {
                    return #err("Policy already active");
                };
            };
            case null { };
        };

        // Calculate required premium (coverage / 10)
        let requiredPremium = coverage / 10;
        let receivedValue = Cycles.balance();

        if (receivedValue < Nat64.toNat(requiredPremium)) {
            return #err("Insufficient premium payment");
        };

        // Create new policy
        let newPolicy : Policy = {
            customer = caller;
            premium = requiredPremium;
            coverage = coverage;
            active = true;
            paidOut = false;
            purchaseTime = Time.now();
        };

        policies.put(caller, newPolicy);

        // Log event
        let event = "InsurancePurchased: " # Principal.toText(caller) # " premium: " # Nat64.toText(requiredPremium) # " coverage: " # Nat64.toText(coverage);
        eventLog := Array.append(eventLog, [event]);

        #ok(())
    };

    // Get policy for a customer
    public query func getPolicy(customer : Principal) : async ?Policy {
        policies.get(customer);
    };

    // Check if customer is eligible for payout
    public query func isPayoutEligible(customer : Principal) : async Bool {
        switch (policies.get(customer)) {
            case (?policy) {
                if (not policy.active or policy.paidOut) {
                    return false;
                };

                // In a real implementation, this would get current flood level from oracle
                // For now, we'll assume eligibility is checked externally
                true;
            };
            case null { false };
        };
    };

    // Trigger payout for customer
    public shared ({ caller }) func triggerPayout() : async Result<(), Text> {
        switch (policies.get(caller)) {
            case (?policy) {
                if (not policy.active) {
                    return #err("No active policy");
                };

                if (policy.paidOut) {
                    return #err("Payout already issued");
                };

                // In a real implementation, we would check current flood level from oracle
                // and compare with threshold. For this migration, we'll assume the check
                // is done by the oracle canister before calling this function.

                // Mark policy as paid out
                let updatedPolicy = {
                    policy with
                    paidOut = true;
                    active = false;
                };
                policies.put(caller, updatedPolicy);

                // Transfer coverage amount (in a real implementation, this would transfer ICP)
                // For now, we'll just log the payout
                let event = "PayoutTriggered: " # Principal.toText(caller) # " amount: " # Nat64.toText(policy.coverage);
                eventLog := Array.append(eventLog, [event]);

                #ok(());
            };
            case null {
                #err("No policy found for caller");
            };
        };
    };

    // Update flood level from oracle (oracle updater role only)
    public shared ({ caller }) func updateFloodLevel(floodLevel : Nat64) : async Result<(), Text> {
        if (not hasRole(caller, ORACLE_UPDATER_ROLE)) {
            return #err("Unauthorized: Not an oracle updater");
        };

        // This function is called by the oracle canister to update flood level
        // In the future, we could store historical flood levels here

        let event = "FloodLevelUpdated: " # Nat64.toText(floodLevel) # " by oracle: " # Principal.toText(caller);
        eventLog := Array.append(eventLog, [event]);

        #ok(())
    };

    // Admin functions
    public shared ({ caller }) func addAdmin(target : Principal, role : Text) : async Result<(), Text> {
        grantRole(caller, role);
    };

    public shared ({ caller }) func removeAdmin(target : Principal, role : Text) : async Result<(), Text> {
        revokeRole(caller, role, target);
    };

    public shared ({ caller }) func withdraw() : async Result<Nat64, Text> {
        if (not hasRole(caller, DEFAULT_ADMIN_ROLE)) {
            return #err("Unauthorized: Not an admin");
        };

        // In a real implementation, this would transfer all ICP balance to caller
        let balance = Cycles.balance();
        if (balance == 0) {
            return #err("No funds to withdraw");
        };

        let event = "Withdrawal: " # Nat.toText(balance) # " cycles by " # Principal.toText(caller);
        eventLog := Array.append(eventLog, [event]);

        #ok(Nat64.fromNat(balance));
    };

    // Query functions
    public query func getContractBalance() : async Nat {
        Cycles.balance();
    };

    public query func getEventLog() : async [Text] {
        eventLog;
    };

    public query func hasRoleCheck(principal : Principal, role : Text) : async Bool {
        hasRole(principal, role);
    };

    public query func getInsuranceAmount() : async Nat64 {
        insuranceAmount;
    };

    public query func isContractInitialized() : async Bool {
        isInitialized;
    };
};