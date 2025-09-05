// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract Paramify is AccessControl {
    bytes32 public constant ORACLE_UPDATER_ROLE = keccak256("ORACLE_UPDATER_ROLE");
    bytes32 public constant INSURANCE_ADMIN_ROLE = keccak256("INSURANCE_ADMIN_ROLE");

    AggregatorV3Interface public priceFeed;
    uint256 public insuranceAmount;
    bool public isInitialized;
    
    // Dynamic flood threshold with 12 feet default (12 * 100000000000 = 1200000000000)
    uint256 public floodThreshold = 1200000000000;
    address public owner;

    struct Policy {
        address customer;
        uint256 premium; // Paid in wei
        uint256 coverage; // Payout amount in wei
        bool active;
        bool paidOut;
    }

    mapping(address => Policy) public policies;

    // Events
    event InsurancePurchased(address indexed customer, uint256 premium, uint256 coverage);
    event PayoutTriggered(address indexed customer, uint256 amount);
    event ThresholdChanged(uint256 oldThreshold, uint256 newThreshold);
    event OracleAddressUpdated(address indexed oldOracle, address indexed newOracle);

    modifier onlyOwner() {
        require(msg.sender == owner, "Unauthorized: Not owner");
        _;
    }

    constructor(address _priceFeedAddress) {
        owner = msg.sender;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_UPDATER_ROLE, msg.sender);
        _grantRole(INSURANCE_ADMIN_ROLE, msg.sender);
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
        isInitialized = true;
    }

    function getLatestPrice() public view returns (int256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return price;
    }

    function setInsuranceAmount(uint256 _amount) public onlyRole(INSURANCE_ADMIN_ROLE) {
        insuranceAmount = _amount;
    }

    function setOracleAddress(address _oracleAddress) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_oracleAddress != address(0), "Invalid oracle address");
        address oldOracle = address(priceFeed);
        priceFeed = AggregatorV3Interface(_oracleAddress);
        emit OracleAddressUpdated(oldOracle, _oracleAddress);
    }

    // Threshold management functions
    function setThreshold(uint256 _newThreshold) external onlyOwner {
        require(_newThreshold > 0, "Threshold must be positive");
        require(_newThreshold <= 10000000000000, "Threshold too high"); // Max 100 feet
        uint256 oldThreshold = floodThreshold;
        floodThreshold = _newThreshold;
        emit ThresholdChanged(oldThreshold, _newThreshold);
    }

    function getCurrentThreshold() external view returns (uint256) {
        return floodThreshold;
    }

    function getThresholdInFeet() external view returns (uint256) {
        // Convert contract units back to feet (divide by 100000000000)
        return floodThreshold / 100000000000;
    }

    function buyInsurance(uint256 _coverage) external payable {
        require(msg.value > 0, "Premium must be greater than 0");
        require(_coverage > 0, "Coverage must be greater than 0");
        require(!policies[msg.sender].active, "Policy already active");

        uint256 requiredPremium = _coverage / 10;
        require(msg.value >= requiredPremium, "Insufficient premium");

        policies[msg.sender] = Policy({
            customer: msg.sender,
            premium: msg.value,
            coverage: _coverage,
            active: true,
            paidOut: false
        });

        emit InsurancePurchased(msg.sender, msg.value, _coverage);
    }

    function triggerPayout() external {
        Policy storage policy = policies[msg.sender];
        require(policy.active, "No active policy");
        require(!policy.paidOut, "Payout already issued");

        int256 floodLevel = getLatestPrice();
        require(uint256(floodLevel) >= floodThreshold, "Flood level below threshold");

        policy.paidOut = true;
        policy.active = false;

        (bool sent, ) = msg.sender.call{value: policy.coverage}("");
        require(sent, "Payout failed");

        emit PayoutTriggered(msg.sender, policy.coverage);
    }

    // Check if payout conditions are met
    function isPayoutEligible(address _customer) external view returns (bool) {
        Policy memory policy = policies[_customer];
        if (!policy.active || policy.paidOut) {
            return false;
        }
        int256 floodLevel = getLatestPrice();
        return uint256(floodLevel) >= floodThreshold;
    }

    function withdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        (bool sent, ) = msg.sender.call{value: balance}("");
        require(sent, "Withdrawal failed");
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // Transfer ownership
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        owner = newOwner;
    }

    receive() external payable {}
}
