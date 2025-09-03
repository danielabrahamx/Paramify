import Map "mo:base/HashMap";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Debug "mo:base/Debug";
import Iter "mo:base/Iter";
import Array "mo:base/Array";

actor FloodDataStorage {
    
    // Type definitions
    public type FloodData = {
        location: Text;
        waterLevel: Float;
        timestamp: Int;
        source: Text;
        ethBlockNumber: Nat;
        alertLevel: Text; // "SAFE", "WARNING", "CRITICAL"
    };

    public type StorageStats = {
        totalRecords: Nat;
        lastUpdate: Int;
        activeLocations: Nat;
    };

    // Stable storage for persistence across upgrades
    private stable var entries : [(Text, FloodData)] = [];
    private stable var totalRecords : Nat = 0;
    
    // In-memory HashMap for fast access
    private var floodDataStore = Map.fromIter<Text, FloodData>(
        entries.vals(), 
        entries.size(), 
        Text.equal, 
        Text.hash
    );

    // System functions for canister upgrades
    system func preupgrade() {
        entries := Map.toArray(floodDataStore);
    };

    system func postupgrade() {
        entries := [];
    };

    // Store flood data from Ethereum backend
    public func storeFloodData(locationId: Text, data: FloodData) : async Result.Result<Text, Text> {
        try {
            floodDataStore.put(locationId, data);
            totalRecords += 1;
            
            let alertLevel = if (data.waterLevel > 3.0) "CRITICAL" 
                           else if (data.waterLevel > 2.0) "WARNING" 
                           else "SAFE";
            
            let updatedData = {
                location = data.location;
                waterLevel = data.waterLevel;
                timestamp = data.timestamp;
                source = data.source;
                ethBlockNumber = data.ethBlockNumber;
                alertLevel = alertLevel;
            };
            
            floodDataStore.put(locationId, updatedData);
            
            Debug.print("✅ Stored flood data for location: " # locationId # " | Level: " # Float.toText(data.waterLevel) # "ft | Alert: " # alertLevel);
            
            #ok("Data stored successfully for location: " # locationId)
        } catch (error) {
            Debug.print("❌ Failed to store data for location: " # locationId);
            #err("Storage failed: " # debug_show(error))
        }
    };

    // Retrieve latest flood data for specific location
    public query func getFloodData(locationId: Text) : async ?FloodData {
        floodDataStore.get(locationId)
    };

    // Get all stored locations
    public query func getAllLocations() : async [Text] {
        Iter.toArray(Map.keys(floodDataStore))
    };

    // Get storage statistics
    public query func getStorageStats() : async StorageStats {
        {
            totalRecords = totalRecords;
            lastUpdate = Time.now();
            activeLocations = floodDataStore.size();
        }
    };

    // Get all flood data (for admin/analytics)
    public query func getAllFloodData() : async [(Text, FloodData)] {
        Map.toArray(floodDataStore)
    };

    // Check if location has critical flood levels
    public query func isCriticalLevel(locationId: Text) : async Bool {
        switch (floodDataStore.get(locationId)) {
            case (?data) { data.waterLevel > 3.0 };
            case null { false };
        }
    };

    // HTTP outcall function (ready for implementation)
    public func fetchExternalFloodData(apiUrl: Text, locationId: Text) : async Result.Result<FloodData, Text> {
        // Architecture ready for HTTP outcalls to USGS, NOAA, etc.
        // For hackathon demo, return mock data structure
        let mockData : FloodData = {
            location = locationId;
            waterLevel = 2.5;
            timestamp = Time.now();
            source = "ICP_HTTP_OUTCALL";
            ethBlockNumber = 0;
            alertLevel = "WARNING";
        };
        
        Debug.print("🌐 HTTP Outcall architecture ready for: " # apiUrl);
        #ok(mockData)
    };

    // Health check endpoint
    public query func healthCheck() : async {status: Text; timestamp: Int; canisterId: Text} {
        {
            status = "HEALTHY";
            timestamp = Time.now();
            canisterId = "flood_data_storage";
        }
    };
}