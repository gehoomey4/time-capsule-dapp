// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TimeCapsule {
    struct Lock {
        uint256 amount;
        uint256 unlockTime;
        address beneficiary;
    }

    // Mapping from user address to their lock details
    mapping(address => Lock) public locks;

    event Locked(address indexed sender, address indexed beneficiary, uint256 amount, uint256 unlockTime);
    event Withdrawal(address indexed beneficiary, uint256 amount);

    /**
     * @dev Locks the sent Native USDC (msg.value) for a specified duration with a beneficiary.
     * @param duration The time in seconds to lock the funds.
     * @param beneficiary The address that can withdraw the funds after unlock time.
     */
    function lock(uint256 duration, address beneficiary) public payable {
        require(msg.value > 0, "Amount must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");
        require(beneficiary != address(0), "Invalid beneficiary address");
        require(locks[msg.sender].amount == 0, "Existing lock found. Withdraw first.");

        uint256 unlockTime = block.timestamp + duration;

        locks[msg.sender] = Lock({
            amount: msg.value,
            unlockTime: unlockTime,
            beneficiary: beneficiary
        });

        emit Locked(msg.sender, beneficiary, msg.value, unlockTime);
    }

    /**
     * @dev Withdraws the locked Native USDC if the lock period has expired.
     * Only the beneficiary can withdraw.
     */
    function withdraw() public {
        Lock memory userLock = locks[msg.sender];
        require(userLock.amount > 0, "No funds locked");
        require(block.timestamp >= userLock.unlockTime, "Lock period not yet expired");
        require(msg.sender == userLock.beneficiary, "Only beneficiary can withdraw");

        // Reset lock before transfer to prevent re-entrancy
        delete locks[msg.sender];

        (bool success, ) = payable(userLock.beneficiary).call{value: userLock.amount}("");
        require(success, "Transfer failed");

        emit Withdrawal(userLock.beneficiary, userLock.amount);
    }

    /**
     * @dev Returns the lock details for a specific user.
     * @param user The address of the user.
     */
    function getLock(address user) public view returns (uint256 amount, uint256 unlockTime, address beneficiary) {
        return (locks[user].amount, locks[user].unlockTime, locks[user].beneficiary);
    }
}
