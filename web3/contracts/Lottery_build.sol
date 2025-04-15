// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

///// UPDATE IMPORTS TO V2.5 /////
import {IVRFCoordinatorV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/interfaces/IVRFCoordinatorV2Plus.sol";
import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
//import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @author Obanla Adeniyi (niy42)
 * @title Smart contract lottery
 * @notice This contract handles the logic for the LotteryGame.
 */

contract Lottery_build is VRFConsumerBaseV2Plus {
    uint32 internal subId;
    bytes32 internal keyHash;
    uint16 private constant minimumReqConfirmations = 3;
    uint32 internal constant callbackGasLimit = 100000;
    uint32 internal numWords = 2;
    uint256[] internal s_randomWords;

    uint256 public count; // returns total lottery count

    IVRFCoordinatorV2Plus internal immutable VRFCOORDINATOR;

    //Events
    event LotteryCreated(
        string lotteryName,
        address indexed lotteryOperator,
        uint256 lotteryOperatorCommission,
        uint256 maxTickets,
        uint256 ticketPrice,
        uint256 expiration
    );
    event TicketsBought(
        string lotteryName,
        address indexed player,
        uint256 tickets
    );
    event RequestLotteryWinnerSent(
        string lotteryName,
        uint256 s_requestID,
        uint256 numWords
    );
    event LotteryAmountClaimed(
        string lotteryName,
        address indexed lotteryWinner,
        uint256 indexed winnerAmount
    );
    event OperatorCommissionClaimed(
        string lotteryName,
        address indexed lotteryOperator,
        uint256 indexed operatorCommission
    );
    event LotteryWinner(address indexed winner);
    event RandomWordsFulfilled(uint256[] s_randomWords);

    struct Lottery {
        string lotteryName;
        address lotteryOperator;
        uint256 lotteryOperatorCommission;
        address lotteryWinner;
        address[] tickets;
        LotteryStatus lotteryStatus;
        uint256 maxTickets;
        uint256 ticketPrice;
        uint256 expiration;
        bytes32 lotteryHash;
    }

    struct LotteryReqStatus {
        string lotteryName;
        bool exist;
        uint256[] requestedSeed;
        bool fulfilled;
    }

    enum LotteryStatus {
        PENDING,
        STARTED,
        ENDED
    }

    Lottery[] internal lotteries;
    LotteryReqStatus[] internal lotteryreqs;

    mapping(string => uint256) public lotteryInfo;
    mapping(uint256 => uint256) public seedInfo;
    //mapping(uint256 => LotteryReqStatus) public lotteryreqInfo; //mapping integer to struct

    constructor(
        uint32 _subId,
        bytes32 _keyHash,
        address _vrfCoordinator
    ) VRFConsumerBaseV2Plus(_vrfCoordinator) {
        initialize();
        subId = _subId;
        keyHash = _keyHash;
        VRFCOORDINATOR = IVRFCoordinatorV2Plus(_vrfCoordinator);
    }

    modifier onlyOperator(string memory _name) {
        require(operator(_name), "Restricted to only operator!");
        _;
    }

    function createLottery(
        string memory _lotteryName,
        address _lotteryOperator,
        uint256 _lotteryOperatorCommission,
        uint256 _maxTickets,
        uint256 _ticketPrice,
        uint256 _expiration
    ) public onlyOwner {
        require(_expiration >= block.timestamp, "Lottery has expired!");
        require(
            _lotteryOperatorCommission % 5 == 0 &&
                _lotteryOperatorCommission > 0,
            "Operator commission must be a multiple of five and cannot be zero"
        );
        require(_ticketPrice != 0, "Ticket price cannot be zero!");
        require(_maxTickets > 0, "Max ticket must be greater than zero!");
        require(
            _lotteryOperator != address(0),
            "Lottery Operator cannot be invalid address"
        );

        bytes32 _lotteryHash = keccak256(abi.encode(_lotteryName));

        uint256 _id = lotteries.length;
        lotteries.push(
            Lottery(
                _lotteryName,
                _lotteryOperator,
                _lotteryOperatorCommission,
                address(0),
                new address[](0),
                LotteryStatus.STARTED,
                _maxTickets,
                _ticketPrice,
                _expiration,
                _lotteryHash
            )
        );

        lotteryInfo[_lotteryName] = _id;
        count++;

        emit LotteryCreated(
            _lotteryName,
            _lotteryOperator,
            _lotteryOperatorCommission,
            _maxTickets,
            _ticketPrice,
            _expiration
        );
    }

    function buyLotteryTicket(
        uint256 _numoftickets,
        string memory _name
    ) public payable {
        uint256 _ticketsAmount = msg.value;

        Lottery storage _lottery = lotteries[lotteryInfo[_name]]; // storage is used mainly for modification purposes
        Lottery memory _lotteryTemp = getLottery(_name); // generates temporary space to hold a structure with numerous variables
        require(_numoftickets > 0, "Ticket number must be greater than zero!");
        require(
            _ticketsAmount >= _lotteryTemp.ticketPrice * _ticketsAmount,
            ""
        );
        require(
            _numoftickets <= getRemainingTickets(_name),
            "Tickets must be greater than or equal to remaining tickets or lottery unavailable!"
        );
        require(
            block.timestamp < _lotteryTemp.expiration,
            "Lottery has expired!"
        );
        require(
            _lotteryTemp.lotteryStatus == LotteryStatus.STARTED,
            "Lottery has not started!"
        );

        for (uint256 i = 0; i < _numoftickets; i++) {
            _lottery.tickets.push(msg.sender);
        }

        emit TicketsBought(_name, msg.sender, _numoftickets);
    }

    function endLottery(
        string memory _name
    ) public onlyOperator(_name) returns (uint256 s_requestID) {
        address _lottery = getLottery(_name).lotteryWinner;
        require(_lottery == address(0), "Winner has been choosen!");
        require(
            getLottery(_name).expiration <= block.timestamp,
            "Lottery not expired yet!"
        );

        //lotteries[lotteryInfo[_name]].lotteryStatus = LotteryStatus.ENDED;
        getLottery(_name).lotteryStatus = LotteryStatus.ENDED;

        s_requestID = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest(
                keyHash,
                subId,
                minimumReqConfirmations,
                callbackGasLimit,
                numWords,
                VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: true})
                ) // new parameter
            )
        );

        LotteryReqStatus memory _seedReq = LotteryReqStatus({
            lotteryName: _name,
            fulfilled: false,
            exist: true,
            requestedSeed: new uint256[](0)
        });

        seedInfo[s_requestID] = lotteryreqs.length;
        lotteryreqs.push(_seedReq);

        emit RequestLotteryWinnerSent(_name, s_requestID, numWords);
        return s_requestID;
    }

    function claimLottery(string memory _name) public onlyOperator(_name) {
        require(
            getLottery(_name).lotteryWinner != address(0),
            "Lottery winner has not been selected!"
        );
        require(getLottery(_name).lotteryStatus == LotteryStatus.ENDED, "");
        require(
            block.timestamp > getLottery(_name).expiration,
            "Lottery has not expired yet!"
        );

        Lottery memory _lottery = getLottery(_name);
        uint256 vaultAmount = _lottery.tickets.length * _lottery.ticketPrice;
        uint256 operatorCommission = vaultAmount /
            (100 / getLottery(_name).lotteryOperatorCommission);
        uint256 winnerAmount = vaultAmount - operatorCommission;

        (bool lotteryWinner, ) = (_lottery.lotteryWinner).call{
            value: winnerAmount
        }("");
        (bool lotteryOperator, ) = (_lottery.lotteryOperator).call{
            value: operatorCommission
        }("");

        require(lotteryWinner, "Error: failed to send winner price!");
        require(lotteryOperator, "Error: failed to send operator commission!");

        emit LotteryAmountClaimed(_name, _lottery.lotteryWinner, winnerAmount);
        emit OperatorCommissionClaimed(
            _name,
            _lottery.lotteryOperator,
            operatorCommission
        );
    }

    function drawLotteryWinner(
        string memory _name
    ) public onlyOperator(_name) returns (address lotteryWinner) {
        Lottery memory _lottery = getLottery(_name);
        uint256 winnerIndex = s_randomWords[0] % _lottery.tickets.length;
        lotteryWinner = _lottery.tickets[winnerIndex];
        _lottery.lotteryWinner = lotteryWinner;

        emit LotteryWinner(lotteryWinner);
        return lotteryWinner;
    }

    function operator(string memory _name) public view returns (bool) {
        return
            payable(lotteries[lotteryInfo[_name]].lotteryOperator) ==
            payable(msg.sender);
    }

    function getRemainingTickets(
        string memory _name
    ) public view returns (uint256) {
        Lottery storage _lottery = lotteries[lotteryInfo[_name]];
        return (_lottery.maxTickets - _lottery.tickets.length);
    }

    function isLottery(string memory _lotteryName) public view returns (bool) {
        return lotteryInfo[_lotteryName] != 0;
    }

    function getAllLotteries() public view returns (Lottery[] memory) {
        return lotteries;
    }

    function lotteryLength() public view returns (uint256) {
        return lotteries.length;
    }

    function totalLotteries() public view returns (uint256) {
        return count;
    }

    function getLottery(
        string memory _lotteryName
    ) public view returns (Lottery memory) {
        return lotteries[lotteryInfo[_lotteryName]];
    }

    function getLotteryReqStatus(
        uint256 _srequestId
    ) public view returns (LotteryReqStatus memory) {
        return lotteryreqs[seedInfo[_srequestId]];
    }

    function initialize() internal {
        Lottery memory _lottery = Lottery({
            lotteryName: "",
            lotteryOperatorCommission: 0,
            lotteryOperator: address(0),
            lotteryHash: bytes32(0),
            tickets: new address[](0),
            maxTickets: 0,
            ticketPrice: 0,
            expiration: 0,
            lotteryStatus: LotteryStatus.PENDING,
            lotteryWinner: address(0)
        });

        lotteryreqs.push(LotteryReqStatus("", false, new uint256[](0), false));

        lotteries.push(_lottery);
    }

    // fulfill randomWords from external decentralized oracle network(chainlink)
    function fulfillRandomWords(
    uint256 /*requestId*/,
    uint256[] calldata randomWords
) internal virtual override(VRFConsumerBaseV2Plus) {
    // randomWords fulfilled
    s_randomWords = randomWords;
    emit RandomWordsFulfilled(s_randomWords);
}
    
    // function fulfillRandomWords(
    //     uint256 /*requestId*/,
    //     uint256[] memory randomWords
    // ) internal virtual override(VRFConsumerBaseV2Plus) {
    //     // randomWords fulfilled
    //     s_randomWords = randomWords;
    //     emit RandomWordsFulfilled(s_randomWords);
    // }
}
