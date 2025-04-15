import React, { useEffect }from 'react'
import { PageHOC } from '../components'
import { useNavigate } from 'react-router-dom'

import { useGlobalContext } from '../context'
import styles  from '../styles'
import { CustomButton } from '../components'




const JoinBattle = () => {
  const { contract, gameData, setShowAlert, setBattleName, walletAddress, setErrorMessage } = useGlobalContext();
  const navigate = useNavigate();
  const handleClick = async (battleName) => {
    setBattleName(battleName);

    try {
      await contract.joinBattle(battleName);
      setShowAlert({
        status: true,
        type: 'success',
        message: `Joining ${battleName}`
      })
      navigate(`/battle/${battleName}`);
    } catch (error) {
      setErrorMessage(error);
    }
  }

  useEffect(() => {
    if(gameData?.activeBattle?.battleStatus === 1){
      navigate(`/battle/${gameData.activeBattle.name}`);
    }
  }, [gameData])
 
  return (
    <>
      <h2 className={styles.joinHeadText}>
        Available Battles
        <div className={styles.joinContainer}>
          {gameData.pendingBattles.length
            ? gameData.pendingBattles.filter((battle) => !battle.players.includes(walletAddress))
            .map((battle, index) => (
              <div key={battle.name + index} className={styles.flexBetween}>
                <p className={styles.joinBattleTitle}>{index + 1}. {battle.name}</p>
                <CustomButton 
                  title='Join'
                  handleClick={() => handleClick(battle.name)}
                />

              </div>
            ))
            : <p className={styles.joinLoading}>Reload the name to see new battles</p>
          }
          
        </div>
      </h2>
      <p className={styles.infoText} onClick={() => navigate('/create-battle')}>OR create a new battle</p>
    </>
  );
}

export default PageHOC(
    JoinBattle,
    <>Join <br /> a Battle</>,
    <>Join already exisiting battles</>
);
