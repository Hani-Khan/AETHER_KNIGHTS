import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../context';
import { PageHOC, CustomButton, Modal } from '../components';
import styles from '../styles';

const TradeCard = () => {
  const { contract, gameData, walletAddress, setShowAlert } = useGlobalContext();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showTradeRequestModal, setShowTradeRequestModal] = useState(false);
  const [currentTradeRequest, setCurrentTradeRequest] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [tradeEnabled, setTradeEnabled] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const navigate = useNavigate();

  // Fetch all players and their stats
  const fetchPlayers = async () => {
    if (!contract) return;
    try {
      const battles = await contract.getAllBattles();
      const activeBattles = battles.filter(b => b.battleStatus === 1);
      
      // Get current player's battle and opponent
      const currentBattle = activeBattles.find(battle => 
        battle.players.includes(walletAddress)
      );
      const opponent = currentBattle?.players.find(p => p !== walletAddress);

      // Get all players with trade enabled
      const allPlayers = await contract.getAllPlayers();
      const playerData = await Promise.all(
        allPlayers.map(async (player) => {
          try {
            if (player.playerAddress === walletAddress || player.playerAddress === opponent) {
              return null;
            }
            const token = await contract.getPlayerToken(player.playerAddress);
            return {
              address: player.playerAddress,
              name: player.playerName,
              attack: token.attackStrength.toNumber(),
              defense: token.defenseStrength.toNumber(),
              enableTrade: player.enableTrade
            };
          } catch (error) {
            return null;
          }
        })
      );

      setPlayers(playerData.filter(p => p !== null && p.enableTrade));
    } catch (error) {
      console.error("Failed to fetch players:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch incoming trade requests
  const fetchIncomingRequests = async () => {
    if (!contract || !walletAddress) return;
    
    try {
      // Since there's no direct way to get trade requests from the contract,
      // we'll use the contract events to simulate this functionality
      
      // Get trade events from contract (this is a simplified approach)
      const filter = contract.filters.TradeRequested(null, walletAddress);
      const events = await contract.queryFilter(filter);
      
      const requests = [];
      
      // Process each event to get the trade request details
      for (const event of events) {
        const fromAddress = event.args.from;
        
        try {
          const player = await contract.getPlayer(fromAddress);
          const token = await contract.getPlayerToken(fromAddress);
          const myToken = await contract.getPlayerToken(walletAddress);
          
          requests.push({
            from: {
              address: fromAddress,
              name: player.playerName,
              attack: token.attackStrength.toNumber(),
              defense: token.defenseStrength.toNumber()
            },
            to: {
              address: walletAddress,
              name: gameData.playerName || "You",
              attack: myToken.attackStrength.toNumber(),
              defense: myToken.defenseStrength.toNumber()
            }
          });
        } catch (error) {
          console.error("Error processing trade request:", error);
        }
      }
      
      setIncomingRequests(requests);
    } catch (error) {
      console.error("Failed to fetch incoming requests:", error);
    }
  };

  // Check if current player has trading enabled
  const checkTradeStatus = async () => {
    if (!contract || !walletAddress) return;
    
    try {
      const player = await contract.getPlayer(walletAddress);
      setTradeEnabled(player.enableTrade);
    } catch (error) {
      console.error("Failed to check trade status:", error);
    }
  };

  // Toggle trade functionality
  const [toggleLoading, setToggleLoading] = useState(false);

  const handleToggleTrade = async () => {
    if (!contract || toggleLoading) return;
    setToggleLoading(true);
    try {
      await contract.toggleTrade();
      setShowAlert({
        status: true,
        type: 'info',
        message: `Trading ${!tradeEnabled ? 'enabled' : 'disabled'}`
      });
      setTradeEnabled(!tradeEnabled);
    } catch (error) {
      console.error("Failed to toggle trade:", error);
    } finally {
      setToggleLoading(false);
    }
  };

  // Handle accepting a trade request
  const handleAcceptTrade = async (request) => {
    try {
      await contract.acceptTrade(request.from.address);
      setShowAlert({
        status: true,
        type: 'success',
        message: `Trade with ${request.from.name} accepted!`
      });
      
      // Refresh data
      fetchIncomingRequests();
      fetchPlayers();
    } catch (error) {
      console.error("Failed to accept trade:", error);
      setShowAlert({
        status: true,
        type: 'failure',
        message: 'Failed to accept trade'
      });
    }
  };

  // Handle rejecting a trade request
  const handleRejectTrade = async (request) => {
    try {
      await contract.rejectTrade(request.from.address);
      setShowAlert({
        status: true,
        type: 'info',
        message: `Trade with ${request.from.name} rejected`
      });
      
      // Refresh data
      fetchIncomingRequests();
    } catch (error) {
      console.error("Failed to reject trade:", error);
      setShowAlert({
        status: true,
        type: 'failure',
        message: 'Failed to reject trade'
      });
    }
  };

  useEffect(() => {
    fetchPlayers();
    checkTradeStatus();
    fetchIncomingRequests();
  }, [contract, walletAddress]);

  const handleTradeRequest = async (player) => {
    setSelectedPlayer(player);
    setShowTradeModal(true);
  };

  const handleTradeConfirm = async () => {
    try {
      // Use requestTrade instead of tradeRequests
      await contract.requestTrade(selectedPlayer.address);
      setShowTradeModal(false);
      setShowAlert({
        status: true,
        type: 'info',
        message: `Trade request sent to ${selectedPlayer.name}`
      });
    } catch (error) {
      console.error("Trade request failed:", error);
      setShowAlert({
        status: true,
        type: 'failure',
        message: 'Failed to send trade request'
      });
    }
  };

  // Trade Request Card Component
  const TradeRequestCard = ({ request }) => (
    <div className="bg-gradient-to-br from-purple-900 to-purple-700 p-4 rounded-lg shadow-lg border border-purple-500 mb-4">
      <h3 className="text-white text-lg font-bold mb-3">Trade Request from {request.from.name}</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-purple-800 p-3 rounded-md">
          <h4 className="text-yellow-300 font-semibold mb-2">Their Card</h4>
          <div className="text-white">
            <p>Attack: <span className="font-bold">{request.from.attack}</span></p>
            <p>Defense: <span className="font-bold">{request.from.defense}</span></p>
          </div>
        </div>
        
        <div className="bg-purple-800 p-3 rounded-md">
          <h4 className="text-yellow-300 font-semibold mb-2">Your Card</h4>
          <div className="text-white">
            <p>Attack: <span className="font-bold">{request.to.attack}</span></p>
            <p>Defense: <span className="font-bold">{request.to.defense}</span></p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between mt-4">
        <CustomButton
          title="Accept"
          handleClick={() => handleAcceptTrade(request)}
          restStyles="bg-green-600 hover:bg-green-700"
        />
        <CustomButton
          title="Reject"
          handleClick={() => handleRejectTrade(request)}
          restStyles="bg-red-600 hover:bg-red-700"
        />
      </div>
    </div>
  );

  // Add this section to render the incoming requests
  const renderIncomingRequests = () => {
    if (incomingRequests.length === 0) {
      return (
        <div className={styles.infoText}>
          No incoming trade requests
        </div>
      );
    }

    return (
      <div className="mt-10">
        <h2 className={styles.joinHeadText}>Incoming Trade Requests</h2>
        <div className={styles.joinContainer}>
          {incomingRequests.map((request, index) => (
            <div key={`request-${index}`} className={`${styles.flexBetween} bg-siteBlack p-4 rounded-lg my-2`}>
              <div>
                <p className={styles.normalText}>{request.from.name} wants to trade</p>
                <div className="flex mt-2">
                  <div className="mr-4">
                    <p className="text-sm text-gray-400">Their Card:</p>
                    <p className="text-yellow-400">ATK: {request.from.attack}</p>
                    <p className="text-red-600">DEF: {request.from.defense}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Your Card:</p>
                    <p className="text-yellow-400">ATK: {request.to.attack}</p>
                    <p className="text-red-600">DEF: {request.to.defense}</p>
                  </div>
                </div>
              </div>
              <div className="flex">
                <CustomButton 
                  title="Accept"
                  handleClick={() => handleAcceptTrade(request)}
                  restStyles="mr-2 bg-green-600"
                />
                <CustomButton 
                  title="Reject"
                  handleClick={() => handleRejectTrade(request)}
                  restStyles="bg-red-600"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Listen for trade request events
  useEffect(() => {
    if (!contract || !walletAddress) return;
  
    const handleTradeRequested = async (from, to) => {
      if (to.toLowerCase() === walletAddress.toLowerCase()) {
        try {
          const player = await contract.getPlayer(from);
          const token = await contract.getPlayerToken(from);
          const myToken = await contract.getPlayerToken(walletAddress);
          
          const request = {
            from: {
              address: from,
              name: player.playerName,
              attack: token.attackStrength.toNumber(),
              defense: token.defenseStrength.toNumber()
            },
            to: {
              address: walletAddress,
              name: gameData.playerName || "You",
              attack: myToken.attackStrength.toNumber(),
              defense: myToken.defenseStrength.toNumber()
            }
          };
          
          setCurrentTradeRequest(request);
          setShowTradeRequestModal(true);
        } catch (error) {
          console.error("Error processing trade request:", error);
        }
      }
    };
  
    // Set up event listener
    contract.on("TradeRequested", handleTradeRequested);
    
    // Clean up
    return () => {
      contract.off("TradeRequested", handleTradeRequested);
    };
  }, [contract, walletAddress, gameData]);

  return (
    <>
      <div className="flex flex-col">
        <div className={`${styles.flexBetween} mb-5`}>
          <h2 className={styles.headText}>Trade Cards</h2>
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={tradeEnabled}
                  onChange={handleToggleTrade}
                  disabled={toggleLoading}
                />
                <div className={`block w-14 h-8 rounded-full transition-colors duration-200 ease-in-out ${
                  tradeEnabled ? 'bg-green-500' : 'bg-gray-600'
                }`}></div>
                <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-all duration-200 ease-in-out ${
                  tradeEnabled ? 'transform translate-x-6' : 'transform translate-x-0'
                }`}></div>
              </div>
              <div className="ml-3 text-white font-medium">
                Enable Trading
              </div>
            </label>
            
            {gameData?.activeBattle?.name && (
              <CustomButton
                title="Return to Battle"
                handleClick={() => navigate(`/battle/${gameData.activeBattle.name}`)}
                restStyles="bg-yellow-500 hover:bg-yellow-600 ml-4"
              />
            )}
          </div>
        </div>

        {/* Render incoming requests section */}
        {renderIncomingRequests()}

        {/* Players available for trading */}
        {tradeEnabled && (
          <>
            <h2 className={styles.joinHeadText}>Players Available for Trading</h2>
            <div className={styles.joinContainer}>
              {loading ? (
                <p className={styles.joinLoading}>Loading players...</p>
              ) : players.length > 0 ? (
                players.map((player, index) => (
                  <div key={`player-${index}`} className={styles.flexBetween}>
                    <div>
                      <p className={styles.joinBattleTitle}>{player.name}</p>
                      <div className="flex mt-1">
                        <p className="text-yellow-400 mr-3">ATK: {player.attack}</p>
                        <p className="text-red-600">DEF: {player.defense}</p>
                      </div>
                    </div>
                    <CustomButton 
                      title="Request Trade"
                      handleClick={() => handleTradeRequest(player)}
                      restStyles={!tradeEnabled ? 'opacity-50 cursor-not-allowed' : ''}
                      disabled={!tradeEnabled}
                    />
                  </div>
                ))
              ) : (
                <p className={styles.joinLoading}>No players available for trading</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Trade confirmation modal */}
      {showTradeModal && selectedPlayer && (
        <Modal 
          title="Confirm Trade Request"
          onClose={() => setShowTradeModal(false)}
           className="bg-black bg-opacity-90 border-2 border-purple-400"
        >
          <div className="p-4
          bg-black bg-opacity-90 border-2 border-purple-400
          "
          >
          
            <p className={styles.normalText}>
              Are you sure you want to request a trade with {selectedPlayer.name}?
            </p>
            <div className="flex justify-end mt-4">
              <CustomButton 
                title="Cancel"
                handleClick={() => setShowTradeModal(false)}
                restStyles="mr-2 bg-gray-600"
              />
              <CustomButton 
                title="Confirm"
                handleClick={() => {
                  handleTradeConfirm();
                  setShowTradeModal(false);
                }}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Trade Request Modal */}
      {showTradeRequestModal && currentTradeRequest && (
        <Modal
          title="Trade Request"
          onClose={() => setShowTradeRequestModal(false)}
        >
          <div className="p-4">
            <h3 className="text-lg font-bold text-white mb-4">
              {currentTradeRequest.from.name} wants to trade with you!
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-purple-800 p-3 rounded-md">
                <h4 className="text-yellow-300 font-semibold mb-2">Their Card</h4>
                <div className="text-white">
                  <p>Attack: <span className="font-bold">{currentTradeRequest.from.attack}</span></p>
                  <p>Defense: <span className="font-bold">{currentTradeRequest.from.defense}</span></p>
                </div>
              </div>
              
              <div className="bg-purple-800 p-3 rounded-md">
                <h4 className="text-yellow-300 font-semibold mb-2">Your Card</h4>
                <div className="text-white">
                  <p>Attack: <span className="font-bold">{currentTradeRequest.to.attack}</span></p>
                  <p>Defense: <span className="font-bold">{currentTradeRequest.to.defense}</span></p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <CustomButton 
                title="Reject"
                handleClick={() => {
                  handleRejectTrade(currentTradeRequest);
                  setShowTradeRequestModal(false);
                }}
                restStyles="bg-red-600 hover:bg-red-700"
              />
              <CustomButton 
                title="Accept"
                handleClick={() => {
                  handleAcceptTrade(currentTradeRequest);
                  setShowTradeRequestModal(false);
                }}
                restStyles="bg-green-600 hover:bg-green-700"
              />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default PageHOC(
  TradeCard,
  <>Trade <br /> Cards</>,
  <>Trade your battle cards with other players</>
);