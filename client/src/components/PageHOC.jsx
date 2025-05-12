import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logo, heroImg } from '../assets';
import styles from '../styles';
import { useGlobalContext } from '../context';
import Alert from './Alert';

const PageHOC = (Component, title = '', description = '') => () => {
    const { showAlert } = useGlobalContext();
    const navigate = useNavigate();

    return (

        <div className={`${styles.hocContainer}`}>
            {showAlert?.status && <Alert type={showAlert.type} message={showAlert.message} />}

            <div className={`${styles.hocContentBox} flex `}>
                <div className='flex'>
                    <img src={logo}
                    alt='logo'
                    className={styles.hocLogo}
                    onClick={() => navigate('/')}/>

                </div>
                <div className={styles.hocBodyWrapper}>
                    <div className='flex flex-row w-full'>
                        <h1 className={`flex ${styles.headText}`}>{title}</h1>
                    </div>
                    <p className={`${styles.normalText} my-10`}>{description}</p>

                    <Component /> {/* Render the passed-in component */}
                </div>

                <p className={`${styles.footerText} caveat`}>Made by: Isha Hani || Ramin Qaiser || Nisha Shaukat</p>
            </div>

            <div className='flex flex-1'>
                <img src={heroImg}
                    alt='hero-img'
                    className='w-full xl:hfull object-cover'
                />
            </div>
        </div>
    );
};

export default PageHOC;
