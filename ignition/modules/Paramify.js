const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("ParamifyModule", (m) => {
  // Use explicit, safe defaults to avoid constructor reverts
  const mockDecimals = m.getParameter("mockDecimals", 8);
  // Avoid 2000e8 floating/scientific to prevent JS precision surprises
  // 2000 * 10^8 = 200000000000
  const mockInitialAnswer = m.getParameter("mockInitialAnswer", 200000000000);

  // Defensive validate via precondition-like deployment ordering:
  // While Ignition doesn't accept JS-side require() for constructor args,
  // we ensure we never pass 0/negative defaults by hardcoding a positive default above.
  const mockPriceFeed = m.contract("MockV3Aggregator", [mockDecimals, mockInitialAnswer]);

  // Deploy Paramify with the mock price feed address
  const paramify = m.contract("Paramify", [mockPriceFeed]);

  return { mockPriceFeed, paramify };
});
