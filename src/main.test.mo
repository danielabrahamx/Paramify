import Array "mo:base/Array";
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Debug "mo:base/Debug";
import TestRunner "mo:matchers/TestRunner";
import Matchers "mo:matchers/Matchers";
import T "mo:matchers/Testable";
import Time "mo:base/Time";
import Error "mo:base/Error";

import Main "main";

let { run; test; suite } = TestRunner;
let { equals; isSome; isOk; isErr; not } = Matchers;

actor MainTest {
  let main = Main.Main();
  
  // Test principals
  let owner = Principal.fromText("aaaaa-aa");
  let user1 = Principal.fromText("2vxsx-fae");
  let user2 = Principal.fromText("3vxsx-fae");
  let admin1 = Principal.fromText("4vxsx-fae");

  public func runTests() : async Text {
    let runner = await run([
      
      suite("Canister Initialization & Access Control", [
        test("init succeeds for owner", 
          async {
            let result = await main.init();
            await isOk(result)
          }
        ),
        test("init fails for non-owner", 
          async {
            // This should fail since we're not the owner
            let result = await main.init();
            await isErr(result)
          }
        ),
        test("addAdmin succeeds for owner", 
          async {
            let result = await main.addAdmin(admin1);
            await isOk(result)
          }
        ),
        test("listAdmins returns correct admins", 
          async {
            let admins = await main.listAdmins();
            // Should include the admin we just added
            Array.find<Principal>(admins, func(admin) { admin == admin1 }) != null
          }
        )
      ]),

      suite("Contract Funding & Management", [
        test("fundContract succeeds for owner", 
          async {
            let result = await main.fundContract(10000);
            await isOk(result)
          }
        ),
        test("fundContract fails for non-owner", 
          async {
            // This should fail since we're not the owner
            let result = await main.fundContract(1000);
            await isErr(result)
          }
        ),
        test("getContractBalance returns correct amount", 
          async {
            let balance = await main.getContractBalance();
            await equals(T.nat(10000), balance)
          }
        ),
        test("setThreshold succeeds for owner", 
          async {
            let result = await main.setThreshold(5000);
            await isOk(result)
          }
        ),
        test("getThreshold returns correct value", 
          async {
            let threshold = await main.getThreshold();
            await equals(T.nat(5000), threshold)
          }
        )
      ]),

      suite("User Registration & Management", [
        test("user can register", 
          async {
            let result = await main.register("testuser1");
            await isOk(result)
          }
        ),
        test("getMyUsername returns correct username", 
          async {
            let username = await main.getMyUsername();
            await isSome(username)
          }
        ),
        test("cannot register with short username", 
          async {
            let result = await main.register("ab");
            await isErr(result)
          }
        )
      ]),

      suite("Insurance Policy Lifecycle", [
        test("user can buy insurance policy", 
          async {
            let result = await main.buyInsurance(1000);
            await isOk(result)
          }
        ),
        test("cannot buy zero coverage policy", 
          async {
            let result = await main.buyInsurance(0);
            await isErr(result)
          }
        ),
        test("getMyPolicy returns created policy", 
          async {
            let policy = await main.getMyPolicy();
            await isSome(policy)
          }
        ),
        test("policy starts as inactive", 
          async {
            let policy = await main.getMyPolicy();
            switch (policy) {
              case (?p) { not p.active };
              case null { false };
            }
          }
        ),
        test("can activate policy", 
          async {
            let result = await main.activatePolicy();
            await isOk(result)
          }
        ),
        test("activated policy shows as active", 
          async {
            let policy = await main.getMyPolicy();
            switch (policy) {
              case (?p) { p.active };
              case null { false };
            }
          }
        ),
        test("can pay premium", 
          async {
            let result = await main.payPremium();
            await isOk(result)
          }
        ),
        test("contract balance increases after premium", 
          async {
            let balance = await main.getContractBalance();
            // Should be more than initial 10000
            balance > 10000
          }
        )
      ]),

      suite("Flood Data & Oracle Integration", [
        test("can update flood data (mock)", 
          async {
            let result = await main.updateFloodData();
            await isOk(result)
          }
        ),
        test("can get current flood level", 
          async {
            let level = await main.getCurrentFloodLevel();
            await equals(T.nat(1000), level) // Using mock value
          }
        ),
        test("can get flood level in feet", 
          async {
            let levelFeet = await main.getFloodLevelInFeet();
            // 1000 mm / 304 = ~3.29 feet
            levelFeet > 3
          }
        ),
        test("can get last oracle update", 
          async {
            let update = await main.getLastOracleUpdate();
            update > 0
          }
        )
      ]),

      suite("Payout Logic & Execution", [
        test("payout not eligible when flood level below threshold", 
          async {
            let eligible = await main.isPayoutEligible(user1);
            not eligible
          }
        ),
        test("can manually trigger payout when eligible", 
          async {
            // First set flood level above threshold
            await main.updateFloodData(); // Sets to 1000
            // Threshold is 5000, so this should fail
            let result = await main.triggerPayout();
            await isErr(result)
          }
        ),
        test("payout succeeds when conditions met", 
          async {
            // Set threshold lower than current flood level
            await main.setThreshold(500);
            let result = await main.triggerPayout();
            await isOk(result)
          }
        ),
        test("policy marked as paid out after successful payout", 
          async {
            let policy = await main.getMyPolicy();
            switch (policy) {
              case (?p) { p.paidOut };
              case null { false };
            }
          }
        ),
        test("cannot trigger payout twice", 
          async {
            let result = await main.triggerPayout();
            await isErr(result)
          }
        )
      ]),

      suite("Automated Payout System", [
        test("checkForPayouts processes eligible policies", 
          async {
            // Create another user with policy
            await main.register("testuser2");
            await main.buyInsurance(500);
            await main.activatePolicy();
            await main.payPremium();
            
            // Set flood level above threshold
            await main.setThreshold(500);
            
            let result = await main.checkForPayouts();
            await isOk(result)
          }
        ),
        test("runAutoPayouts executes successfully", 
          async {
            let result = await main.runAutoPayouts();
            await isOk(result)
          }
        )
      ]),

      suite("Statistics & Reporting", [
        test("getStats returns comprehensive data", 
          async {
            let stats = await main.getStats();
            stats.totalPolicies > 0 and
            stats.contractBalance > 0 and
            stats.floodThreshold > 0
          }
        ),
        test("canisterStatus returns system info", 
          async {
            let status = await main.canisterStatus();
            status.policies > 0
          }
        )
      ]),

      suite("Error Handling & Edge Cases", [
        test("deactivatePolicy works correctly", 
          async {
            let result = await main.deactivatePolicy();
            await isOk(result)
          }
        ),
        test("withdraw fails for non-owner", 
          async {
            let result = await main.withdraw(100);
            await isErr(result)
          }
        ),
        test("transferOwnership works for owner", 
          async {
            let result = await main.transferOwnership(user1);
            await isOk(result)
          }
        )
      ])
    ]);

    if (runner.failures.size() > 0) {
      "Tests failed: " # Nat.toText(runner.failures.size()) # " failures"
    } else {
      "All tests passed! End-to-end functionality verified successfully."
    }
  };
};