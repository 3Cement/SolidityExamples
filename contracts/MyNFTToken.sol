// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721Burnable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Counters } from "@openzeppelin/contracts/utils/Counters.sol";

contract MyNFTToken is ERC721, ERC721Burnable, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    constructor() ERC721("MyNFTToken", "MTK") {}

    function safeMint(address to) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }

    function random() external view returns (uint) {
        return uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp)));
    } 

    function withdrawEth() onlyOwner public {
        require(address(this).balance > 0);

        (bool sent, ) = msg.sender.call{value: address(this).balance}("");
        require(sent, "Failed to send Ether");
    }   
}