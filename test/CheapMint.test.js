const { ethers } = require("hardhat");
const { expect } = require("chai");

const generateVoucher = async (signer, receiver, amount, nonce) => {
  const ethersHash = ethers.utils.keccak256(ethers.utils.solidityPack(['address', 'uint256', 'uint256'], [receiver, amount, nonce]));
  const voucher = await signer.signMessage(ethers.utils.arrayify(ethersHash));
  
  return {
    receiver,
    amount, 
    nonce, 
    voucher
  }
}

let minter, buyer, voucherSigner, hacker, contract;

describe("CheapMint", function () {
  it("deploys new contract", async function () {
    const [minter] = await ethers.getSigners();
    const CheapMint = await ethers.getContractFactory("CheapMint");
    const nft = await CheapMint.connect(minter).deploy();
    const owner = await nft.owner();
    expect(minter.address).to.eq(owner);
  });

  describe("voucherMint()", () => {
    beforeEach(async () => {
      [minter, buyer, voucherSigner, hacker] = await ethers.getSigners();
      const CheapMint = await ethers.getContractFactory("CheapMint");
      contract = await CheapMint.connect(minter).deploy();
      await contract.connect(minter).setSigner(voucherSigner.address);
    })

    it("mints when valid voucher", async () => {
      const { voucher } = await generateVoucher(voucherSigner, buyer.address, 2, 1);
      await contract.connect(buyer).voucherMint(buyer.address, 2, 1, voucher);
      expect(await contract.ownerOf(0)).to.eq(buyer.address);
      expect(await contract.ownerOf(1)).to.eq(buyer.address);
    })

    it("reverts invalid vouchers", async () => {
      const { voucher } = await generateVoucher(hacker, buyer.address, 2, 1);
      await expect(
        contract.connect(buyer).voucherMint(buyer.address, 2, 1, voucher)
      ).to.be.revertedWith("voucher invalid");
    })

    it("reverts already used vouchers", async () => {
      const { voucher } = await generateVoucher(voucherSigner, buyer.address, 2, 1);
      await contract.connect(buyer).voucherMint(buyer.address, 2, 1, voucher);

      await expect(
        contract.connect(buyer).voucherMint(buyer.address, 2, 1, voucher)
      ).to.be.revertedWith("nonce was used before");      
    })
  })
});