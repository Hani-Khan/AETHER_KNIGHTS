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
    const [hasMadeMove, setHasMadeMove] = useState(false);

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
          
          // Check if player has already made a move
          if (gameData.activeBattle) {
            const [p1Move, p2Move] = await contract.getBattleMoves(battleName);
            const playerIndex = gameData.activeBattle.players[0].toLowerCase() === walletAddress.toLowerCase() ? 0 : 1;
            const hasAlreadyMoved = playerIndex === 0 ? p1Move.toNumber() !== 0 : p2Move.toNumber() !== 0;
            setHasMadeMove(hasAlreadyMoved);
          }
        } catch (error) {
          setErrorMessage(error.message);
        }
      }
      getPlayerInfo();
    }, [contract, gameData, battleName, walletAddress]);

    const makeAMove = async (choice) => {
      // Check if battle still exists and is active
      if (!gameData?.activeBattle) {
        setShowAlert({
          status: true,
          type: 'failure',
          message: 'Battle no longer exists! Refresh page to get to home...',
        });
        setTimeout(() => navigate('/'), 2000);
        return;
      }
      
      // Check if both players are still in the battle
      try {
        const player1InBattle = await contract.getPlayer(gameData.activeBattle.players[0]).then(p => p.inBattle);
        const player2InBattle = await contract.getPlayer(gameData.activeBattle.players[1]).then(p => p.inBattle);
        
        if (!player1InBattle || !player2InBattle) {
          setShowAlert({
            status: true,
            type: 'failure',
            message: 'A player has left the battle! Cast the Spell of Refreshing!...',
          });
          setTimeout(() => navigate('/'), 2000);
          return;
        }
      } catch (error) {
        console.error("Error checking if players are in battle:", error);
        setErrorMessage(error);
      }
      
      // Check if player has already made a move
      if (hasMadeMove) {
        setShowAlert({
          status: true,
          type: 'failure',
          message: 'You have already made your move for this round!',
        });
        return;
      }
      
      // Check if player has enough mana for attack (choice 1)
      if (choice === 1 && player1.mana < 3) {
        setShowAlert({
          status: true,
          type: 'failure',
          message: 'Insufficient mana! You need at least 3 mana to attack.',
        });
        return; // Stop execution to prevent wallet confirmation
      }
      
      playAudio(choice === 1 ? attackSound : defenseSound)
      try {
        await contract.attackOrDefendChoice(choice, battleName, { gasLimit: 200000 });
        
        setShowAlert({
          status: true,
          type: 'info',
          message: `Initiating ${choice === 1 ? 'attack' : 'defense'}`,
        });
        
        // Update local state to prevent multiple moves
        setHasMadeMove(true);

      } catch (error) {
        console.log(error);
        setErrorMessage(error);
      }
    }


    const handleAcceptTradeRequest = async () => {
        try {
            await contract.acceptTrade(currentTradeRequest.from.address);
            setShowTradeRequestModal(false);
            
            // Store that this trade was accepted in localStorage
            if (currentTradeRequest.transactionHash) {
                localStorage.setItem(`accepted_trade_${currentTradeRequest.transactionHash}`, 'true');
            }
            
            setShowAlert({
                status: true,
                type: 'success',
                message: 'Trade accepted successfully!'
            });
        } catch (error) {
            console.error("Failed to accept trade:", error);
            setErrorMessage(error.message);
        }
    };

    const handleRejectTradeRequest = async () => {
        try {
            await contract.rejectTrade(currentTradeRequest.from.address);
            setShowTradeRequestModal(false);
            
            // Store that this trade was rejected in localStorage
            if (currentTradeRequest.transactionHash) {
                localStorage.setItem(`rejected_trade_${currentTradeRequest.transactionHash}`, 'true');
            }
            
            setShowAlert({
                status: true,
                type: 'info',
                message: 'Trade rejected'
            });
        } catch (error) {
            console.error("Failed to reject trade:", error);
            setErrorMessage(error.message);
        }
    };

    useEffect(() => {
      const timeout = setTimeout(() => {
        if(!gameData?.activeBattle) navigate('/');
      }, 2000);
      return () => {
        clearTimeout(timeout);
      };
    }, []);

  return (
    <div className={`${styles.flexBetween} ${styles.gameContainer} ${battleGround} h-screen overflow-hidden`}>
      {showAlert?.status && <Alert type={showAlert.type} message={showAlert.message} />}
      
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
