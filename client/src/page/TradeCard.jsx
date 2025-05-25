import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../context';
import { PageHOC, CustomButton, Modal } from '../components';
import styles from '../styles';

const TradeCard = () => {
  const { 
    contract, 
    gameData, 
    walletAddress, 
    setShowAlert, 
    showTradeRequestModal, 
    setShowTradeRequestModal,
    currentTradeRequest, 
    setCurrentTradeRequest,
    setErrorMessage
  } = useGlobalContext();
  
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTradeModal, setShowTradeModal] = useState(false);
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

  // Fetch incoming trade requests
  const fetchIncomingRequests = async () => {
    if (!contract || !walletAddress) return;
    
    try {
      
      const currentBlock = await contract.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 2000);
      const filter = contract.filters.TradeRequested(null, walletAddress);
      const events = await contract.queryFilter(filter, fromBlock, currentBlock);
      
      const requests = [];
      
      for (const event of events) {
        const fromAddress = event.args.from;
        const tradeHash = event.transactionHash;
        
        // Check if this trade was already accepted or rejected
        const wasAccepted = localStorage.getItem(`accepted_trade_${tradeHash}`);
        const wasRejected = localStorage.getItem(`rejected_trade_${tradeHash}`);
        
        // Skip this request if it was already handled
        if (wasAccepted || wasRejected) continue;
        
        try {
          const player = await contract.getPlayer(fromAddress);
          const token = await contract.getPlayerToken(fromAddress);
          const myToken = await contract.getPlayerToken(walletAddress);
          
          // Get the original stats that were stored when the trade was requested
          const originalStatsString = localStorage.getItem(`original_stats_${tradeHash}`);
          
          if (originalStatsString) {
            const originalStats = JSON.parse(originalStatsString);
        
            if (originalStats.from.attack !== token.attackStrength.toNumber() ||
                originalStats.from.defense !== token.defenseStrength.toNumber() ||
                originalStats.to.attack !== myToken.attackStrength.toNumber() ||
                originalStats.to.defense !== myToken.defenseStrength.toNumber()) {
              
              // Stats have changed, mark this request as invalid
              localStorage.setItem(`rejected_trade_${tradeHash}`, 'true');
              continue; 
            }
          } else {
            // If we don't have original stats, store them now
            const originalStats = {
              from: {
                attack: token.attackStrength.toNumber(),
                defense: token.defenseStrength.toNumber()
              },
              to: {
                attack: myToken.attackStrength.toNumber(),
                defense: myToken.defenseStrength.toNumber()
              }
            };
            
            localStorage.setItem(`original_stats_${tradeHash}`, JSON.stringify(originalStats));
          }
          
          const request = {
            transactionHash: tradeHash,
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
          };
          
          requests.push(request);
        } catch (error) {
          console.error("Error processing trade request:", error);
        }
      }
      
      setIncomingRequests(requests);
      
      if (requests.length > 0) {
        setCurrentTradeRequest(requests[0]);
        setShowTradeRequestModal(true);
      }
    } catch (error) {
      console.error("Failed to fetch incoming requests:", error);
      setErrorMessage(error.message);
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

  // Handle accept trade
  const handleAcceptTrade = async (request) => {
    try {
      // Get current stats to verify they haven't changed
      const fromToken = await contract.getPlayerToken(request.from.address);
      const myToken = await contract.getPlayerToken(walletAddress);
      
      // Get the original stats that were stored when the trade was requested
      const originalStatsString = localStorage.getItem(`original_stats_${request.transactionHash}`);
      
      if (originalStatsString) {
        const originalStats = JSON.parse(originalStatsString);
    
        if (originalStats.from.attack !== fromToken.attackStrength.toNumber() || 
            originalStats.from.defense !== fromToken.defenseStrength.toNumber() || 
            originalStats.to.attack !== myToken.attackStrength.toNumber() || 
            originalStats.to.defense !== myToken.defenseStrength.toNumber()) {
          
          // Stats have changed, mark this request as invalid
          localStorage.setItem(`rejected_trade_${request.transactionHash}`, 'true');
          
          setShowAlert({
            status: true,
            type: 'failure',
            message: 'Trade rejected: Card stats have changed since the request was made.'
          });
          
          // Remove from incoming requests
          setIncomingRequests(prev => prev.filter(r => r.transactionHash !== request.transactionHash));
          setShowTradeRequestModal(false);
          return;
        }
      } else {
        // If we don't have original stats, we can't verify the trade
        setShowAlert({
          status: true,
          type: 'failure',
          message: 'Cannot verify trade: Original stats not found.'
        });
        return;
      }
      
      // If stats match, proceed with accepting the trade
      await contract.acceptTrade(request.from.address);
      
      // Store that this trade was accepted in localStorage
      if (request.transactionHash) {
        localStorage.setItem(`accepted_trade_${request.transactionHash}`, 'true');
      }
      
      setShowAlert({
        status: true,
        type: 'success',
        message: 'Trade accepted successfully!'
      });
      // Refresh data
      fetchPlayers();
      setIncomingRequests(prev => prev.filter(r => r.from.address !== request.from.address));
      setShowTradeRequestModal(false);
    } catch (error) {
      console.error("Failed to accept trade:", error);
      setShowAlert({
        status: true,
        type: 'failure',
        message: `Failed to accept trade: ${error.message}`
      });
    }
  };

  // Handle reject trade
  const handleRejectTrade = async (request) => {
    try {
      if (contract.rejectTrade) {
        await contract.rejectTrade(request.from.address);
      }
      
      // Store that this trade was rejected in localStorage
      if (request.transactionHash) {
        localStorage.setItem(`rejected_trade_${request.transactionHash}`, 'true');
      }
      
      setShowAlert({
        status: true,
        type: 'info',
        message: 'Trade request rejected'
      });
      setIncomingRequests(prev => prev.filter(r => r.from.address !== request.from.address));
      setShowTradeRequestModal(false);
    } catch (error) {
      console.error("Failed to reject trade:", error);
      setShowAlert({
        status: true,
        type: 'failure',
        message: `Failed to reject trade: ${error.message}`
      });
    }
  };

  // Listen for trade request events
  useEffect(() => {
    if (!contract || !walletAddress) return;
  
    const handleTradeRequested = async (from, to) => {
      if (to.toLowerCase() === walletAddress.toLowerCase()) {
        try {
          const blockNumber = await contract.provider.getBlockNumber();
          const filter = contract.filters.TradeRequested(from, to);
          const events = await contract.queryFilter(filter, blockNumber - 10, blockNumber);
          
          let tradeHash = null;
          if (events.length > 0) {
            tradeHash = events[events.length - 1].transactionHash;
          }
          
          // Check if this trade was already accepted or rejected
          if (tradeHash) {
            const wasAccepted = localStorage.getItem(`accepted_trade_${tradeHash}`);
            const wasRejected = localStorage.getItem(`rejected_trade_${tradeHash}`);
            
            
            if (wasAccepted || wasRejected) return;
          }
          
          const player = await contract.getPlayer(from);
          const token = await contract.getPlayerToken(from);
          const myToken = await contract.getPlayerToken(walletAddress);
          
          // Store the original stats at the time of the request
          if (tradeHash) {
            const originalStats = {
              from: {
                attack: token.attackStrength.toNumber(),
                defense: token.defenseStrength.toNumber()
              },
              to: {
                attack: myToken.attackStrength.toNumber(),
                defense: myToken.defenseStrength.toNumber()
              }
            };
            
            localStorage.setItem(`original_stats_${tradeHash}`, JSON.stringify(originalStats));
          }
          
          const request = {
            transactionHash: tradeHash,
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
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Toggle Button for Trade Functionality */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <label htmlFor="toggleTrade" className="flex items-center cursor-pointer">
            <div className="relative">
              <input 
                type="checkbox" 
                id="toggleTrade" 
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
              Enable Trade: {tradeEnabled ? "ON" : "OFF"}
            </div>
          </label>
        </div>
        
        {/* Return to Battle Button */}
        <CustomButton
          title="Return to Battle"
          handleClick={() => navigate(`/battle/${gameData?.activeBattle?.name}`)}
          restStyles="bg-siteViolet"
        />
      </div>

      <h2 className={styles.joinHeadText}>Trade Cards with Players</h2>
      
      {tradeEnabled ? (
        loading ? (
          <p className={styles.infoText}>Loading players...</p>
        ) : players.length > 0 ? (
          <div className={`${styles.joinContainer} max-h-[400px] overflow-y-auto pr-2 custom-scrollbar`}>
            {players.map((player, index) => (
              <div key={`player-${index}`} className={`${styles.flexBetween} bg-siteBlack p-4 rounded-lg my-2`}>
                <div>
                  <p className={styles.normalText}>{player.name}</p>
                  <p className="text-yellow-400">ATK: {player.attack}</p>
                  <p className="text-red-600">DEF: {player.defense}</p>
                </div>
                <CustomButton
                  title="Request Trade"
                  handleClick={() => handleTradeRequest(player)}
                  restStyles="bg-siteViolet"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.infoText}>No players available for trading</p>
        )
      ) : (
        <p className={styles.infoText}>Enable trading to see available players</p>
      )}

      {/* Render incoming requests */}
      {incomingRequests.length > 0 && (
        <div className="mt-10">
          <h2 className={styles.joinHeadText}>Incoming Trade Requests</h2>
          <div className={`${styles.joinContainer} max-h-[300px] overflow-y-auto pr-2 custom-scrollbar`}>
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
      )}

      {/* Trade Confirmation Modal */}
      {showTradeModal && selectedPlayer && (
        <Modal
          title="Confirm Trade Request"
          onClose={() => setShowTradeModal(false)}
        >
          <div className="text-white">
            <p className="mb-4">Are you sure you want to request a trade with {selectedPlayer.name}?</p>
            <div className="flex justify-between">
              <CustomButton
                title="Confirm"
                handleClick={handleTradeConfirm}
                restStyles="bg-green-600 hover:bg-green-700"
              />
              <CustomButton
                title="Cancel"
                handleClick={() => setShowTradeModal(false)}
                restStyles="bg-red-600 hover:bg-red-700"
              />
            </div>
          </div>
        </Modal>
      )}

     
    </div>
  );
};

export default PageHOC(
  TradeCard,
  <>Trade <br /> Your Cards</>,
  <>Exchange powers to outsmart your rivals!</>
);