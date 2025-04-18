// import React from 'react'
// import { PageHOC} from '../components';

// const TradeCard = () => {
//   return (
//   <>
    
//   </>
//   )
// }

// // export default PageHOC
// export default PageHOC(
//   TradeCard,
//   <>Welcome to AETHER KNIGHTS <br /> MarketPLace </>,
//   <>Here You Can Trade Your Cards <br /> To Turn The Tables </>
// );

//DEEPLY ENHANCED


// import React, { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useGlobalContext } from '../context';
// import { PageHOC, CustomButton } from '../components';

// const TradeCard = () => {
//   const { contract, gameData } = useGlobalContext();
//   const [activeBattles, setActiveBattles] = useState([]);
//   const navigate = useNavigate();

//   // Fetch all active battles with player data
//   const fetchActiveBattles = async () => {
//     if (!contract) return;

//     try {
//       const battles = await contract.getAllBattles();
//       const active = battles.filter(b => b.battleStatus === 1);
      
//       const battlesWithPlayers = await Promise.all(
//         active.map(async (battle) => {
//           const [player1, player2] = await Promise.all([
//             getPlayerData(battle.players[0]),
//             getPlayerData(battle.players[1])
//           ]);
//           return { ...battle, player1, player2 };
//         })
//       );
      
//       setActiveBattles(battlesWithPlayers);
//     } catch (error) {
//       console.error("Failed to fetch battles:", error);
//     }
//   };

//   // Fetch player data (name + stats)
//   const getPlayerData = async (playerAddress) => {
//     if (!contract || !playerAddress) return { name: 'Unknown', att: 0, def: 0 };
    
//     try {
//       const [player, tokenData] = await Promise.all([
//         contract.getPlayer(playerAddress),
//         contract.getPlayerToken(playerAddress),
//       ]);
      
//       return {
//         name: player.playerName || 'Unnamed',
//         att: tokenData.attackStrength.toNumber(),
//         def: tokenData.defenseStrength.toNumber(),
//       };
//     } catch (error) {
//       console.error("Failed to fetch player data:", error);
//       return { name: 'Error', att: 0, def: 0 };
//     }
//   };

//   useEffect(() => {
//     fetchActiveBattles();
//   }, [contract]);

//   return (
//     <div className="flex flex-col items-center gap-4 p-4">
//       <div className="w-full flex justify-between items-center mb-4">
//         <h1 className="text-2xl font-bold">Active Battles</h1>
//         <CustomButton
//           title="Return to Battle"
//           handleClick={() => navigate(`/battle/${gameData.activeBattle.name}`)}
//           restStyles="bg-yellow-500 hover:bg-yellow-600"
//         />
//       </div>

//       {activeBattles.length === 0 ? (
//         <p className="text-white">No active battles.</p>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
//           {activeBattles.map((battle, index) => (
//             <div key={index} className="bg-gray-800 p-4 rounded-lg">
//               <h2 className="text-xl mb-2 text-white">Battle: {battle.name}</h2>
//               <div className="flex gap-4">
//                 <div className="flex-1">
//                   <h3 className="font-semibold text-white">{battle.player1.name}</h3>
//                   <p className="text-white">Attack: <span className="text-red-500">{battle.player1.att}</span></p>
//                   <p className="text-white">Defense: <span className="text-blue-500">{battle.player1.def}</span></p>
//                 </div>
//                 <div className="flex-1">
//                   <h3 className="font-semibold text-white">{battle.player2.name}</h3>
//                   <p className="text-white">Attack: <span className="text-red-500">{battle.player2.att}</span></p>
//                   <p className="text-white">Defense: <span className="text-blue-500">{battle.player2.def}</span></p>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default PageHOC(
//   TradeCard,
//   <>Welcome to AETHER KNIGHTS <br /> MarketPLace</>,
//   <>Here You Can Trade Your Cards <br /> To Turn The Tables</>
// );
//--------------------------------------------------------------------------------
//Deeply Enhanced 2
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../context';
import { PageHOC, CustomButton } from '../components';

