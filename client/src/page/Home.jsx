import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useGlobalContext } from '../context/index';
import { PageHOC, CustomInput, CustomButton, Loader } from '../components';
import { useNavigate } from 'react-router-dom';
import hero from '../assets/sounds/hero.mp3';
import { AiFillPlayCircle } from 'react-icons/ai';

const Home = () => {
  const { contract, walletAddress, setShowAlert, setErrorMessage, gameData } = useGlobalContext();
  const [playerName, setPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const navigate = useNavigate();

  const handleClick = async () => {
    // Handle player registration logic
    // This block seems fine 

    if (playerName.trim() === '') {
      setShowAlert({
        status: true,
        type: 'failure',
        message: 'Player name is required. Please enter a valid name.'
      });

      return;
    }

    try {
      setIsLoading(true); // Set loading state to true before async operation
      setLoadingMessage('Registering player . . .'); // Set loading message

      console.log(walletAddress);
      const playerExists = await contract.isPlayer(walletAddress);
      if (!playerExists) {
        await contract.registerPlayer(playerName, playerName, {
          gasLimit: 500000
        });
        setShowAlert({
          status: true,
          type: 'info',
          message: `${playerName} is being summoned!`
        });
        navigate('/create-battle');
      }
    } catch (error) {
      setErrorMessage(error);
    } finally {
      setIsLoading(false); // Set loading state to false after async operation
    }
  };

  useEffect(() => {
    const checkForPlayerToken = async () => {
      setIsLoading(true); // Set loading state to true before async operation
      setLoadingMessage('Checking for player token . . .'); // Set loading message
      console.log("Player Name before registerPlayer:", playerName);
      const playerExists = await contract.isPlayer(walletAddress);
      const playerTokenExists = await contract.isPlayerToken(walletAddress);

      if (playerExists && playerTokenExists) {
        navigate('/create-battle');
      } else {
        setShowAlert({
          status: true,
          type: 'failure',
          message: 'Please register player!'
        })
        setIsLoading(false); // Set loading state to false if navigation doesn't occur
      }

      console.log({
        playerExists,
        playerTokenExists
      });
    };

    if (contract) {
      checkForPlayerToken();
    }
  }, [contract, navigate, walletAddress]);

  // Handle active battle navigation
  useEffect(() => {
    if (gameData?.activeBattle) {
      navigate(`/battle/${gameData.activeBattle.name}`);
    }
    return () => { };
  }, [gameData, navigate]);

  // Music component with forwarding ref
  const Music = forwardRef(({ music }, ref) => {
    const audioRef = useRef(new Audio(music));

    // Manage audio state (play, pause)
    useImperativeHandle(ref, () => ({
      playAudio: () => {
        // Pause and reset any existing playback
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        // Play the audio
        audioRef.current.play().catch((error) => {
          console.error('Error playing audio:', error);
        });
      },
    }));

    return null; // No UI to render, just side effects
  });

  // Create a ref for the Music component
  const musicRef = useRef(null);

  // Function to handle the play audio button click
  const handleButtonClick = () => {
    // Play audio using the ref if available
    if (musicRef.current) {
      musicRef.current.playAudio();
    }
  };

  return (
    <div className="flex flex-col">
      {isLoading && <Loader message={loadingMessage} />}
      {!isLoading && (
        <>
          <CustomInput
            id="Name"
            label="Name"
            placeholder="Enter your player name"
            value={playerName}
            autocompleteValue='on'
            // handleValueChange={setPlayerName}
            handleValueChange={(newValue) => {
              setPlayerName(newValue);
              console.log("playerName updated:", newValue);}}
          />
          <CustomButton
            title="Register"
            handleClick={handleClick}
            restStyles="mt-6"
          />
          {/* Play music button */}
          <button onClick={handleButtonClick} className='text-[#cf3672] flex items-center justify-center'>
            <AiFillPlayCircle fontSize={15} className='justify-start' /><p className='p-1 text-sm '>Play Music</p>  </button>
        </>
      )}
      {/* Include the Music component and pass the ref */}
      <Music music={hero} ref={musicRef} />
    </div>
  );
};

export default PageHOC(
  Home,
  <>Welcome to Aether Knights <br /> a Web3 NFT Card Game</>,
  <>Connect your wallet to start playing <br /> the ultimate Web3 Battle Card Game</>
);