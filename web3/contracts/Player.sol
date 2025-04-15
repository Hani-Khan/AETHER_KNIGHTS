// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Game {
    struct PlayerInfo {
        address player;
        string playerName;
        uint256 playerHealth;
        uint256 playerMana;
        uint8 playerNum;
        bool isBattle;
    }

    PlayerInfo[] internal playersInfo;
    address[] internal playersAddress;

    mapping(address => uint256) public playerAddressIndex;
    mapping(uint256 => address) public playerAddress;
    mapping(uint256 => PlayerInfo) public playerInfo;

    function addPlayersAddress(address player) public {
        address[] storage updatedPlayers = playersAddress;
        updatedPlayers.push(player);
        uint256 _id = updatedPlayers.length;
        playerAddressIndex[player] = _id;
        playerAddress[playerAddressIndex[player]] = playersAddress[_id - 1];
    }

    function addPlayersInfo(
        string memory _playerName,
        uint8 _playerNum,
        uint256 _playerHealth,
        uint256 _playerMana,
        bool _isBattle,
        address _player
    ) public {
        PlayerInfo[] storage updatedPlayersInfo = playersInfo;
        updatedPlayersInfo.push(
            PlayerInfo({
                player: _player,
                playerName: _playerName,
                playerHealth: _playerHealth,
                playerMana: _playerMana,
                playerNum: _playerNum,
                isBattle: _isBattle
            })
        );
        uint256 _id = playersInfo.length;
        playerInfo[_id] = playersInfo[_id - 1];
    }

    function retrievePlayerInfo() public view returns (PlayerInfo[] memory) {
        return playersInfo;
    }

    function retrievePlayersAddress() public view returns (address[] memory) {
        return playersAddress;
    }

    function loop(address _player) public view returns (bool) {
        for (uint256 i = 0; i < playersAddress.length; i++) {
            if (playersAddress[i] == _player) {
                return true;
            }
        }
        return false;
    }

    function mappingPlayerAddressIndex(
        address _player
    ) public view returns (bool) {
        return playerAddressIndex[_player] != 0;
    }

    function mappingPlayerAddress(
        uint256 _index
    ) public view returns (address) {
        return playerAddress[_index];
    }
}
