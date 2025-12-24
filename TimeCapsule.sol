// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
contract TimeCapsule { struct Lock { uint256 amount; uint256 unlockTime; address sender; bool withdrawn; }

// List of locks for each user
mapping(address => Lock[]) public userLocks;
event Locked(address indexed sender, address indexed beneficiary, uint256 amount, uint256 unlockTime);
event Withdrawal(address indexed beneficiary, uint256 amount);
function lock(uint256 duration, address beneficiary) public payable {
    require(msg.value > 0, "Amount must be > 0");
    
    userLocks[beneficiary].push(Lock({
        amount: msg.value,
        unlockTime: block.timestamp + duration,
        sender: msg.sender,
        withdrawn: false
    }));
    emit Locked(msg.sender, beneficiary, msg.value, block.timestamp + duration);
}
function withdraw() public {
    uint256 totalPayout = 0;
    Lock[] storage locks = userLocks[msg.sender];
    for (uint256 i = 0; i < locks.length; i++) {
        if (!locks[i].withdrawn && block.timestamp >= locks[i].unlockTime) {
            totalPayout += locks[i].amount;
            locks[i].withdrawn = true;
        }
    }
    require(totalPayout > 0, "No unlocked funds found");
    payable(msg.sender).transfer(totalPayout);
    emit Withdrawal(msg.sender, totalPayout);
}
function getUserLocks(address user) public view returns (Lock[] memory) {
    return userLocks[user];
}
}
