import { ethers } from 'ethers';
import { contractABI } from '../contract';
import { defenseSound } from '../assets';
import { playAudio, sparcle } from '../utils/animation.js'

const emptyAccount = '0x00000000000000000000000000000000000000000';

const AddNewEvent = (eventFilter, provider, cb) => {
    provider.removeListener(eventFilter);
    provider.on(eventFilter, (logs) => {
        const parsedLogs = (new ethers.utils.Interface(contractABI)).parseLog(logs)
        cb(parsedLogs);
    });
}

const getCoords = (cardRef) => {
    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    return {
        pageX: left + width / 2,
        pageY: top + height / 2.25,
    };
};

export const createEventListeners = ({ navigate, contract, provider, walletAddress, setShowAlert, setUpdateGameData, player1Ref, player2Ref }) => {
    try {
        if(contract && contract.filters) {
            const NewPlayerEventFilter = contract.filters.NewPlayer();   
            AddNewEvent(NewPlayerEventFilter, provider, ({ args }) => {
                console.log('New player created', args);
                
                if(walletAddress === args.owner){
                    setShowAlert({
                        status: true,
                        type: 'success',
                        message: 'Player has been successfully registered'
                    });
                }
            });

            const NewGameTokenEventFilter = contract.filters.NewGameToken();
            AddNewEvent(NewGameTokenEventFilter, provider, ({ args }) => {
                console.log('New game token created! ', args);

                if(walletAddress.toLowerCase() === args.owner.toLowerCase()){
                    setShowAlert({
                        status: true,
                        type: 'success',
                        message: 'Player game token has been successfully created!'
                    });
                }
                navigate('/create-battle');
            });
         
            const NewBattleEventFilter = contract.filters.NewBattle();
            AddNewEvent(NewBattleEventFilter, provider, ({ args }) => {
                console.log('New battle started!', args, walletAddress);

                // Log both player addresses for debugging
                console.log('Player1:', args.player1, 'Player2:', args.player2);

                // Extra logging for troubleshooting
                if (!walletAddress) {
                    console.log('No wallet address detected.');
                } else {
                    console.log('Current wallet:', walletAddress);
                }

                // Navigate if the current wallet is either player1 or player2
                if (
                    walletAddress &&
                    (walletAddress.toLowerCase() === args.player1.toLowerCase() ||
                     walletAddress.toLowerCase() === args.player2.toLowerCase())
                ) {
                    setShowAlert({
                        status: true,
                        type: 'success',
                        message: `Joined battle as ${walletAddress.toLowerCase() === args.player1.toLowerCase() ? 'Player 1' : 'Player 2'}`
                    });
                    navigate(`/battle/${args.battleName}`);
                }
                // Remove the else block that shows the "not a participant" alert
                // This prevents showing the alert to users who aren't in the battle

                setUpdateGameData((prevUpdateGameData) => prevUpdateGameData + 1);
            });
         
            const BattleMoveEventFilter = contract.filters.BattleMove();
            AddNewEvent(BattleMoveEventFilter, provider, ({ args }) => {
                console.log('Battle Move Initited: ', args);
            });
         
            const RoundEndedEvent = contract.filters.RoundEnded();
            AddNewEvent(RoundEndedEvent, provider, ({ args }) => {
                console.log('Round ended! ', args, walletAddress);
                
                try {
                    // Get the current battle name from the URL
                    const currentPath = window.location.pathname;
                    const battlePathMatch = currentPath.match(/\/battle\/(.+)/);
                    const currentBattleName = battlePathMatch ? battlePathMatch[1] : null;
                    
                    // Only play sounds and animations if we're in a battle
                    if (currentBattleName) {
                        // Check if the current player is one of the players in this battle
                        const isPlayerInBattle = args.damagedPlayers.some(
                            player => player.toLowerCase() === walletAddress.toLowerCase()
                        );
                        
                        if (isPlayerInBattle) {
                            let i = 0;
                            while(i < args.damagedPlayers.length){
                                if(args.damagedPlayers[i] !== emptyAccount){
                                    if(args.damagedPlayers[i] === walletAddress){
                                        sparcle(getCoords(player1Ref));
                                    } else if(args.damagedPlayers[i] !== walletAddress){
                                        sparcle(getCoords(player2Ref));
                                    }
                                } else {
                                    playAudio(defenseSound);
                                }
                                i++;
                            } 
                        }
                    }
                    
                    setUpdateGameData((prevUpdateGameData) => prevUpdateGameData + 1);
                } catch (error) {
                    console.error("Error in RoundEndedEvent:", error);
                    // Still update game data even if there's an error
                    setUpdateGameData((prevUpdateGameData) => prevUpdateGameData + 1);
                }
            });

            const BattleEndedEventFilter = contract.filters.BattleEnded();
            AddNewEvent(BattleEndedEventFilter, provider, ({ args }) => {
                console.log('Battle ended! ', args, walletAddress);

                if(walletAddress.toLowerCase() === args.winner.toLowerCase()){
                    setShowAlert({
                        status: true,
                        type: 'success',
                        message: 'You won'
                    });
                } else if (walletAddress.toLowerCase() === args.loser.toLowerCase()){
                    setShowAlert({
                        status: true,
                        type: 'failure',
                        message: 'You lost'
                    });
                }
                navigate('/create-battle');
            });

            // Trade-related event listeners
            const TradeRequestedEventFilter = contract.filters.TradeRequested();
            AddNewEvent(TradeRequestedEventFilter, provider, ({ args }) => {
                if (walletAddress.toLowerCase() === args.to.toLowerCase()) {
                    setShowAlert({
                        status: true,
                        type: 'info',
                        message: 'You have received a trade request!'
                    });
                }
            });

            const TradeAcceptedEventFilter = contract.filters.TradeAccepted();
            AddNewEvent(TradeAcceptedEventFilter, provider, ({ args }) => {
                if (walletAddress.toLowerCase() === args.from.toLowerCase() || 
                    walletAddress.toLowerCase() === args.to.toLowerCase()) {
                    setShowAlert({
                        status: true,
                        type: 'success',
                        message: 'Trade completed successfully!'
                    });
                }
            });

            const TradeRejectedEventFilter = contract.filters.TradeRejected();
            AddNewEvent(TradeRejectedEventFilter, provider, ({ args }) => {
                if (walletAddress.toLowerCase() === args.from.toLowerCase()) {
                    setShowAlert({
                        status: true,
                        type: 'failure',
                        message: 'Trade request was rejected'
                    });
                }
            });
        }
    } catch (error) {
        console.error("Error creating event listeners:", error);
    }
};
    