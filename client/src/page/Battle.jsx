import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom';

import styles from '../styles';
import { Card, Alert, GameInfo, PlayerInfo, ActionButton, Modal, CustomButton } from '../components';
import { useGlobalContext } from '../context';

import { attack, attackSound, defense, defenseSound, player01 as player01Icon, player02 as player02Icon } from '../assets';
import { playAudio } from '../utils/animation.js';

const Battle = () => {
    const { 
        contract, 
        gameData, 
        walletAddress, 
        showAlert, 
        setShowAlert, 
        battleGround, 
        player1Ref, 
        player2Ref, 
        setErrorMessage,
        showTradeRequestModal,
        setShowTradeRequestModal,
        currentTradeRequest,
        setCurrentTradeRequest,
        handleAcceptTrade,
        handleRejectTrade
    } = useGlobalContext();
    const [player1, setPlayer1] = useState({});
    const [player2, setPlayer2] = useState({});

    const { battleName } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
      const getPlayerInfo = async () => {
        try {
          if(!contract && !gameData) return;
          let player01Address = null;
          let player02Address = null;

          if(gameData?.activeBattle?.players[0] === null){
            console.log("It's actually null!");
          } else {
            console.log("Good to GooO!!!");
          }

          if(gameData.activeBattle.players[0].toLowerCase() === walletAddress.toLowerCase()){
            player01Address = gameData.activeBattle.players[0];
            player02Address = gameData.activeBattle.players[1];
          } else {
              player01Address = gameData.activeBattle.players[1];
              player02Address = gameData.activeBattle.players[0];
          }
          
          const p1TokenData = await contract.getPlayerToken(player01Address);
          const player01 = await contract.getPlayer(player01Address);
          const player02 = await contract.getPlayer(player02Address);
          
          const p1Att = p1TokenData.attackStrength.toNumber();
          const p1Def = p1TokenData.defenseStrength.toNumber();

          const p1H = player01.playerHealth.toNumber();
          const p1M = player01.playerMana.toNumber();
          const p2H = player02.playerHealth.toNumber();
          const p2M = player02.playerMana.toNumber();

          setPlayer1({ ...player01, att: p1Att, def: p1Def, health: p1H, mana: p1M })
          setPlayer2({ ...player02, att: 'X', def: 'X', health: p2H, mana: p2M })
        } catch (error) {
          setErrorMessage(error.message);
        }
      }
      getPlayerInfo();
    }, [contract, gameData, battleName]);

    const makeAMove = async (choice) => {
      playAudio(choice === 1 ? attackSound : defenseSound)
      try {
        await contract.attackOrDefendChoice(choice, battleName, { gasLimit: 200000 });
        
        setShowAlert({
        status: true,
        type: 'info',
        message: `Initiating ${choice === 1 ? 'attack' : 'defense'}`,
      });

      } catch (error) {
        console.log(error);
        setErrorMessage(error);
        
      }
    }


    // Add this useEffect to check for trade requests on the Battle page
    useEffect(() => {
        const checkForTradeRequests = async () => {
            if (!contract || !walletAddress) return;
            
            try {
                // Get the current block number
                const currentBlock = await contract.provider.getBlockNumber();
                // Set a reasonable block range (last 2000 blocks to stay under the 2048 limit)
                const fromBlock = Math.max(0, currentBlock - 2000);
                
                // Get trade events from contract with limited block range
                const filter = contract.filters.TradeRequested(null, walletAddress);
                const events = await contract.queryFilter(filter, fromBlock, currentBlock);
                
                // If there are trade requests, process the most recent one
                if (events.length > 0) {
                    // Only show the modal if it's not already showing and we haven't rejected or accepted this request
                    const latestEvent = events[events.length - 1];
                    const tradeHash = latestEvent.transactionHash;
                    
                    // Check if this trade was already accepted or rejected
                    const wasAccepted = localStorage.getItem(`accepted_trade_${tradeHash}`);
                    const wasRejected = localStorage.getItem(`rejected_trade_${tradeHash}`);
                    
                    if (!showTradeRequestModal && !wasAccepted && !wasRejected) {
                        const fromAddress = latestEvent.args.from;
                        
                        const player = await contract.getPlayer(fromAddress);
                        const token = await contract.getPlayerToken(fromAddress);
                        const myToken = await contract.getPlayerToken(walletAddress);
                        
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
                        
                        // Set the current trade request and show the modal
                        setCurrentTradeRequest(request);
                        setShowTradeRequestModal(true);
                    }
                }
            } catch (error) {
                console.error("Failed to check for trade requests:", error);
                setErrorMessage(error.message);
            }
        };
        
        // Check for trade requests when the component mounts
        checkForTradeRequests();
        
        // Set up an interval to periodically check for new trade requests
        const interval = setInterval(checkForTradeRequests, 10000); // Check every 10 seconds
        
        return () => clearInterval(interval);
    }, [contract, walletAddress, gameData, setCurrentTradeRequest, setShowTradeRequestModal]);

    useEffect(() => {
      const timeout = setTimeout(() => {
        if(!gameData?.activeBattle) navigate('/');
      }, 2000);
      return () => {
        clearTimeout(timeout);
      };
    }, []);

  return (
    <div className={`${styles.flexBetween} ${styles.gameContainer} ${battleGround}`}>
      {showAlert?.status && <Alert type={showAlert.type} message={showAlert.message} />}
      
      {/* Trade Request Modal - Ensure it's properly styled */}
      {showTradeRequestModal && currentTradeRequest && (
          <Modal
              title="Trade Request"
              onClose={() => {
                  setShowTradeRequestModal(false);
                  // Mark as rejected when closed
                  if (currentTradeRequest.transactionHash) {
                      localStorage.setItem(`rejected_trade_${currentTradeRequest.transactionHash}`, 'true');
                  }
              }}
              hasCloseButton={true}
          >
              <div className="flex flex-col items-center">
                  <p className="text-white text-lg mb-4">
                      {currentTradeRequest.from.name} wants to trade with you!
                  </p>
                  <div className="flex justify-between w-full mb-4">
                      <div className="text-white">
                          <p className="font-bold">Their Card:</p>
                          <p>Attack: {currentTradeRequest.from.attack}</p>
                          <p>Defense: {currentTradeRequest.from.defense}</p>
                      </div>
                      <div className="text-white">
                          <p className="font-bold">Your Card:</p>
                          <p>Attack: {currentTradeRequest.to.attack}</p>
                          <p>Defense: {currentTradeRequest.to.defense}</p>
                      </div>
                  </div>
                  <div className="flex justify-between w-full">
                      <CustomButton
                          title="Accept"
                          handleClick={() => {
                              // Store acceptance in localStorage
                              if (currentTradeRequest.transactionHash) {
                                  localStorage.setItem(`accepted_trade_${currentTradeRequest.transactionHash}`, 'true');
                              }
                              handleAcceptTrade(currentTradeRequest);
                              setShowTradeRequestModal(false);
                          }}
                          restStyles="mr-2"
                      />
                      <CustomButton
                          title="Reject"
                          handleClick={() => {
                              // Add wallet confirmation for rejecting trade
                              try {
                                  // Call the contract method to reject trade
                                  contract.rejectTrade(currentTradeRequest.from.address)
                                      .then(() => {
                                          // Mark as rejected in localStorage
                                          localStorage.setItem(`rejected_trade_${currentTradeRequest.transactionHash}`, 'true');
                                          
                                          // Show success alert
                                          setShowAlert({
                                              status: true,
                                              type: 'success',
                                              message: 'Trade request rejected'
                                          });
                                          
                                          // Close the modal
                                          setShowTradeRequestModal(false);
                                      })
                                      .catch((error) => {
                                          setErrorMessage(error);
                                          console.error("Error rejecting trade:", error);
                                      });
                              } catch (error) {
                                  setErrorMessage(error);
                                  console.error("Error rejecting trade:", error);
                              }
                          }}
                          restStyles="ml-2"
                      />
                  </div>
              </div>
          </Modal>
      )}
      
      <PlayerInfo player={player2} playerIcon={player02Icon} mt/>
      <div className={`${styles.flexCenter} flex-col my-10`}>
        <Card 
          card={player2}
          title={player2?.playerName}
          cardRef={player2Ref}
          playerTwo
        
        />

        <div className='flex items-center flex-row'>
          <ActionButton 
            imgUrl={attack}
            handleClick={() => makeAMove(1)}
            restStyles="mr-2 hover:border-yellow-400"
          />
          <Card 
            card={player1}
            title={player1?.playerName}
            cardRef={player1Ref}
            restStyles='mt-3'
          />
          <ActionButton 
            imgUrl={defense}
            handleClick={() => makeAMove(2)}
            restStyles="ml-6 hover:border-red-600"
          />
          
        </div>

      </div>
        <PlayerInfo player={player1} playerIcon={player01Icon} />

        <GameInfo />
    </div>
  )
}

export default Battle;
