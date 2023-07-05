const hre = require("hardhat");

async function main() {
  const MyNFTToken = await hre.ethers.getContractFactory("MyNFTToken");
  const token = await MyNFTToken.deploy();

  await token.deployed();

  console.log(`MyNFTToken deployed to ${token.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
