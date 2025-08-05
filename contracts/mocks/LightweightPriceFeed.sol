// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/*
  Minimal Chainlink-like price feed to satisfy AggregatorV3Interface usage in Paramify.
  - Tiny bytecode: stores a single answer and returns it via latestRoundData()
  - decimals() fixed to 8 by default (adjustable via constructor)
  - setAnswer allows admin to update the value

  This mimics only the functions Paramify actually uses:
    function latestRoundData() external view returns (uint80,int256,uint256,uint256,uint80);
    function decimals() external view returns (uint8);

  Initial answer should be passed using the same scale as decimals().
*/
contract LightweightPriceFeed {
    uint8 private _decimals;
    int256 private _answer;
    address public admin;

    constructor(uint8 decimals_, int256 initialAnswer) {
        _decimals = decimals_;
        _answer = initialAnswer;
        admin = msg.sender;
    }

    function decimals() external view returns (uint8) {
        return _decimals;
    }

    function setAnswer(int256 newAnswer) external {
        require(msg.sender == admin, "not admin");
        _answer = newAnswer;
    }

    // Return dummy round/ts values; Paramify ignores them and only uses price
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (0, _answer, block.timestamp, block.timestamp, 0);
    }
}
