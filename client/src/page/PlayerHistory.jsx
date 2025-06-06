import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHOC, CustomButton, Loader } from '../components';
import styles from '../styles';
import { useGlobalContext } from '../context';

const PlayerHistory = () => {
  const { contract, walletAddress, setErrorMessage } = useGlobalContext();
  const [loading, setLoading] = useState(false);
  const [battleHistory, setBattleHistory] = useState([]);
  const [tradeHistory, setTradeHistory] = useState({
    sent: [],
    received: []
  });
  const [activeTab, setActiveTab] = useState('battles'); // 'battles' or 'trades'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      if (!contract || !walletAddress) return;
      
      setLoading(true);
      try {
        // Fetch battle history
        const battles = await contract.getAllBattles();
        const playerBattles = battles.filter(battle => 
          battle.players[0].toLowerCase() === walletAddress.toLowerCase() || 
          battle.players[1].toLowerCase() === walletAddress.toLowerCase()
        );
        
        const formattedBattles = await Promise.all(playerBattles.map(async (battle) => {
          const isPlayer1 = battle.players[0].toLowerCase() === walletAddress.toLowerCase();
          const opponent = isPlayer1 ? battle.players[1] : battle.players[0];
          const opponentData = await contract.getPlayer(opponent);
          
          return {
            name: battle.name,
            opponent: {
              address: opponent,
              name: opponentData.playerName
            },
            result: battle.winner === walletAddress ? 'Won' : 
                   battle.winner === opponent ? 'Lost' : 
                   battle.battleStatus === 0 ? 'Pending' : 'In Progress',
            moves: []
          };
        }));
        
        setBattleHistory(formattedBattles);
        
        // Fetch trade history
        // First check if we have cached trade history
        const cachedTradeHistory = localStorage.getItem(`trade_history_${walletAddress}`);
        let existingSentTrades = [];
        let existingReceivedTrades = [];
        
        if (cachedTradeHistory) {
          try {
            const parsed = JSON.parse(cachedTradeHistory);
            existingSentTrades = parsed.sent || [];
            existingReceivedTrades = parsed.received || [];
          } catch (e) {
            console.error("Error parsing cached trade history:", e);
          }
        }
        
        const sentTrades = [...existingSentTrades];
        const receivedTrades = [...existingReceivedTrades];
        
        try {
          // Get the current block number
          const currentBlock = await contract.provider.getBlockNumber();
          // Set a reasonable block range (last 2000 blocks to stay under the 2048 limit)
          const fromBlock = Math.max(0, currentBlock - 2000);
          
          // Get trade request events
          const sentFilter = contract.filters.TradeRequested(walletAddress);
          const sentEvents = await contract.queryFilter(sentFilter, fromBlock, currentBlock);
          
          // Get trade accepted events
          const acceptedFilter = contract.filters.TradeAccepted(null, walletAddress);
          const acceptedByMeFilter = contract.filters.TradeAccepted(walletAddress);
          const acceptedEvents = await contract.queryFilter(acceptedFilter, fromBlock, currentBlock);
          const acceptedByMeEvents = await contract.queryFilter(acceptedByMeFilter, fromBlock, currentBlock);
          
          // Process sent trade requests
          for (const event of sentEvents) {
            const toAddress = event.args.to;
            const tradeHash = event.transactionHash;
            
            // Skip if we already have this trade in our cached history
            if (sentTrades.some(trade => trade.transactionHash === tradeHash)) {
              continue;
            }
            
            try {
              const player = await contract.getPlayer(toAddress);
              const myToken = await contract.getPlayerToken(walletAddress);
              
              // Check if this trade was accepted
              const wasAccepted = acceptedByMeEvents.some(e => 
                e.args.from.toLowerCase() === walletAddress.toLowerCase() && 
                e.args.to.toLowerCase() === toAddress.toLowerCase()
              );
              
              const trade = {
                transactionHash: tradeHash,
                to: {
                  address: toAddress,
                  name: player.playerName
                },
                status: wasAccepted ? 'Accepted' : 'Pending',
                timestamp: Date.now() // Add timestamp for sorting
              };
              
              sentTrades.push(trade);
            } catch (error) {
              console.error("Error processing sent trade:", error);
            }
          }
          
          // Process received trade requests
          for (const event of acceptedEvents) {
            const fromAddress = event.args.from;
            const tradeHash = event.transactionHash;
            
            // Skip if we already have this trade in our cached history
            if (receivedTrades.some(trade => trade.transactionHash === tradeHash)) {
              continue;
            }
            
            try {
              const player = await contract.getPlayer(fromAddress);
              const token = await contract.getPlayerToken(fromAddress);
              
              const trade = {
                transactionHash: tradeHash,
                from: {
                  address: fromAddress,
                  name: player.playerName
                },
                status: 'Accepted',
                timestamp: Date.now() // Add timestamp for sorting
              };
              
              receivedTrades.push(trade);
            } catch (error) {
              console.error("Error processing received trade:", error);
            }
          }
          
          // Sort trades by timestamp (newest first)
          sentTrades.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          receivedTrades.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          
          // Save the updated trade history to localStorage
          localStorage.setItem(`trade_history_${walletAddress}`, JSON.stringify({
            sent: sentTrades,
            received: receivedTrades
          }));
          
          console.log("Sent trades:", sentTrades);
          console.log("Received trades:", receivedTrades);
          
          setTradeHistory({
            sent: sentTrades,
            received: receivedTrades
          });
        } catch (error) {
          console.error("Error fetching trade history:", error);
          // If there was an error fetching new trades, at least use the cached ones
          setTradeHistory({
            sent: existingSentTrades,
            received: existingReceivedTrades
          });
        }
        
      } catch (error) {
        console.error("Error fetching history:", error);
        setErrorMessage(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, [contract, walletAddress]);

  return (
    <>
      {loading && <Loader message="Loading your history..." />}
      
      <div className="mb-5">
        <CustomButton
          title="Back to Previous page"
          handleClick={() => navigate('/create-battle')}
          restStyles="mb-4"
        />
      </div>
      
      {/* Improved tab navigation with better visibility */}
      <div className="flex justify-center mb-5">
        <div className="flex border-b-2 border-siteViolet w-full max-w-md">
          <button 
            className={`px-6 py-3 text-lg font-bold ${
              activeTab === 'battles'
                ? 'text-white bg-siteViolet rounded-t-lg border-b-0'
                : 'text-gray-300 hover:text-white'
            }`}
            onClick={() => setActiveTab('battles')}
          >
            Battle History
          </button>
          <button 
            className={`px-6 py-3 text-lg font-bold ${
              activeTab === 'trades'
                ? 'text-white bg-siteViolet rounded-t-lg border-b-0'
                : 'text-gray-300 hover:text-white'
            }`}
            onClick={() => setActiveTab('trades')}
          >
            Trade Activity
          </button>
        </div>
      </div>
      
      {/* Scrollable container for battle/trade history */}
      <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        {activeTab === 'battles' && (
          <div className="flex flex-col">
            <div className="flex items-center mb-6">
              <h2 className={`${styles.headText} text-white text-4xl font-bold mr-3`}>Your Battle History</h2>
              <button 
                className="p-2 hover:bg-siteViolet/30 rounded-full transition-colors"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                title={sortOrder === 'asc' ? 'Sort Newest First' : 'Sort Oldest First'}
              >
                <span className="text-white text-2xl" style={{ transform: sortOrder === 'desc' ? 'scaleY(-1)' : 'none' }}>
                  ↑↓
                </span>
              </button>
            </div>
            
            {battleHistory.length === 0 ? (
              <p className="text-center mt-10 text-white text-xl">You haven't participated in any battles yet.</p>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-6">
                {(sortOrder === 'asc' ? [...battleHistory] : [...battleHistory].reverse()).map((battle, index) => (
                  <div
                    key={`${battle.name}-${index}`}
                    className="bg-[#1A1E2E] p-6 rounded-lg border-2 border-siteViolet shadow-lg hover:shadow-siteViolet/50 transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-bold text-white">{battle.name}</h3>
                      <span className={`px-4 py-2 rounded-full text-white font-bold ${
                        battle.result === 'Won' ? 'bg-green-600' : 
                        battle.result === 'Lost' ? 'bg-red-600' : 
                        'bg-yellow-600'
                      }`}>
                        {battle.result}
                      </span>
                    </div>
                    <p className="mt-3 text-xl text-white">Opponent: <span className="text-siteViolet font-semibold">{battle.opponent.name}</span></p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'trades' && (
          <div className="flex flex-col">
            <div className="flex items-center mb-6">
              <h2 className={`${styles.headText} text-white text-4xl font-bold mr-3`}>Your Trade Activity</h2>
              <button 
                className="p-2 hover:bg-siteViolet/30 rounded-full transition-colors"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                title={sortOrder === 'asc' ? 'Sort Newest First' : 'Sort Oldest First'}
              >
                <span className="text-white text-2xl" style={{ transform: sortOrder === 'desc' ? 'scaleY(-1)' : 'none' }}>
                  ↑↓
                </span>
              </button>
            </div>
            
            <div className="mt-6">
              <h3 className="text-2xl font-bold mb-4 text-white">Successful Trades</h3>
              {tradeHistory.received.length === 0 && tradeHistory.sent.filter(trade => trade.status === 'Accepted').length === 0 ? (
                <p className="text-white text-xl p-4 bg-[#1A1E2E] rounded-lg border border-siteViolet">No successful trades yet.</p>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {/* Combine and sort all trades */}
                  {(sortOrder === 'asc' 
                    ? [...tradeHistory.sent.filter(trade => trade.status === 'Accepted'), ...tradeHistory.received]
                        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
                    : [...tradeHistory.sent.filter(trade => trade.status === 'Accepted'), ...tradeHistory.received]
                        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
                  ).map((trade, index) => (
                    <div key={`trade-${index}`} className="p-4 rounded-lg bg-[#1A1E2E] border-2 border-siteViolet">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-white">Traded with: <span className="text-siteViolet font-semibold">
                            {trade.to ? trade.to.name : trade.from.name}
                          </span></p>
                          {trade.timestamp && (
                            <p className="text-gray-400 text-sm mt-1">
                              {new Date(trade.timestamp).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <span className={`px-3 py-1 ${trade.to ? 'bg-green-600' : 'bg-blue-600'} text-white rounded-full text-sm`}>
                          {trade.to ? 'Sent & Accepted' : 'Received & Accepted'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      
    </>
  );
};

export default PageHOC(
  PlayerHistory,
  <>Your <br /> History</>,
  <>View your battle history and trade activity</>
);
