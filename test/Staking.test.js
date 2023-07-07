const { ethers } = require("hardhat");
const { expect } = require("chai");

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

        })
    })
});