const TradeCard = () => {
  const { contract, gameData, showPlayerStats = false, walletAddress } = useGlobalContext();
  const [allPlayers, setAllPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Debug log to verify the toggle state
  console.log('Trade visibility enabled:', showPlayerStats);

  // Fetch all players with their stats
  const fetchAllPlayers = async () => {
    if (!contract) return;
    
    try {
      setLoading(true);
      const battles = await contract.getAllBattles();
      const activeBattles = battles.filter(b => b.battleStatus === 1);
      
      const playerAddresses = new Set();
      activeBattles.forEach(battle => {
        if (battle.players[0]) playerAddresses.add(battle.players[0]);
        if (battle.players[1]) playerAddresses.add(battle.players[1]);
      });

      const playersData = await Promise.all(
        Array.from(playerAddresses).map(async (address) => {
          try {
            const [player, token] = await Promise.all([
              contract.getPlayer(address),
              contract.getPlayerToken(address)
            ]);
            
            return {
              address,
              name: player.playerName || 'Unknown',
              attack: token.attackStrength?.toNumber() || 0,
              defense: token.defenseStrength?.toNumber() || 0,
              inBattle: player.inBattle
            };
          } catch (error) {
            console.error(`Error fetching data for ${address}:`, error);
            return null;
          }
        })
      );

      setAllPlayers(playersData.filter(p => p !== null));
    } catch (error) {
      console.error("Failed to fetch players:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter players based on toggle state and battle status
  const getFilteredPlayers = () => {
    if (!showPlayerStats) return [];
    
    let opponentAddress = null;
    if (gameData?.activeBattle?.players) {
      opponentAddress = gameData.activeBattle.players.find(
        p => p !== walletAddress
      );
    }

    return allPlayers.filter(player => 
      player.address &&
      player.address !== walletAddress &&
      player.address !== opponentAddress &&
      player.inBattle
    );
  };

  useEffect(() => {
    fetchAllPlayers();
  }, [contract, showPlayerStats]); // Add showPlayerStats to dependencies

  const filteredPlayers = getFilteredPlayers();

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="w-full flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Available Traders</h1>
        {gameData?.activeBattle?.name && (
          <CustomButton
            title="Return to Battle"
            handleClick={() => navigate(`/battle/${gameData.activeBattle.name}`)}
            restStyles="bg-yellow-500 hover:bg-yellow-600"
          />
        )}
      </div>

      {loading ? (
        <p className="text-white">Loading player data...</p>
      ) : showPlayerStats ? (
        filteredPlayers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {filteredPlayers.map((player, index) => (
              <div key={`${player.address}-${index}`} className="bg-gray-800 p-4 rounded-lg">
                <h3 className="font-semibold text-white text-lg mb-2">
                  {player.name}
                </h3>
                <div className="space-y-2">
                  <p className="text-white">
                    Attack: <span className="text-red-500 font-bold">{player.attack}</span>
                  </p>
                  <p className="text-white">
                    Defense: <span className="text-blue-500 font-bold">{player.defense}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white">
            {allPlayers.length > 0 
              ? "No available traders matching your criteria."
              : "No active traders found."}
          </p>
        )
      ) : (
        <div className="text-center">
          <p className="text-white mb-4">
            Trade visibility is currently disabled.
          </p>
          <CustomButton
            title="Enable Trading"
            handleClick={() => navigate('/')} // Or directly to game info
            restStyles="bg-green-500 hover:bg-green-600"
          />
        </div>
      )}
    </div>
  );
};

export default PageHOC(
  TradeCard,
  <>Welcome to AETHER KNIGHTS <br /> MarketPLace</>,
  <>Here You Can Trade Your Cards <br /> To Turn The Tables</> 
);