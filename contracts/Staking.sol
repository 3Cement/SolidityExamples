// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Staking is Ownable {
    IERC20 public token;
    uint256 public positionIndex;
    mapping(uint256 => Position) public positions;

    struct Position {
        uint256 amount;
        uint256 createdAt;
        address createdBy;
        bool claimed;
    }

    function setSupportedToken(address _addr) public onlyOwner {
        token = IERC20(_addr);
    }

    function stake(uint256 _amount) external {
        require(_amount > 0, "amount cannot be 0");

        token.transferFrom(msg.sender, address(this), _amount);
        positions[positionIndex] = Position(_amount, block.timestamp, msg.sender, false);
        ++positionIndex;
    }

    function calculateReward(uint256 _id) public view returns(uint256) {
        uint256 stakingTime = block.timestamp - positions[_id].createdAt;
        uint256 numberDays = stakingTime / (3600 * 24);
        uint256 reward = numberDays * 12;

        return reward;
    }

    function claim(uint256 _id) external {
        require(positions[_id].createdBy == msg.sender, "not authorized");
        require(positions[_id].claimed == false, "already claimed");

        positions[_id].claimed = true;
        token.transfer(msg.sender, positions[_id].amount + calculateReward(_id));
    }
}