import Array "mo:base/Array";
import Blob "mo:base/Blob";
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

shared ({ caller = owner }) actor class ParamifyOracle() = this {

    type Result<T, E> = Result.Result<T, E>;

    // State variables
    stable var latestFloodData : ?Types.FloodData = null;
    stable var updateIntervalSeconds : Nat64 = 300; // 5 minutes
    stable var isActive : Bool = false;
    stable var coreCanisterId : ?Principal = null;

    // USGS API configuration
    let USGS_SITE_ID = "01646500"; // Potomac River Near Wash, DC Little Falls Pump Sta
    let USGS_PARAMETER_CODE = "00065"; // Gage height in feet
    let USGS_BASE_URL = "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=" # USGS_SITE_ID # "&parameterCd=" # USGS_PARAMETER_CODE # "&siteStatus=all";

    // Types
    type FloodData = Types.FloodData;

    // Store reference to core canister
    var coreCanister : ?ParamifyCore = null;

    type ParamifyCore = actor {
        updateFloodLevel : (Nat64) -> async Result<(), Text>;
        setThreshold : (Nat64) -> async Result<(), Text>;
        getCurrentThreshold : () -> async Nat64;
    };

    // Initialize the oracle with core canister ID
    public shared ({ caller }) func initialize(coreCanisterPrincipal : Principal) : async Result<(), Text> {
        if (caller != owner) {
            return #err("Only owner can initialize");
        };

        coreCanisterId := ?coreCanisterPrincipal;
        coreCanister := ?actor(Principal.toText(coreCanisterPrincipal)) : ?ParamifyCore;
        isActive := true;

        #ok(())
    };

    // Start periodic updates
    public shared ({ caller }) func startUpdates() : async Result<(), Text> {
        if (caller != owner) {
            return #err("Only owner can start updates");
        };

        if (not isActive) {
            return #err("Oracle not initialized");
        };

        // Start timer for periodic updates (5 minutes)
        ignore Timer.setTimer<system>(#seconds 0, updateFloodData);
        ignore Timer.recurringTimer<system>(#seconds Nat64.toNat(updateIntervalSeconds), updateFloodData);

        #ok(())
    };

    // Stop periodic updates
    public shared ({ caller }) func stopUpdates() : async Result<(), Text> {
        if (caller != owner) {
            return #err("Only owner can stop updates");
        };

        isActive := false;
        #ok(())
    };

    // Manual update function
    public shared ({ caller }) func manualUpdate() : async Result<(), Text> {
        if (caller != owner) {
            return #err("Only owner can trigger manual updates");
        };

        await performUpdate();
    };

    // Internal function to perform the actual update
    private func performUpdate() : async () {
        try {
            // Fetch USGS data
            let floodData = await fetchUSGSData();
            latestFloodData := ?floodData;

            // Update core canister
            switch (coreCanister) {
                case (?core) {
                    // Convert feet to contract units (multiply by 100000000000)
                    let scaledValue = Nat64.fromInt64(Float.toInt64(floodData.value * 100000000000.0));
                    let updateResult = await core.updateFloodLevel(scaledValue);

                    switch (updateResult) {
                        case (#ok()) {
                            Debug.print("✅ Successfully updated core canister with flood level: " # Float.toText(floodData.value));
                        };
                        case (#err(error)) {
                            Debug.print("❌ Failed to update core canister: " # error);
                        };
                    };
                };
                case null {
                    Debug.print("⚠️ Core canister not initialized");
                };
            };
        } catch (error) {
            Debug.print("❌ Error during flood data update: " # Error.message(error));
        };
    };

    // Function to fetch data from USGS API
    private func fetchUSGSData() : async FloodData {
        // In a real implementation, this would make an HTTPS outcall
        // For now, we'll simulate the data fetching

        Debug.print("🌊 Fetching flood data from USGS...");

        // Simulate USGS API response parsing
        // In production, this would use IC's HTTPS outcalls
        let simulatedWaterLevel = 11.5; // Example value in feet

        let floodData : FloodData = {
            value = simulatedWaterLevel;
            timestamp = Time.now();
            source = "USGS Water Data";
            siteId = USGS_SITE_ID;
            siteName = "Potomac River Near Wash, DC Little Falls Pump Sta";
            lastUpdate = Time.now();
        };

        Debug.print("📊 Latest water level: " # Float.toText(simulatedWaterLevel) # " ft");
        floodData;
    };

    // Get latest flood data
    public query func getLatestFloodData() : async ?FloodData {
        latestFloodData;
    };

    // Get current status
    public query func getStatus() : async Types.OracleStatus {
        {
            isActive = isActive;
            lastUpdate = switch (latestFloodData) {
                case (?data) { ?data.lastUpdate };
                case null { null };
            };
            currentFloodLevel = switch (latestFloodData) {
                case (?data) { ?data.value };
                case null { null };
            };
            updateInterval = updateIntervalSeconds;
            nextUpdate = switch (latestFloodData) {
                case (?data) {
                    ?(data.lastUpdate + Int64.fromNat64(updateIntervalSeconds * 1_000_000_000))
                };
                case null { null };
            };
            coreCanisterId = coreCanisterId;
        };
    };

    // Set update interval
    public shared ({ caller }) func setUpdateInterval(seconds : Nat64) : async Result<(), Text> {
        if (caller != owner) {
            return #err("Only owner can set update interval");
        };

        if (seconds < 60) {
            return #err("Update interval must be at least 60 seconds");
        };

        updateIntervalSeconds := seconds;
        #ok(())
    };

    // Function to be called by timer
    private func updateFloodData() : async () {
        if (isActive) {
            await performUpdate();
        };
    };

    // System functions
    system func heartbeat() : async () {
        if (isActive) {
            await performUpdate();
        };
    };
};