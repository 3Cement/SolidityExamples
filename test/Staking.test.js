const { ethers } = require("hardhat");
const { expect } = require("chai");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const getErc20 = async (deployer) => {
    const erc20_ = await ethers.getContractFactory("MyToken");
    const contract_ = await erc20_.connect(deployer).deploy();

    return contract_;
}


describe("Staking", () => {
    describe("stake()", () => {
        it("allows to add new position", async () => {
            const [admin, staker] = await ethers.getSigners();
            console.log('admin', admin)
            // admin.address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
            console.log('staker', staker)
            // staker.address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
            const Staking = await ethers.getContractFactory("Staking");
            const contract = await Staking.connect(admin).deploy();
            // console.log("contract", contract)
            const erc20 = await getErc20(admin);
            console.log("erc20", erc20)
            console.log("target", erc20.target)
            console.log("runner_address", erc20.runner.address)
            console.log("erc20_address", erc20.getAddress())
            // await contract.connect(admin).setSupportedToken(erc20.address);
            // await contract.connect(admin).setSupportedToken(erc20.getAddress());
            await contract.connect(admin).setSupportedToken(erc20.target);
            await erc20.connect(admin).transfer(staker.address, 1000);
            await erc20.connect(staker).increaseAllowance(contract.target, 1000);
            await contract.connect(staker).stake(1000);

            const position = await contract.positions(0);
            expect(position.amount).to.eq("1000");
            expect(position.createdBy).to.eq(staker.address);
        })

        it("reverts when no erc20 owned", async () => {
            const [admin, staker] = await ethers.getSigners();
            const Staking = await ethers.getContractFactory("Staking");
            const contract = await Staking.connect(admin).deploy();
            const erc20 = await getErc20(admin);
            await contract.connect(admin).setSupportedToken(erc20.target);

            await expect(
                contract.connect(staker).stake(1000)
            ).to.be.revertedWith("ERC20: insufficient allowance");
        })
    })

    describe("claim()", () => {
        it("allows to claim stakes after 30 days", async () => {
            const [admin, staker] = await ethers.getSigners();
            const Staking = await ethers.getContractFactory("Staking");
            const contract = await Staking.connect(admin).deploy();
            const erc20 = await getErc20(admin);
            await contract.connect(admin).setSupportedToken(erc20.target);
            await erc20.connect(admin).transfer(contract.target, 100000);
            await erc20.connect(admin).transfer(staker.address, 1000);
            await erc20.connect(staker).increaseAllowance(contract.target, 1000);
            await contract.connect(staker).stake(1000);
            await time.increase(3600 * 24 * 30);
            const reward = await contract.calculateReward(0);
            await contract.connect(staker).claim(0);
            const finalBalance = await erc20.balanceOf(staker.address);
            expect(finalBalance).to.eq(Number(reward) + 1000);

        })
    })
});