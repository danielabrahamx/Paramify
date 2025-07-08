const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("ParamifyModule", (m) => {
  // Deploy mock price feed first
  const mockDecimals = m.getParameter("mockDecimals", 8);
  const mockInitialAnswer = m.getParameter("mockInitialAnswer", 2000e8); // $2000 with 8 decimals
  
  const mockPriceFeed = m.contract("MockV3Aggregator", [mockDecimals, mockInitialAnswer]);
  
  // Deploy Paramify with mock price feed address
  const paramify = m.contract("Paramify", [mockPriceFeed]);
  
  return { mockPriceFeed, paramify };
});
