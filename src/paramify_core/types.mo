import Principal "mo:base/Principal";
import Time "mo:base/Time";

module {
    public type Policy = {
        customer : Principal;
        premium : Nat64;      // Paid in cycles (ICP equivalent)
        coverage : Nat64;     // Payout amount in cycles
        active : Bool;
        paidOut : Bool;
        purchaseTime : Time.Time;
    };
};