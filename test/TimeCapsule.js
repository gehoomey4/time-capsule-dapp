const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("TimeCapsule", function () {
    async function deployTimeCapsuleFixture() {
        const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
        const ONE_GWEI = 1_000_000_000;

        const lockedAmount = ONE_GWEI;
        const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

        const [owner, otherAccount] = await ethers.getSigners();

        const TimeCapsule = await ethers.getContractFactory("TimeCapsule");
        const timeCapsule = await TimeCapsule.deploy();

        return { timeCapsule, unlockTime, lockedAmount, owner, otherAccount };
    }

    describe("Locking", function () {
        it("Should set the right unlockTime and amount", async function () {
            const { timeCapsule, unlockTime, lockedAmount, owner } = await loadFixture(deployTimeCapsuleFixture);
            const duration = unlockTime - await time.latest();

            await expect(timeCapsule.lock(duration, { value: lockedAmount }))
                .to.emit(timeCapsule, "Locked")
                .withArgs(owner.address, lockedAmount, anyValue);

            const lock = await timeCapsule.getLock(owner.address);
            expect(lock[0]).to.equal(lockedAmount);
            expect(lock[1]).to.be.closeTo(unlockTime, 5);
        });

        it("Should fail if amount is 0", async function () {
            const { timeCapsule } = await loadFixture(deployTimeCapsuleFixture);
            await expect(timeCapsule.lock(100, { value: 0 })).to.be.revertedWith("Amount must be greater than 0");
        });

        it("Should fail if already locked", async function () {
            const { timeCapsule, lockedAmount } = await loadFixture(deployTimeCapsuleFixture);

            await timeCapsule.lock(100, { value: lockedAmount });

            await expect(timeCapsule.lock(100, { value: lockedAmount })).to.be.revertedWith(
                "Existing lock found. Withdraw first."
            );
        });
    });

    describe("Withdrawals", function () {
        describe("Validations", function () {
            it("Should revert with the right error if called too soon", async function () {
                const { timeCapsule, lockedAmount } = await loadFixture(deployTimeCapsuleFixture);

                await timeCapsule.lock(3600, { value: lockedAmount });

                await expect(timeCapsule.withdraw()).to.be.revertedWith(
                    "Lock period not yet expired"
                );
            });

            it("Should revert with the right error if no funds locked", async function () {
                const { timeCapsule } = await loadFixture(deployTimeCapsuleFixture);
                await expect(timeCapsule.withdraw()).to.be.revertedWith(
                    "No funds locked"
                );
            });

            it("Should not revert if called after the unlock time", async function () {
                const { timeCapsule, lockedAmount } = await loadFixture(deployTimeCapsuleFixture);

                await timeCapsule.lock(3600, { value: lockedAmount });
                await time.increaseTo((await time.latest()) + 3600);

                await expect(timeCapsule.withdraw()).not.to.be.reverted;
            });
        });

        describe("Events", function () {
            it("Should emit an event on withdrawal", async function () {
                const { timeCapsule, lockedAmount, owner } = await loadFixture(deployTimeCapsuleFixture);

                await timeCapsule.lock(3600, { value: lockedAmount });
                await time.increaseTo((await time.latest()) + 3600);

                await expect(timeCapsule.withdraw())
                    .to.emit(timeCapsule, "Withdrawal")
                    .withArgs(owner.address, lockedAmount);
            });
        });

        describe("Transfers", function () {
            it("Should transfer the funds to the owner", async function () {
                const { timeCapsule, lockedAmount, owner } = await loadFixture(deployTimeCapsuleFixture);

                await timeCapsule.lock(3600, { value: lockedAmount });
                await time.increaseTo((await time.latest()) + 3600);

                await expect(timeCapsule.withdraw()).to.changeEtherBalances(
                    [owner, timeCapsule],
                    [lockedAmount, -lockedAmount]
                );
            });
        });
    });
});
