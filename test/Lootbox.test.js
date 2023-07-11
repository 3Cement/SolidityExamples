const { expect } = require("chai");
const { ethers } = require("hardhat");

const getNFT = async (deployer) => {
  const MyToken = await ethers.getContractFactory("MyToken");
  const nft = await MyToken.connect(deployer).deploy()

  return nft;
}

describe("Lootbox", () => {
  let contract;
  let Lootbox;
  let hardhatVrfCoordinatorV2Mock;
  let admin, john, harry;

  beforeEach(async () => {
    [admin, john, harry] = await ethers.getSigners();

    let vrfCoordinatorV2Mock = await ethers.getContractFactory("VRFCoordinatorV2Mock");
    hardhatVrfCoordinatorV2Mock = await vrfCoordinatorV2Mock.deploy(0, 0);
    await hardhatVrfCoordinatorV2Mock
      .createSubscription();
    await hardhatVrfCoordinatorV2Mock
      .fundSubscription(1, ethers.utils.parseEther("7"));

    Lootbox = await ethers.getContractFactory("Lootbox");
    const keyHash = "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f";

    contract = await Lootbox
      .connect(admin)
      .deploy(1, keyHash, hardhatVrfCoordinatorV2Mock.address)

    await hardhatVrfCoordinatorV2Mock.addConsumer(
      1,
      contract.address
    )
  })

  describe("addTokens()", () => {
    it("allows add tokens", async () => {
      const nft1 = await getNFT(admin); 
      const nft2 = await getNFT(admin);
      await nft1.connect(admin).safeMint(admin.address);
      await nft2.connect(admin).safeMint(admin.address);

      await contract.connect(admin).addTokens(
        [0,0],
        [nft1.address, nft2.address]
      )
    })
  })

  describe("buyBox()", () => {
    it("request random number", async () => {
      await contract.connect(admin).buyBox()
      const requestId = await contract.lastRequestId()
      await expect(
        hardhatVrfCoordinatorV2Mock.fulfillRandomWords(requestId, contract.address)
      ).to.emit(hardhatVrfCoordinatorV2Mock, "RandomWordsFulfilled")

      const [status, words] = await contract.getRequestStatus(requestId);


      expect(words[0]).to.have.a.property('_isBigNumber');
      expect(status).eq(true);
    });
  })

  describe("claimBox()", () => {
    it("allows to claim random NFT", async () => {
      await contract.connect(john).buyBox();
      const nft1 = await getNFT(admin); 
      const nft2 = await getNFT(admin);

      const requestId = await contract.lastRequestId()
      await expect(
        hardhatVrfCoordinatorV2Mock.fulfillRandomWords(requestId, contract.address)
      ).to.emit(hardhatVrfCoordinatorV2Mock, "RandomWordsFulfilled")

      await contract.getRequestStatus(requestId);
      await nft1.connect(admin).safeMint(admin.address);
      await nft2.connect(admin).safeMint(admin.address);
      await nft1.connect(admin).transferFrom(admin.address, contract.address, 0);
      await nft2.connect(admin).transferFrom(admin.address, contract.address, 0);
      await contract.connect(admin).addTokens(
        [0,0],
        [nft1.address, nft2.address]
      )
      
      let tokenCount = await contract.tokenCount()
      expect(tokenCount).to.eq(2)
      await contract.connect(john).claimBox(requestId)

      const balance1 = await nft1.balanceOf(john.address);
      const balance2 = await nft2.balanceOf(john.address);
      expect(Number(balance1) + Number(balance2)).to.eq(1)

      tokenCount = await contract.tokenCount()
      expect(tokenCount).to.eq(1)
    })
  })
});