import React from 'react'
import { useNavigate } from 'react-router-dom';
import { Alert } from '../components';

import styles from '../styles';
import { battlegrounds } from '../assets';
import { useGlobalContext } from '../context';

const Battleground = () => {
    const navigate = useNavigate();

    const handleBatleGroundChoice = (ground) => {
        setBattleGround(ground.id)

        localStorage.setItem('battleground', ground.id);

        setShowAlert({
            status: true,
            type: 'info',
            message: `${ground.name} is battle ready!`
        });

        setTimeout(() => (
            navigate(-1) // Navigates back to battle page
        ), 1000);
    } 

    const { setBattleGround, showAlert, setShowAlert } = useGlobalContext();
  return (
    <div className={`${styles.flexCenter} ${styles.battlegroundContainer}`}>
        { showAlert?.status && <Alert type={showAlert.type} message={showAlert.message}/>}

        <h1 className={`${styles.headText} text-center`}>
            Choose your 
            <span className='ml-3 text-siteViolet'>Battle</span>
                Ground
        </h1>
        <div className={`${styles.flexCenter} ${styles.battleGroundsWrapper}`}>
            {battlegrounds.map((ground) => (
                <div key={ground.id}
                    className={`${styles.flexCenter} ${styles.battleGroundCard}`}
                    onClick={() => handleBatleGroundChoice(ground)}
                >
                    <img src={ground.image} alt='ground' className={styles.battleGroundCardImg} />e
                    <div className='info absolute'>
                        <p className={styles.battleGroundCardText}>{ground.name}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
  )
}

export default Battleground
