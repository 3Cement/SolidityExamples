// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

contract Lootbox is VRFConsumerBaseV2, Ownable {
  event RequestSent(uint256 requestId, uint32 numWords);
  event RequestFulfilled(uint256 requestId, uint256[] randomWords);

  struct RequestStatus {
      bool fulfilled; // whether the request has been successfully fulfilled
      bool exists; // whether a requestId exists
      uint256[] randomWords;
  }
  mapping(uint256 => RequestStatus) public s_requests; 
  VRFCoordinatorV2Interface COORDINATOR;
  uint64 s_subscriptionId;
  uint256[] public requestIds;
  uint256 public lastRequestId;
  bytes32 keyHash;
  uint32 callbackGasLimit = 100000;
  uint16 requestConfirmations = 3;
  uint32 numWords = 1;
    
  address [] public tokenAddrs; 
  uint256 [] public tokenIds; 

  struct Box {
    address buyer;
    bool claimed;
    uint256 randomNumber;
  }

  mapping(uint256 => Box) public purchasedBoxes;

  constructor(
      uint64 subscriptionId,
      bytes32 _keyHash,
      address _vrfCoordinator
  )
      VRFConsumerBaseV2(_vrfCoordinator)
  {
      COORDINATOR = VRFCoordinatorV2Interface(_vrfCoordinator);
      s_subscriptionId = subscriptionId;
      keyHash = _keyHash;
  }

  function addTokens(uint256 [] calldata ids, address [] calldata addrs) onlyOwner external {
    tokenIds = ids; 
    tokenAddrs = addrs;
  }

    function requestRandomWords() private returns (uint256 requestId) {
        // Will revert if subscription is not set and funded.
        requestId = COORDINATOR.requestRandomWords(
            keyHash,
            s_subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );
        s_requests[requestId] = RequestStatus({
            randomWords: new uint256[](0),
            exists: true,
            fulfilled: false
        });
        requestIds.push(requestId);
        lastRequestId = requestId;
        emit RequestSent(requestId, numWords);
        return requestId;
    }

  function fulfillRandomWords(
      uint256 _requestId,
      uint256[] memory _randomWords
  ) internal override {
      require(s_requests[_requestId].exists, "request not found");
      s_requests[_requestId].fulfilled = true;
      s_requests[_requestId].randomWords = _randomWords;
      emit RequestFulfilled(_requestId, _randomWords);
      purchasedBoxes[_requestId].randomNumber = _randomWords[0];
  }

  function getRequestStatus(
      uint256 _requestId
  ) public view returns (bool fulfilled, uint256[] memory randomWords) {
      require(s_requests[_requestId].exists, "request not found");
      RequestStatus memory request = s_requests[_requestId];
      return (request.fulfilled, request.randomWords);
  }

  function buyBox() external {
    uint256 id = requestRandomWords();
    purchasedBoxes[id] = Box(msg.sender, false, 0);
  }

  function claimBox(uint256 id) external returns(uint256) {
    require(purchasedBoxes[id].buyer == msg.sender, "unauthorized");
    (bool status,) = getRequestStatus(id);
    require(status, "not fullfiled");

    uint256 randomIndex = purchasedBoxes[id].randomNumber % tokenIds.length;

    IERC721 selectedNft = IERC721(tokenAddrs[randomIndex]);

    selectedNft.transferFrom(address(this), msg.sender, tokenIds[randomIndex]);
    
    if (randomIndex != tokenIds.length - 1) {
      tokenIds[randomIndex] = tokenIds[tokenIds.length - 1];
      tokenAddrs[randomIndex] = tokenAddrs[tokenAddrs.length - 1];
    }

    tokenIds.pop();
    tokenAddrs.pop();

    return randomIndex;
  }

  function tokenCount() public view returns(uint256) {
    return tokenIds.length;
  }
}