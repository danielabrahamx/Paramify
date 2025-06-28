// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract Paramify is AccessControl, ERC721 {
    using Strings for uint256;
    
    uint256 private _policyIdCounter;

    error PolicyNFTNotTransferable();

    bytes32 public constant ORACLE_UPDATER_ROLE = keccak256("ORACLE_UPDATER_ROLE");
    bytes32 public constant INSURANCE_ADMIN_ROLE = keccak256("INSURANCE_ADMIN_ROLE");

    AggregatorV3Interface public priceFeed;
    uint256 public insuranceAmount;
    bool public isInitialized;
    
    // Dynamic flood threshold with 12 feet default (12 * 100000000000 = 1200000000000)
    uint256 public floodThreshold = 1200000000000;
    address public owner;

    struct Policy {
        uint256 policyId;
        address policyholder;
        uint256 premium;
        uint256 coverage;
        uint256 purchaseTime;
        bool active;
        bool paidOut;
    }

    mapping(uint256 => Policy) public policies;
    mapping(address => uint256) public activePolicyId;

    // Events
    event InsurancePurchased(address indexed customer, uint256 premium, uint256 coverage, uint256 policyId);
    event PayoutTriggered(address indexed customer, uint256 amount, uint256 policyId);
    event ThresholdChanged(uint256 oldThreshold, uint256 newThreshold);
    event OracleAddressUpdated(address indexed oldOracle, address indexed newOracle);
    event PolicyCreated(uint256 indexed policyId, address indexed policyholder, uint256 coverage, uint256 premium);
    event PolicyStatusChanged(uint256 indexed policyId, bool active, bool paidOut);

    modifier onlyOwner() {
        require(msg.sender == owner, "Unauthorized: Not owner");
        _;
    }

    constructor(address _priceFeedAddress) ERC721("Paramify Insurance NFT", "PINFT") {
        owner = msg.sender;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_UPDATER_ROLE, msg.sender);
        _grantRole(INSURANCE_ADMIN_ROLE, msg.sender);
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
        isInitialized = true;
    }

    // Override _update to make NFTs soulbound (non-transferable)
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0)) but prevent transfers
        if (from != address(0)) {
            revert PolicyNFTNotTransferable();
        }
        
        return super._update(to, tokenId, auth);
    }

    // Override supportsInterface to resolve conflict between AccessControl and ERC721
    function supportsInterface(bytes4 interfaceId) public view override(AccessControl, ERC721) returns (bool) {
        return super.supportsInterface(interfaceId);
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
        
        // Check if the customer already has an active policy
        uint256 existingPolicyId = activePolicyId[msg.sender];
        if (existingPolicyId != 0) {
            require(!policies[existingPolicyId].active, "Policy already active");
        }

        uint256 requiredPremium = _coverage / 10;
        require(msg.value >= requiredPremium, "Insufficient premium");

        // Generate unique policy ID
        _policyIdCounter++;
        uint256 newPolicyId = _policyIdCounter;

        // Store the policy
        policies[newPolicyId] = Policy({
            policyId: newPolicyId,
            policyholder: msg.sender,
            premium: msg.value,
            coverage: _coverage,
            purchaseTime: block.timestamp,
            active: true,
            paidOut: false
        });

        // Update active policy mapping
        activePolicyId[msg.sender] = newPolicyId;

        // Mint NFT to the buyer
        _safeMint(msg.sender, newPolicyId);

        emit InsurancePurchased(msg.sender, msg.value, _coverage, newPolicyId);
        emit PolicyCreated(newPolicyId, msg.sender, _coverage, msg.value);
    }

    function triggerPayout() external {
        uint256 policyId = activePolicyId[msg.sender];
        require(policyId != 0, "No policy found");
        
        Policy storage policy = policies[policyId];
        require(policy.active, "No active policy");
        require(!policy.paidOut, "Payout already issued");

        int256 floodLevel = getLatestPrice();
        require(uint256(floodLevel) >= floodThreshold, "Flood level below threshold");

        policy.paidOut = true;
        policy.active = false;

        // Update metadata status
        emit PolicyStatusChanged(policyId, false, true);

        (bool sent, ) = msg.sender.call{value: policy.coverage}("");
        require(sent, "Payout failed");

        emit PayoutTriggered(msg.sender, policy.coverage, policyId);
    }

    // Check if payout conditions are met
    function isPayoutEligible(address _customer) external view returns (bool) {
        uint256 policyId = activePolicyId[_customer];
        if (policyId == 0) return false;
        
        Policy memory policy = policies[policyId];
        if (!policy.active || policy.paidOut) {
            return false;
        }
        int256 floodLevel = getLatestPrice();
        return uint256(floodLevel) >= floodThreshold;
    }

    // Generate NFT metadata
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(tokenId > 0 && tokenId <= _policyIdCounter, "Token does not exist");
        
        Policy memory policy = policies[tokenId];
        
        // Generate SVG image
        string memory svg = _generateSVG(tokenId, policy);
        
        // Generate metadata JSON
        string memory json = _generateMetadataJSON(tokenId, policy, svg);
        
        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function _generateSVG(uint256 tokenId, Policy memory policy) private pure returns (string memory) {
        string memory status = policy.paidOut ? "Paid Out" : (policy.active ? "Active" : "Inactive");
        string memory statusColor = policy.paidOut ? "#10b981" : (policy.active ? "#667eea" : "#ef4444");
        
        return string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 350">',
            '<rect width="350" height="350" fill="#1a1a2e"/>',
            '<text x="175" y="50" text-anchor="middle" fill="#eee" font-size="24" font-weight="bold">Policy #', tokenId.toString(), '</text>',
            '<rect x="25" y="80" width="300" height="240" rx="10" fill="#16213e" stroke="', statusColor, '" stroke-width="2"/>',
            _generateSVGTexts(policy, status),
            '</svg>'
        ));
    }

    function _generateSVGTexts(Policy memory policy, string memory status) private pure returns (string memory) {
        return string(abi.encodePacked(
            '<text x="175" y="120" text-anchor="middle" fill="#eee" font-size="16">Status: ', status, '</text>',
            '<text x="175" y="160" text-anchor="middle" fill="#eee" font-size="14">Coverage: ', (policy.coverage / 1e18).toString(), ' ETH</text>',
            '<text x="175" y="200" text-anchor="middle" fill="#eee" font-size="14">Premium: ', (policy.premium / 1e18).toString(), ' ETH</text>',
            '<text x="175" y="240" text-anchor="middle" fill="#eee" font-size="14">Holder: ', _truncateAddress(policy.policyholder), '</text>',
            '<text x="175" y="280" text-anchor="middle" fill="#aaa" font-size="12">Paramify Flood Insurance</text>'
        ));
    }

    function _generateMetadataJSON(uint256 tokenId, Policy memory policy, string memory svg) private pure returns (string memory) {
        string memory status = policy.paidOut ? "Paid Out" : (policy.active ? "Active" : "Inactive");
        
        return Base64.encode(bytes(string(abi.encodePacked(
            '{"name": "Paramify Policy #', tokenId.toString(), '",',
            '"description": "NFT representing a Paramify flood insurance policy",',
            '"image": "data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '",',
            '"attributes": [',
                _generateAttributes(tokenId, policy, status),
            ']}'
        ))));
    }

    function _generateAttributes(uint256 tokenId, Policy memory policy, string memory status) private pure returns (string memory) {
        return string(abi.encodePacked(
            '{"trait_type": "Policy ID", "value": "', tokenId.toString(), '"},',
            '{"trait_type": "Status", "value": "', status, '"},',
            '{"trait_type": "Coverage", "value": "', (policy.coverage / 1e18).toString(), ' ETH"},',
            '{"trait_type": "Premium", "value": "', (policy.premium / 1e18).toString(), ' ETH"},',
            '{"trait_type": "Policyholder", "value": "', Strings.toHexString(uint160(policy.policyholder), 20), '"}'
        ));
    }

    // Helper function to truncate address for display
    function _truncateAddress(address addr) private pure returns (string memory) {
        string memory addrStr = Strings.toHexString(uint160(addr), 20);
        bytes memory addrBytes = bytes(addrStr);
        bytes memory result = new bytes(10);
        
        // Copy first 6 characters (0x + 4)
        for (uint i = 0; i < 6; i++) {
            result[i] = addrBytes[i];
        }
        
        // Add ellipsis
        result[6] = '.';
        result[7] = '.';
        
        // Copy last 2 characters
        result[8] = addrBytes[40];
        result[9] = addrBytes[41];
        
        return string(result);
    }

    // Get all policies (for admin dashboard)
    function getAllPolicies() external view returns (Policy[] memory) {
        uint256 totalPolicies = _policyIdCounter;
        Policy[] memory allPolicies = new Policy[](totalPolicies);
        
        for (uint256 i = 1; i <= totalPolicies; i++) {
            allPolicies[i - 1] = policies[i];
        }
        
        return allPolicies;
    }

    // Get policy stats
    function getPolicyStats() external view returns (uint256 total, uint256 active, uint256 paidOut) {
        total = _policyIdCounter;
        
        for (uint256 i = 1; i <= total; i++) {
            if (policies[i].active) {
                active++;
            }
            if (policies[i].paidOut) {
                paidOut++;
            }
        }
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
