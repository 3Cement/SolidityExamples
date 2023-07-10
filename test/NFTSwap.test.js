const { ethers } = require("hardhat");
const { expect } = require("chai");

const getNFT = async (deployer) => {
    const nft = await ethers.getContractFactory("MyNFTToken");
    const contract = await nft.connect(deployer).deploy();
    await contract.safeMint(deployer.address);

    return contract;
}

describe("NFTSwap", () => {
    describe("createOffer()", () => {
        it("allows to create new offer", async () => {
            const [admin, john, anna] = await ethers.getSigners();
            const NFTSwap = await ethers.getContractFactory("NFTSwap");
            const contract = await NFTSwap.connect(admin).deploy();

            const tokenA = await getNFT(john);
            const tokenB = await getNFT(anna);

            await contract.connect(john).createOffer(
                anna.address,
                tokenA.target,
                tokenB.target,
                1,
                1
            )

            const offer = await contract.offers(0);
            expect(offer.sender).to.eq(john.address)
            expect(offer.recipient).to.eq(anna.address)
            expect(offer.tokenContractA).to.eq(tokenA.target)
            expect(offer.tokenContractB).to.eq(tokenB.target)
            expect(offer.tokenIdA).to.eq(1)
            expect(offer.tokenIdB).to.eq(1)
        });
    });

    describe("accept()", () => {
        it("allows to accept offer by recipient", async () => {
            const [admin, john, anna] = await ethers.getSigners();
            const NFTSwap = await ethers.getContractFactory("NFTSwap");
            const contract = await NFTSwap.connect(admin).deploy();

            const tokenA = await getNFT(john);
            const tokenB = await getNFT(anna);

            await tokenA.connect(john).approve(contract.target, 0);
            await tokenB.connect(anna).approve(contract.target, 0);

            await contract.connect(john).createOffer(
                anna.address,
                tokenA.target,
                tokenB.target,
                0,
                0
            )

            let ownerA = await tokenA.ownerOf(0);
            expect(ownerA).to.eq(john.address);
            let ownerB = await tokenB.ownerOf(0);
            expect(ownerB).to.eq(anna.address);

            await contract.connect(anna).accept(0);

            ownerA = await tokenA.ownerOf(0);
            expect(ownerA).to.eq(anna.address);
            ownerB = await tokenB.ownerOf(0);
            expect(ownerB).to.eq(john.address);
        })
    })
});