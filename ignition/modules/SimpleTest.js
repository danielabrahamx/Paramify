const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("SimpleTestModule", (m) => {
  const simpleTest = m.contract("SimpleTest");
  return { simpleTest };
});
