require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-solhint");
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.18",
  networks: {
    sepolia: {
      url: "https://rpc.ankr.com/eth_sepolia", 
      accounts: [process.env.SEPOLIA_PRIVATE_KEY]
    }
  }
};