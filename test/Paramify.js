const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Insuracle", function () {
describe("Paramify", function () {
  let Paramify, paramify, MockPriceFeed, mockPriceFeed, owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    console.log("Deployer address:", owner.address);

    // Deploy mock price feed
    console.log("Attempting to get MockV3Aggregator factory...");
    try {
      MockPriceFeed = await ethers.getContractFactory("MockV3Aggregator");
      console.log("MockV3Aggregator factory obtained:", !!MockPriceFeed);
      console.log("Deploying MockV3Aggregator with args: decimals=8, initialAnswer=2000e8");
      mockPriceFeed = await MockPriceFeed.deploy(8, 2000e8);
      const deployTx = await mockPriceFeed.deploymentTransaction();
      console.log("MockV3Aggregator deployment transaction sent:", deployTx ? deployTx.hash : "N/A");
      await mockPriceFeed.waitForDeployment();
      const mockAddress = await mockPriceFeed.getAddress();
      console.log("MockV3Aggregator deployed at:", mockAddress);
      // Verify deployment
      const decimals = await mockPriceFeed.decimals();
      console.log("MockV3Aggregator decimals:", decimals.toString());
    } catch (error) {
      console.error("Error deploying MockV3Aggregator:", error.message);
      throw error;
    }

    // Deploy Paramify
    const priceFeedAddress = await mockPriceFeed.getAddress();
    console.log("Deploying Paramify with price feed:", priceFeedAddress);
    try {
      Paramify = await ethers.getContractFactory("Paramify");
      console.log("Paramify factory obtained:", !!Paramify);
      paramify = await Paramify.deploy(priceFeedAddress);
      const deployTx = await paramify.deploymentTransaction();
      console.log("Paramify deployment transaction sent:", deployTx ? deployTx.hash : "N/A");
      await paramify.waitForDeployment();
      console.log("Paramify deployed at:", await paramify.getAddress());
    } catch (error) {
      console.error("Error deploying Paramify:", error.message);
      if (error.transaction) {
        console.error("Transaction data:", error.transaction);
        const txResponse = await ethers.provider.getTransaction(error.transaction.hash);
        console.error("Transaction response:", txResponse);
      }
      throw error;
    }
  });

  it("should assign roles correctly", async function () {
    expect(await paramify.hasRole(await paramify.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
    expect(await paramify.hasRole(await paramify.ORACLE_UPDATER_ROLE(), owner.address)).to.be.true;
    expect(await paramify.hasRole(await paramify.INSURANCE_ADMIN_ROLE(), owner.address)).to.be.true;
  });

  it("should fetch latest price", async function () {
    const price = await paramify.getLatestPrice();
    expect(price).to.equal(2000e8);
  });
});
