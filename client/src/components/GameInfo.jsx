import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomButton from "./CustomButton";
import { useGlobalContext } from "../context";
import { alertIcon, gameRules } from "../assets";
import styles from "../styles";

const GameInfo = () => {
  const { 
    contract, 
    gameData, 
    setShowAlert, 
    setErrorMessage,
    walletAddress
  } = useGlobalContext();
  
  const [toggleSideBar, setToggleSideBar] = useState(false);
  const navigate = useNavigate();

  const handleBattleExit = async () => {
    const battleName = gameData.activeBattle.name;
    try {
      await contract.quitBattle(battleName, { gasLimit: 200000 });
      setShowAlert({
        status: true,
        type: "info",
        message: `You're quitting ${battleName} battle, Refresh the page to go to main menue`,
      });
    } catch (error) {
      setErrorMessage(error);
    }
  };

  const checkBattleStatus = async () => {
    // Check if battle still exists and is active
    if (!gameData?.activeBattle) {
      setShowAlert({
        status: true,
        type: 'failure',
        message: 'Battle no longer exists! Refresh page to get to home...',
      });
      setTimeout(() => navigate('/'), 2000);
      return false;
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
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error checking if players are in battle:", error);
      setErrorMessage(error);
      return false;
    }
  };

  const handleInfoButtonClick = async () => {
    const isBattleActive = await checkBattleStatus();
    if (isBattleActive) {
      setToggleSideBar(true);
    }
  };

  return (
    <>
      <div className={styles.gameInfoIconBox}>
        <div
          className={`${styles.gameInfoIcon} ${styles.flexCenter}`}
          onClick={handleInfoButtonClick}
        >
          <img src={alertIcon} alt="info" className={styles.gameInfoIconImg} />
        </div>
      </div>
      <div
        className={`${styles.gameInfoSidebar} ${
          toggleSideBar ? "translate-x-0" : "translate-x-full"
        } ${styles.glassEffect} ${styles.flexBetween} backdrop-blur-3xl`}
      >
        <div className="flex flex-col">
          <div className={styles.gameInfoSidebarCloseBox}>
            <div
              className={`${styles.flexCenter} ${styles.gameInfoSidebarClose}`}
              onClick={() => setToggleSideBar(false)}
            >
              x
            </div>
          </div>
          <h3 className={styles.gameInfoHeading}>Game Rules:</h3>
          <div className="mt-3">
            {gameRules.map((rule, index) => (
              <p key={`game-rule-${index}`} className={styles.gameInfoText}>
                <span className="font-bold">{index + 1}</span>. {rule}
              </p>
            ))}
          </div>
        </div>
        <div className={`${styles.flexBetween} mt-10 gap-4 w-full`}>
          <CustomButton
            title="Change BattleGround"
            handleClick={() => navigate("/battleground")}
          />
          <CustomButton
            title="Trade Card"
            handleClick={() => navigate("/TradeCard")}
          />
          <CustomButton 
            title="Exit Battle" 
            handleClick={handleBattleExit} 
          />
        </div>
      </div>
    </>
  );
};

export default GameInfo;