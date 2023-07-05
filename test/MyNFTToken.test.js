const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("MyNFTToken", () => {
    describe("basic info about token/smart contract", () => {
        it("terurns collection name", async () => {
            const [minter] = await ethers.getSigners();
            const MyNFTToken = await ethers.getContractFactory("MyNFTToken");
            const nft = await MyNFTToken.connect(minter).deploy()
            const name = await nft.name();
            console.log({ name })
            expect(name).to.eq("MyNFTToken")
        })
    })

    describe("safeMint()", () => {
        it("mints new token", async () => {
            const [minter] = await ethers.getSigners();
            const MyNFTToken = await ethers.getContractFactory("MyNFTToken");
            const nft = await MyNFTToken.connect(minter).deploy()

            await nft.connect(minter).safeMint(minter.address);

            const newTokenOwner = await nft.ownerOf(0);
            expect(newTokenOwner).to.eq(minter.address)
        })

        it("reverts when hacker attempts to mint", async () => {
            const [minter, hacker] = await ethers.getSigners();
            const MyNFTToken = await ethers.getContractFactory("MyNFTToken");
            const nft = await MyNFTToken.connect(minter).deploy()

            await expect(
                nft.connect(hacker).safeMint(hacker.address)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        })
    })
})