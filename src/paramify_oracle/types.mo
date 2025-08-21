import Time "mo:base/Time";
import Principal "mo:base/Principal";

module {
    public type FloodData = {
        value : Float;        // Water level in feet
        timestamp : Time.Time;
        source : Text;
        siteId : Text;
        siteName : Text;
        lastUpdate : Time.Time;
    };

    public type OracleStatus = {
        isActive : Bool;
        lastUpdate : ?Time.Time;
        currentFloodLevel : ?Float;
        updateInterval : Nat64; // seconds
        nextUpdate : ?Time.Time;
        coreCanisterId : ?Principal;
    };
};