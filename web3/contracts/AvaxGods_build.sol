// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

/**
 * @author Obanla Adeniyi (niy42)
 * @title AvaxGods
 * @notice This contract manages the tokens and battle logic for the AvaxGods game.
 */

contract AvaxGods_build is ERC1155, ERC1155Supply, Ownable {
    string internal baseURI; // URI for ERC1155 metadata
    uint256 private immutable MAX_ATTACK_DEFEND_STRENGTH = 10;
    uint256 internal totalTokenMinted; //total tokenminted

    struct Player {
        address player;
        string playerName;
        uint256 playerHealth;
        uint256 playerMana;
        bool inBattle;
    }

    struct PlayerToken {
        string playerName;
        uint256 id;
        uint256 attackStrength;
        uint256 defenseStrength;
    }

    struct Battle {
        BattleStatus battleStatus;
        string battleName;
        address[2] players;
        uint8[2] move;
        address winner;
        bytes32 battleHash;
    }

    enum BattleStatus {
        PENDING,
        STARTED,
        END
    }

    Player[] internal players;
    Battle[] internal battles;
    PlayerToken[] internal playersToken;

    mapping(address => uint256) public playerInfo;
    mapping(address => uint256) public playerTokenInfo;
    mapping(string => uint256) public battleInfo;
    mapping(address => Player) public _playerInfo;
    mapping(string => Battle) public _battleInfo;
    mapping(address => PlayerToken) public _playerTokenInfo;

    event NewPlayer(address indexed player, string playerName);
    event NewPlayerToken(
        address indexed owner,
        uint256 id,
        uint256 attackStrength,
        uint256 defenseStrength
    );
    event NewBattle(string battleName, address player1, address player2);
    event BattleMove(string battleName, bool isFirstMove);
    event BattleEnded(string battleName, address loser, address winner);
    event RoundEnded(address[2] damagedPlayers);

    constructor(
        string memory metadataURI
    ) ERC1155(metadataURI) Ownable(msg.sender) {
        baseURI = metadataURI;
        initialize();
    }

    function registerPlayer(
        string memory _playerName,
        string memory _playerToken
    ) public {
        require(!isPlayer(msg.sender), "Player is already registered!");

        uint256 _id = players.length;
        Player[] storage _p = players; // modified players array to be used across functions
        _p.push(
            Player({
                playerName: _playerName,
                player: msg.sender,
                playerHealth: 35,
                playerMana: 20,
                inBattle: false
            })
        );
        playerInfo[msg.sender] = _id;

        createRandomPlayerToken(_playerToken);
        _getPlayerName(msg.sender);

        emit NewPlayer(msg.sender, _playerName);
    }

    function createPlayerToken(
        string memory _playerToken
    ) public returns (PlayerToken memory) {
        //
        uint256 randAttack = _createRandomNumber(
            MAX_ATTACK_DEFEND_STRENGTH,
            msg.sender
        );
        uint256 randDefend = MAX_ATTACK_DEFEND_STRENGTH - randAttack;

        uint8 randId = uint8(
            uint256(keccak256(abi.encodePacked(msg.sender, block.timestamp))) %
                100
        );
        randId %= 6;

        if (randId == 0) {
            randId++;
        }

        PlayerToken memory newPlayerToken = PlayerToken({
            id: randId,
            playerName: _playerToken,
            attackStrength: randAttack,
            defenseStrength: randDefend
        });

        _mint(msg.sender, randId, 1, "0x0"); // function to mint tokens inherited from ERC1155Supply
        totalTokenMinted++;

        emit NewPlayerToken(msg.sender, randId, randAttack, randDefend);
        return newPlayerToken;
    }

    function updateBattle(string memory _name, Battle memory _battle) public {
        require(isBattle(_name) && isPlayer(msg.sender), "");

        battles[battleInfo[_name]] = _battle;
    }

    function createBattle(
        string memory _name
    ) external returns (Battle memory _battle) {
        require(isPlayer(msg.sender), "Register player!");
        require(!getPlayer(msg.sender).inBattle, "Player already in battle");
        bytes32 _battleHash = keccak256(abi.encode(_name));
        _battle = Battle({
            battleName: _name,
            battleStatus: BattleStatus.PENDING,
            battleHash: _battleHash,
            players: [msg.sender, address(0)],
            move: [0, 0],
            winner: address(0)
        });

        uint256 _id = battles.length;
        battleInfo[_name] = _id;
        battles.push(_battle);

        return _battle;
    }

    function joinBattle(string memory _name) public {
        Battle memory _battle = getBattle(_name);
        require(isPlayer(msg.sender), "Please register player!");
        require(!getPlayer(msg.sender).inBattle, "You are in another battle!");
        require(
            _battle.battleStatus == BattleStatus.PENDING &&
                _battle.players[0] != msg.sender,
            ""
        );

        _battle.battleStatus = BattleStatus.STARTED;
        _battle.players[1] = msg.sender;
        updateBattle(_name, _battle);

        players[playerInfo[_battle.players[0]]].inBattle = true;
        players[playerInfo[_battle.players[1]]].inBattle = true;
    }

    function isPlayer(address _player) public view returns (bool) {
        return playerInfo[_player] != 0;
    }

    function getPlayer(address _player) public view returns (Player memory) {
        return players[playerInfo[_player]];
    }

    function getPlayerToken(
        address _player
    ) public view returns (PlayerToken memory) {
        return playersToken[playerTokenInfo[_player]];
    }

    function isBattle(string memory _name) public view returns (bool) {
        return battleInfo[_name] != 0;
    }

    function getBattle(
        string memory _name
    ) public view returns (Battle memory) {
        return battles[battleInfo[_name]];
    }

    function getAllBattles() public view returns (Battle[] memory) {
        return battles;
    }

    function getAllPlayers() public view returns (Player[] memory) {
        return players;
    }

    function getBattleMoves(
        string memory _name
    ) public view returns (uint256 P1, uint256 P2) {
        Battle memory _battle = getBattle(_name);

        P1 = _battle.move[0];
        P2 = _battle.move[1];

        return (P1, P2);
    }

    function getPlayerName() public view returns (string memory) {
        return _playerInfo[msg.sender].playerName;
    }

    function _getPlayerName(address _player) internal returns (string memory) {
        // address to Player mapping
        _playerInfo[_player] = Player({
            playerName: players[playerInfo[_player]].playerName,
            playerHealth: players[playerInfo[_player]].playerHealth,
            playerMana: players[playerInfo[_player]].playerMana,
            inBattle: false,
            player: _player
        });

        Player memory _p = _playerInfo[msg.sender];
        return _p.playerName;
    }

    function getTotalSupply() external view returns (uint256) {
        return totalTokenMinted;
    }

    function _createRandomNumber(
        uint256 _max,
        address _player
    ) internal view returns (uint256 randNum) {
        //generates a random number
        randNum =
            uint256(keccak256(abi.encodePacked(_player, block.number))) %
            100;
        randNum %= _max;

        if (randNum == 0) {
            randNum = _max / 2;
        }
    }

    // initializing each array with an empty struct
    function initialize() internal {
        players.push(
            Player({
                playerName: "",
                player: address(0),
                playerHealth: 0,
                playerMana: 0,
                inBattle: false
            })
        );
        battles.push(
            Battle({
                battleStatus: BattleStatus.PENDING,
                battleName: "",
                battleHash: bytes32(0),
                players: [address(0), address(0)],
                move: [0, 0],
                winner: address(0)
            })
        );
        playersToken.push(PlayerToken("", 0, 0, 0));
    }

    function setURI(string memory newuri) internal {
        _setURI(newuri);
    }

    function createRandomPlayerToken(string memory _playerToken) internal {
        require(!getPlayer(msg.sender).inBattle, "Player already in battle");
        require(isPlayer(msg.sender), "Player doesn't exist!");

        createPlayerToken(_playerToken);
    }

    function registerPlayerMove(
        uint8 _player,
        string memory _name,
        uint8 choice
    ) internal {
        require(choice == 1 || choice == 2, "Choice should be 1 or 2");
        require(
            choice == 1 ? getPlayer(msg.sender).playerMana >= 4 : true,
            "Mana insufficient!"
        );

        battles[battleInfo[_name]].move[_player] = choice;
    }

    function attackOrDefense(string memory _battleName, uint8 choice) internal {
        Battle memory _battle = getBattle(_battleName);
        require(
            _battle.battleStatus == BattleStatus.STARTED,
            "Battle not yet started!"
        );
        require(_battle.battleStatus != BattleStatus.END, "battle has ended");
        require(
            _battle.players[0] == msg.sender ||
                _battle.players[1] == msg.sender,
            "You are not in this battle!"
        );
        require(
            _battle.move[_battle.players[0] == msg.sender ? 0 : 1] == 0,
            "You have already made a move!"
        );

        registerPlayerMove(
            _battle.players[0] == msg.sender ? 0 : 1,
            _battleName,
            choice
        );

        uint8 _movesLeft = 2 -
            (_battle.move[0] == 0 ? 0 : 1) -
            (_battle.move[1] == 0 ? 0 : 1);

        emit BattleMove(_battleName, _movesLeft == 1 ? true : false);

        if (_movesLeft == 0) {
            _awaitBattleResult(_battleName);
        }
    }

    function _awaitBattleResult(string memory _battleName) internal {
        Battle memory _battle = getBattle(_battleName);
        require(
            msg.sender == _battle.players[0] ||
                msg.sender == _battle.players[1],
            "You are not in this battle!"
        );
        require(
            _battle.move[0] != 0 && _battle.move[1] != 0,
            "Player still need to make a move!"
        );

        _resolveBattle(_battleName);
    }

    struct P {
        uint256 index;
        uint256 attack;
        uint256 defense;
        uint256 health;
        uint256 mana;
        uint8 move;
    }

    function _resolveBattle(string memory _name) internal {
        Battle memory _battle = getBattle(_name);
        P memory p1 = P({
            index: playerInfo[_battle.players[0]],
            attack: getPlayerToken(_battle.players[0]).attackStrength,
            defense: getPlayerToken(_battle.players[0]).defenseStrength,
            move: getBattle(_name).move[0],
            health: getPlayer(_battle.players[0]).playerHealth,
            mana: getPlayer(_battle.players[0]).playerMana
        });

        P memory p2 = P({
            index: playerInfo[_battle.players[1]],
            attack: getPlayerToken(_battle.players[1]).attackStrength,
            defense: getPlayerToken(_battle.players[1]).defenseStrength,
            move: getBattle(_name).move[1],
            health: getPlayer(_battle.players[1]).playerHealth,
            mana: getPlayer(_battle.players[1]).playerMana
        });

        address[2] memory _damagedPlayers = [address(0), address(0)];

        if (p1.move == 1 && p2.move == 1) {
            if (p1.attack >= p2.health) {
                _endBattle(_battle.players[0], _battle);
            } else if (p1.health <= p2.attack) {
                _endBattle(_battle.players[1], _battle);
            } else {
                players[p1.index].playerHealth -= p2.attack;
                players[p2.index].playerHealth -= p1.attack;

                players[p1.index].playerMana -= 3;
                players[p2.index].playerMana -= 3;

                //or
                //players[playerInfo[battles[battleInfo[_name]].players[0]]].playerMana -= 3;
                //players[playerInfo[battles[battleInfo[_name]].players[1]]].playerMana -= 3;

                _damagedPlayers = _battle.players; // both players health damaged
            }
        } else if (p1.move == 1 && p2.move == 2) {
            if (p1.attack >= (p2.defense + p2.health)) {
                _endBattle(_battle.players[1], _battle);
            } else {
                uint256 _p2healthAfterAttack;
                if (p2.defense > p1.attack) {
                    _p2healthAfterAttack = p2.health;
                } else {
                    _p2healthAfterAttack = (p2.health + p2.defense) - p1.attack;
                    _damagedPlayers[0] = _battle.players[1]; // player 2 damaged

                    players[p2.index].playerHealth = _p2healthAfterAttack;
                }

                players[p1.index].playerMana -= 3;
                players[p2.index].playerMana += 3;
            }
        } else if (p1.move == 2 && p2.move == 1) {
            if ((p1.defense + p1.health) <= p2.attack) {
                _endBattle(_battle.players[0], _battle);
            } else {
                uint256 _p1healthAfterAttack;
                if (p1.defense > p2.attack) {
                    _p1healthAfterAttack = p1.health;
                } else {
                    _p1healthAfterAttack = (p1.defense + p1.health) - p1.attack;
                    _damagedPlayers[0] = _battle.players[0]; // player 1 damaged

                    players[p1.index].playerHealth = _p1healthAfterAttack;
                }

                players[p1.index].playerMana += 3;
                players[p2.index].playerMana -= 3;
            }
        } else if (p1.move == 2 && p2.move == 2) {
            players[p1.index].playerMana += 3;
            players[p2.index].playerMana += 3;
        }

        // emit RoundEnded
        emit RoundEnded(_damagedPlayers);

        // reset player move
        _battle.move[0] = 0;
        _battle.move[1] = 0;

        // update finished battle
        updateBattle(_battle.battleName, _battle);

        // update player 1 attack and defense strength
        playersToken[playerTokenInfo[_battle.players[0]]]
            .attackStrength = _createRandomNumber(
            MAX_ATTACK_DEFEND_STRENGTH,
            _battle.players[0]
        );
        playersToken[playerTokenInfo[_battle.players[0]]].defenseStrength =
            MAX_ATTACK_DEFEND_STRENGTH -
            playersToken[playerTokenInfo[_battle.players[0]]].attackStrength;

        // update player 2 attack and defense strength
        playersToken[playerTokenInfo[_battle.players[1]]]
            .attackStrength = _createRandomNumber(
            MAX_ATTACK_DEFEND_STRENGTH,
            _battle.players[1]
        );
        playersToken[playerTokenInfo[_battle.players[1]]].defenseStrength =
            MAX_ATTACK_DEFEND_STRENGTH -
            playersToken[playerTokenInfo[_battle.players[1]]].attackStrength;
    }

    function quitBattle(string memory _name) public {
        Battle memory _battle = getBattle(_name);
        require(
            _battle.players[0] == msg.sender ||
                _battle.players[1] == msg.sender,
            "You are not in this battle!"
        );

        _battle.players[0] == msg.sender
            ? _endBattle(_battle.players[1], _battle)
            : _endBattle(_battle.players[0], _battle);
    }

    /*struct Px {
        uint256 health;
        uint256 mana;
        uint8 move;
        uint256 index;
        uint256 attack;
        uint256 defense;
    }*/

    function _endBattle(address _player, Battle memory _battle) internal {
        require(_battle.battleStatus != BattleStatus.END, "Battle has ended!");

        _battle.winner = _player;
        address _battleLoser = _player == _battle.players[0]
            ? _battle.players[1]
            : _battle.players[0];
        updateBattle(_battle.battleName, _battle);

        Player memory p1 = getPlayer(
            battles[battleInfo[_battle.battleName]].players[0]
        );
        p1.playerHealth = 35;
        p1.playerMana = 25;
        p1.inBattle = false;

        Player memory p2 = getPlayer(_battle.players[1]);
        p2.playerHealth = 35;
        p2.playerMana = 25;
        p2.inBattle = false;

        emit BattleEnded(_battle.battleName, _player, _battleLoser);
    }

    function tokenMetadata(uint256 _int) public view returns (string memory) {
        return
            string(
                abi.encodePacked(baseURI, "/", _uintToString(_int), ".json")
            );
    }
    // function to convert integer to a string in Solidity
    // bytes is dynamic byte array used in performing low-level operations
    /// @param _int: number to be passed
    function _uintToString(uint _int) public pure returns (bytes memory) {
        if (_int == 0) {
            return "0";
        }

        uint256 len;
        if (_int != 0) {
            len++;
            _int / 10;
        }

        bytes memory bstr = new bytes(len);
        uint256 k = len;
        if (_int != 0) {
            k -= 1;
            uint8 temp = uint8(48 + (_int - (_int / 10) * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _int / 10;
        }

        return bstr;
    }

    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal virtual override(ERC1155, ERC1155Supply) {
        //
    }
}
