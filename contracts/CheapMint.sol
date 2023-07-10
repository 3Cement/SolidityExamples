// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { ERC721Burnable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Counters } from "@openzeppelin/contracts/utils/Counters.sol";

contract CheapMint is ERC721, ERC721Burnable, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    address private voucherSigner;

    mapping(uint256 => bool) public usedNonces;

    constructor() ERC721("MyToken", "MTK") {}

    function setSigner(address signer) external onlyOwner {
      voucherSigner = signer;
    }

    function safeMint(address to) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }

    function isVoucherValid(address receiver, uint256 amount, uint256 nonce, bytes memory signature) private view returns(bool) {
      address signedBy = ECDSA.recover(
        ECDSA.toEthSignedMessageHash(
          keccak256(abi.encodePacked(receiver, amount, nonce))
        ), 
        signature
      );
      
      return signedBy == voucherSigner; 
    }    

    function voucherMint(address receiver, uint256 amount, uint256 nonce, bytes memory signature) public {
        require(usedNonces[nonce] == false, "nonce was used before");
        require(
            isVoucherValid(receiver, amount, nonce, signature), 
            "voucher invalid"
        );
        usedNonces[nonce] = true;

        for(uint i = 0; i < amount; i++) {
          uint256 tokenId = _tokenIdCounter.current();
          _tokenIdCounter.increment();
          _safeMint(receiver, tokenId);
        }
    }
}