   
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import { useNavigate } from 'react-router-dom';

import { contractABI, contractAddress } from '../contract/index.js';
import { createEventListeners } from './createEventListeners.js';
import { GetParams } from '../utils/onboard';
import { player01 } from '../assets/index.js';

const { ethereum } = window;
const GlobalContext = createContext();

export const GlobalContextProvider = ({ children }) => {
    const [walletAddress, setWalletAddress] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [provider, setProvider] = useState(null);
    const [contract, setContract] = useState('');
    const [showAlert, setShowAlert] = useState({ status: false, type: 'info', message: ''});
    const [battleName, setBattleName] = useState('');
    const [gameData, setGameData] = useState({
        players: [], pendingBattles: [], activeBattle: null
    });
    // Add global state for trade requests
    const [showTradeRequestModal, setShowTradeRequestModal] = useState(false);
    const [currentTradeRequest, setCurrentTradeRequest] = useState(null);
    const [updateGameData, setUpdateGameData] = useState(0);
    const navigate = useNavigate();
    const [battleGround, setBattleGround] = useState('bg-astral');
    const [step, setStep] = useState(1);
    const [errorMessage, setErrorMessage] = useState('');

    const player1Ref = useRef();
    const player2Ref = useRef();
    
    useEffect(() => {
        const battleGroundFromLocalStorage = localStorage.getItem('battleground');
        if(battleGroundFromLocalStorage) {
            setBattleGround(battleGroundFromLocalStorage)
        } else {
            localStorage.setItem('battleground', battleGround);
        }
    }, []);
    
    // Reset web3 onboarding modal params
    useEffect(() => {
        const resetParams = async () => {
            const currentStep = await GetParams();

            setStep(currentStep.step);
        }

        resetParams();

        window?.ethereum.on('chainChanged', () =>  resetParams());
        window?.ethereum.on('accountsChanged', () =>  resetParams());
    }, []);
    
    


    // Set the wallet address to the state
    const updateCurrentWalletAddress = () => new Promise((resolve, reject) => {
        try {
            if(!ethereum){
                alert("Please install Core Wallet");
                return;
            }
            window?.ethereum?.request({ method: "eth_requestAccounts"})
            .then((accounts) => {
                console.log(accounts, " authorized connection");
                setWalletAddress(accounts[0]);
                console.log(accounts[0], " is set");
                resolve(accounts);
            }).catch((error) => {
                console.error(error);
                reject(new Error("Error: ", error));
            })
        } catch (error) {
            console.error(error);
            reject(error);
        }}
    );


    useEffect(() => {
        const waitForWalletConnection = async () => {
            let timeout;
            try {
                await updateCurrentWalletAddress();
            } catch (error) {
                console.error(error);
            }
            window?.ethereum?.on('accountsChanged', updateCurrentWalletAddress);
            return () => clearTimeout(timeout);
        };

        const timeout = setTimeout(() => {
            waitForWalletConnection();
        }, 10000);
        
        return () => clearTimeout(timeout);
    }, []);
    
        
    // Set the contract and provider to the state
    useEffect(() => {
        const setSmartContractandProvider = () => new Promise((resolve, reject) => {
            try {
                
                const { Contract, providers: { Web3Provider }} = ethers;
                const web3modal = new Web3Modal({
                    network: "fuji",
                    cacheProvider: true
                });
                web3modal.connect().then((connection) => {
                    if(connection){
                        const newProvider = new Web3Provider(connection);
                        const signer = newProvider.getSigner();
                        const newContract = new Contract(contractAddress, contractABI, signer);
                        console.log("New contract instance:", newContract);

                        setProvider(newProvider);
                        setContract(newContract);
                        resolve(connection);
                    }
                }).catch((error) => {
                    console.error(error);
                    reject(new Error('unable to connect'));
                });
            } catch (error) {
                console.error(error);
                reject(error);
            }
        });
       
        const timeout = setTimeout(() => {
            setSmartContractandProvider();
        }, 0) 

        return () => clearTimeout(timeout);
    }, []);

    // Add function to fetch incoming trade requests
    const fetchIncomingRequests = async () => {
        if (!contract || !walletAddress) return;
        
        try {
            // Get the current block number
            const currentBlock = await contract.provider.getBlockNumber();
            // Set a reasonable block range (last 2000 blocks to stay under the 2048 limit)
            const fromBlock = Math.max(0, currentBlock - 2000);
            
            // Get trade events from contract with limited block range
            const filter = contract.filters.TradeRequested(null, walletAddress);
            const events = await contract.queryFilter(filter, fromBlock, currentBlock);
            
            const requests = [];
            
            // Process each event to get the trade request details
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
            
            // If there are requests, show the first one
            if (requests.length > 0) {
                setCurrentTradeRequest(requests[0]);
                setShowTradeRequestModal(true);
            }
        } catch (error) {
            console.error("Failed to fetch incoming requests:", error);
            setErrorMessage(error.message);
        }
    };

    // Handle accept trade
    const handleAcceptTrade = async (request) => {
        try {
            await contract.acceptTrade(request.from.address);
            setShowAlert({
                status: true,
                type: 'success',
                message: 'Trade accepted successfully!'
            });
            
            // Mark this trade as accepted in localStorage
            if (request.transactionHash) {
                localStorage.setItem(`accepted_trade_${request.transactionHash}`, 'true');
            }
            
            // Close the modal
            setShowTradeRequestModal(false);
            setCurrentTradeRequest(null);
            
            // Refresh game data
            setUpdateGameData((prev) => prev + 1);
        } catch (error) {
            console.error("Failed to accept trade:", error);
            setShowAlert({
                status: true,
                type: 'failure',
                message: 'Failed to accept trade'
            });
        }
    };

    // Handle reject trade
    const handleRejectTrade = (request) => {
        // Mark this trade as rejected in localStorage
        if (request.transactionHash) {
            localStorage.setItem(`rejected_trade_${request.transactionHash}`, 'true');
        }
        
        // Close the modal
        setShowTradeRequestModal(false);
        setCurrentTradeRequest(null);
        
        setShowAlert({
            status: true,
            type: 'info',
            message: 'Trade request rejected'
        });
    };

    // Update the event listeners to check for trade requests
    useEffect(() => {
        if(!contract && step === -1) return;
        createEventListeners({
            navigate,
            battleName,
            contract, 
            provider, 
            walletAddress, 
            setShowAlert,
            player1Ref,
            player2Ref,
            setUpdateGameData,
            updateCurrentWalletAddress,
            fetchIncomingRequests // Add this to check for trade requests
        });
    }, [contract, walletAddress, step]);


   useEffect(() => {
    let timeout;
    if(showAlert?.status){
        timeout = setTimeout(() => {
            setShowAlert({ status: false, type: '', message: ''});
        }, 5000);
        
        return () => clearTimeout(timeout);
    }

   }, [showAlert]);


   'exection reverted: this is an error message'
   useEffect(() => {
        if(errorMessage){
            const parsedErrorMessage = errorMessage?.reason?.slice('execution reverted: '.length).slice(0, -1);
            if(parsedErrorMessage){
                setShowAlert({
                    status: true,
                    type: 'failure',
                    message: parsedErrorMessage
                })
            }; 
        }
   }, [errorMessage]);
useEffect(() => {
    const fetchGameData = async () => {
      if (!contract || !walletAddress) return;
      try {
        const fetchedBattles = await contract.getAllBattles();
        console.log('Fetched Battles: ', fetchedBattles);
  
        const pendingBattles = fetchedBattles.filter((battle) => battle.battleStatus == 0);
        console.log('Pending Battles: ', pendingBattles);
  
        let activeBattle = null;
        fetchedBattles.forEach((battle) => {
          if (battle.players.find((player) => player.toLowerCase() === walletAddress.toLowerCase())) {
            if (battle.winner.startsWith('0x00')) {
              activeBattle = battle;
            }
          }
        });
        console.log('Player address: ', activeBattle);
  
        setGameData({ pendingBattles: pendingBattles.slice(1), activeBattle });
      } catch (error) {
        console.error(error);
      }
    };
  
    fetchGameData();
  }, [contract, walletAddress, updateGameData]);


    // Make sure these functions are included in the context value
    return (
        <GlobalContext.Provider value={{
            contract,
            walletAddress,
            showAlert,
            setShowAlert,
            battleName,
            setBattleName,
            gameData,
            setGameData,
            battleGround,
            setBattleGround,
            errorMessage,
            setErrorMessage,
            player1Ref,
            player2Ref,
            updateCurrentWalletAddress,
            // Add these trade-related functions and state
            showTradeRequestModal,
            setShowTradeRequestModal,
            currentTradeRequest,
            setCurrentTradeRequest,
            handleAcceptTrade,
            handleRejectTrade,
            // Add any other missing context values
          }}
        >
          {children}
        </GlobalContext.Provider>
      );
}

export const useGlobalContext = () => useContext(GlobalContext);
   
   