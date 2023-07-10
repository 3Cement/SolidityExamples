// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract NFTSwap is Ownable {
  uint256 public currentIndex;

  struct TokenOffer {
    address sender; 
    address recipient;
    address tokenContractA;
    address tokenContractB;
    uint256 tokenIdA;
    uint256 tokenIdB;
    bool accepted;
  }

  mapping(uint256 => TokenOffer) public offers;

  function createOffer(address _recipient, address _tokenContractA, address _tokenContractB, uint256 _tokenIdA, uint256 _tokenIdB) external {
    offers[currentIndex] = TokenOffer(
      msg.sender, 
      _recipient, 
      _tokenContractA,
      _tokenContractB,
      _tokenIdA,
      _tokenIdB,
      false
    );

    currentIndex += 1;
  }

  function accept(uint256 _offerId) external {
    TokenOffer memory offer = offers[_offerId];
    require(msg.sender == offer.recipient, "not authorized");
    require(offer.accepted == false, "offer already accepted");

    IERC721 tokenA = IERC721(offer.tokenContractA);
    IERC721 tokenB = IERC721(offer.tokenContractB);

    tokenA.transferFrom(offer.sender, offer.recipient, offer.tokenIdA);
    tokenB.transferFrom(offer.recipient, offer.sender, offer.tokenIdB);

    offers[_offerId].accepted = true;
  }
}