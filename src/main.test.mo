import Array "mo:base/Array";
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Debug "mo:base/Debug";
import TestRunner "mo:matchers/TestRunner";
import Matchers "mo:matchers/Matchers";
import T "mo:matchers/Testable";

import Main "main";

let { run; test; suite } = TestRunner;
let { equals; isSome; isOk } = Matchers;

actor MainTest {
  let main = Main.Main();

  public func runTests() : async Text {
    let runner = await run([
      suite("Canister Initialization", [
        test("init succeeds for owner", 
          async {
            let result = await main.init();
            await isOk(result)
          }
        )
      ]),
      
      suite("Policy Management", [
        test("can buy insurance policy",
          async {
            let result = await main.buyInsurance(1000);
            await isOk(result)
          }
        ),
        test("cannot buy zero coverage policy",
          async {
            let result = await main.buyInsurance(0);
            switch (result) {
              case (#err(#InvalidAmount)) true;
              case _ false;
            }
          }
        )
      ]),

      suite("Flood Data", [
        test("can get flood level",
          async {
            let level = await main.getCurrentFloodLevel();
            await equals(T.nat(1000), level) // Using mock value
          }
        )
      ])
    ]);

    if (runner.failures.size() > 0) {
      "Tests failed: " # Nat.toText(runner.failures.size())
    } else {
      "All tests passed!"
    }
  };
};