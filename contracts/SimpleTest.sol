// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SimpleTest {
    uint256 public number;
    address public owner;
    
    constructor() {
        owner = msg.sender;
        number = 42;
    }
    
    function setNumber(uint256 _number) public {
        number = _number;
    }
    
    function getNumber() public view returns (uint256) {
        return number;
    }
}
