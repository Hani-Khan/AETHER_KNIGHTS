// // import React, { useState } from "react";
// // import { useNavigate } from "react-router-dom";

// // import CustomButton from "./CustomButton";
// // import { useGlobalContext } from "../context";

// // import { alertIcon, gameRules } from "../assets";
// // import styles from "../styles";

// // const GameInfo = () => {
// //   const { contract, gameData, setShowAlert, setErrorMessage } =
// //     useGlobalContext();
// //   const [toggleSideBar, setToggleSideBar] = useState(false);

// //   const navigate = useNavigate();
// //   const handleBattleExit = async () => {
// //     const battleName = gameData.activeBattle.name;
// //     try {
// //       await contract.quitBattle(battleName, { gasLimit: 200000 });
// //       setShowAlert({
// //         status: true,
// //         type: "info",
// //         message: `You're quitting ${battleName} battle`,
// //       });
// //     } catch (error) {
// //       setErrorMessage(error);
// //     }
// //   };
// //   return (
// //     <>
// //       <div className={styles.gameInfoIconBox}>
// //         <div
// //           className={`${styles.gameInfoIcon} ${styles.flexCenter}`}
// //           onClick={() => setToggleSideBar(true)}
// //         >
// //           <img src={alertIcon} alt="info" className={styles.gameInfoIconImg} />
// //         </div>
// //       </div>
// //       <div
// //         className={`${styles.gameInfoSidebar} ${
// //           toggleSideBar ? "translate-x-0" : "translate-x-full"
// //         } ${styles.glassEffect} ${styles.flexBetween} backdrop-blur-3xl`}
// //       >
// //         <div className="flex flex-col">
// //           <div className={styles.gameInfoSidebarCloseBox}>
// //             <div
// //               className={`${styles.flexCenter} ${styles.gameInfoSidebarClose}`}
// //               onClick={() => setToggleSideBar(false)}
// //             >
// //               x
// //             </div>
// //           </div>
// //           <h3 className={styles.gameInfoHeading}>Game Rules:</h3>
// //           <div className="mt-3">
// //             {gameRules.map((rule, index) => (
// //               <p key={`game-rule-${index}`} className={styles.gameInfoText}>
// //                 <span className="font-bold">{index + 1}</span>. {rule}
// //               </p>
// //             ))}
// //           </div>
// //         </div>
// //         <div className={`${styles.flexBetween} mt-10 gap-4 w-full`}>
// //           <CustomButton
// //             title="Change BattleGround"
// //             handleClick={() => navigate("/battleground")}
// //           />

// //           <CustomButton
// //             title="Trade Card"
// //             handleClick={() => navigate("/TradeCard")}
// //           />

// //           <CustomButton title="Exit Battle" handleClick={handleBattleExit} />
// //         </div>
// //       </div>
// //     </>
// //   );
// // };

// // export default GameInfo;

// //------------------------------------------------------------------------------------------------------------------
// // //DEEPLY ENHANCED 2
// // import React, { useState } from "react";
// // import { useNavigate } from "react-router-dom";
// // import CustomButton from "./CustomButton";
// // import { useGlobalContext } from "../context";
// // import { alertIcon, gameRules } from "../assets";
// // import styles from "../styles";

// // const GameInfo = () => {
// //   const { 
// //     contract, 
// //     gameData, 
// //     setShowAlert, 
// //     setErrorMessage,
// //     showPlayerStats,
// //     setShowPlayerStats
// //   } = useGlobalContext();
// //   const [toggleSideBar, setToggleSideBar] = useState(false);
// //   const navigate = useNavigate();

// //   // Debug log to verify state
// //   console.log("Current showPlayerStats:", showPlayerStats);

// //   const handleBattleExit = async () => {
// //     const battleName = gameData.activeBattle.name;
// //     try {
// //       await contract.quitBattle(battleName, { gasLimit: 200000 });
// //       setShowAlert({
// //         status: true,
// //         type: "info",
// //         message: `You're quitting ${battleName} battle`,
// //       });
// //     } catch (error) {
// //       setErrorMessage(error);
// //     }
// //   };

// //   const handleToggleStats = () => {
// //     const newValue = !showPlayerStats;
// //     console.log("Toggling from", showPlayerStats, "to", newValue); // Debug log
// //     setShowPlayerStats(newValue);
// //     setShowAlert({
// //       status: true,
// //       type: "info",
// //       message: `Trade functionality ${newValue ? "enabled" : "disabled"}`,
// //     });
// //   };

// //   return (
// //     <>
// //       <div className={styles.gameInfoIconBox}>
// //         <div
// //           className={`${styles.gameInfoIcon} ${styles.flexCenter}`}
// //           onClick={() => setToggleSideBar(true)}
// //         >
// //           <img src={alertIcon} alt="info" className={styles.gameInfoIconImg} />
// //         </div>
// //       </div>
// //       <div
// //         className={`${styles.gameInfoSidebar} ${
// //           toggleSideBar ? "translate-x-0" : "translate-x-full"
// //         } ${styles.glassEffect} ${styles.flexBetween} backdrop-blur-3xl`}
// //       >
// //         <div className="flex flex-col">
// //           <div className={styles.gameInfoSidebarCloseBox}>
// //             <div
// //               className={`${styles.flexCenter} ${styles.gameInfoSidebarClose}`}
// //               onClick={() => setToggleSideBar(false)}
// //             >
// //               x
// //             </div>
// //           </div>
// //           <h3 className={styles.gameInfoHeading}>Game Rules:</h3>
// //           <div className="mt-3">
// //             {gameRules.map((rule, index) => (
// //               <p key={`game-rule-${index}`} className={styles.gameInfoText}>
// //                 <span className="font-bold">{index + 1}</span>. {rule}
// //               </p>
// //             ))}
// //           </div>
          
// //           {/* Updated toggle switch with more reliable styling */}
// //           <div className="mt-6 flex items-center">
// //             <label htmlFor="toggleStats" className="flex items-center cursor-pointer">
// //               <div className="relative">
// //                 <input 
// //                   type="checkbox" 
// //                   id="toggleStats" 
// //                   className="sr-only" 
// //                   checked={showPlayerStats}
// //                   onChange={handleToggleStats}
// //                 />
// //                 <div className={`block w-14 h-8 rounded-full transition-colors duration-200 ease-in-out ${
// //                   showPlayerStats ? 'bg-green-500' : 'bg-gray-600'
// //                 }`}></div>
// //                 <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-all duration-200 ease-in-out ${
// //                   showPlayerStats ? 'transform translate-x-6' : 'transform translate-x-0'
// //                 }`}></div>
// //               </div>
// //               <div className="ml-3 text-white font-medium">
// //                 Enable Trade: {showPlayerStats ? "ON" : "OFF"}
// //               </div>
// //             </label>
// //           </div>
// //         </div>
// //         <div className={`${styles.flexBetween} mt-10 gap-4 w-full`}>
// //           <CustomButton
// //             title="Change BattleGround"
// //             handleClick={() => navigate("/battleground")}
// //           />
// //           <CustomButton
// //             title="Trade Card"
// //             handleClick={() => navigate("/TradeCard")}
// //           />
// //           <CustomButton 
// //             title="Exit Battle" 
// //             handleClick={handleBattleExit} 
// //           />
// //         </div>
// //       </div>
// //     </>
// //   );
// // };

// // export default GameInfo;
// //==============================================
// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import CustomButton from "./CustomButton";
// import { useGlobalContext } from "../context";
// import { alertIcon, gameRules } from "../assets";
// import styles from "../styles";

// const GameInfo = () => {
//   const { 
//     contract, 
//     gameData, 
//     setShowAlert, 
//     setErrorMessage,
//     showPlayerStats: contextShowStats,
//     setShowPlayerStats: contextSetStats,
//     walletAddress
//   } = useGlobalContext();
  
//   const [localShowStats, setLocalShowStats] = useState(false);
//   const [toggleSideBar, setToggleSideBar] = useState(false);
//   const navigate = useNavigate();

//   const showPlayerStats = typeof contextShowStats !== 'undefined' ? contextShowStats : localShowStats;
//   const setShowPlayerStats = typeof contextSetStats === 'function' ? contextSetStats : setLocalShowStats;

//   const handleBattleExit = async () => {
//     const battleName = gameData.activeBattle.name;
//     try {
//       await contract.quitBattle(battleName, { gasLimit: 200000 });
//       setShowAlert({
//         status: true,
//         type: "info",
//         message: `You're quitting ${battleName} battle`,
//       });
//     } catch (error) {
//       setErrorMessage(error);
//     }
//   };

//   const handleToggleStats = async () => {
//     try {
//       const newValue = !showPlayerStats;
      
//       if (contract && walletAddress) {
//         const tx = await contract.setTradePreference(newValue);
//         await tx.wait();
//       }
      
//       setShowPlayerStats(newValue);
//       setShowAlert({
//         status: true,
//         type: "info",
//         message: `Trade functionality ${newValue ? "enabled" : "disabled"}`,
//       });
//     } catch (error) {
//       console.error("Error toggling stats:", error);
//       setShowAlert({
//         status: true,
//         type: "failure",
//         message: "Failed to update trade settings",
//       });
//     }
//   };

//   return (
//     <>
//       <div className={styles.gameInfoIconBox}>
//         <div
//           className={`${styles.gameInfoIcon} ${styles.flexCenter}`}
//           onClick={() => setToggleSideBar(true)}
//         >
//           <img src={alertIcon} alt="info" className={styles.gameInfoIconImg} />
//         </div>
//       </div>
//       <div
//         className={`${styles.gameInfoSidebar} ${
//           toggleSideBar ? "translate-x-0" : "translate-x-full"
//         } ${styles.glassEffect} ${styles.flexBetween} backdrop-blur-3xl`}
//       >
//         <div className="flex flex-col">
//           <div className={styles.gameInfoSidebarCloseBox}>
//             <div
//               className={`${styles.flexCenter} ${styles.gameInfoSidebarClose}`}
//               onClick={() => setToggleSideBar(false)}
//             >
//               x
//             </div>
//           </div>
//           <h3 className={styles.gameInfoHeading}>Game Rules:</h3>
//           <div className="mt-3">
//             {gameRules.map((rule, index) => (
//               <p key={`game-rule-${index}`} className={styles.gameInfoText}>
//                 <span className="font-bold">{index + 1}</span>. {rule}
//               </p>
//             ))}
//           </div>
          
//           <div className="mt-6 flex items-center">
//             <label htmlFor="toggleStats" className="flex items-center cursor-pointer">
//               <div className="relative">
//                 <input 
//                   type="checkbox" 
//                   id="toggleStats" 
//                   className="sr-only" 
//                   checked={showPlayerStats}
//                   onChange={handleToggleStats}
//                 />
//                 <div className={`block w-14 h-8 rounded-full transition-colors duration-300 ease-in-out ${
//                   showPlayerStats ? 'bg-green-500' : 'bg-gray-600'
//                 }`}></div>
//                 <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-all duration-300 ease-in-out ${
//                   showPlayerStats ? 'translate-x-6' : 'translate-x-0'
//                 }`}></div>
//               </div>
//               <div className="ml-3 text-white font-medium">
//                 Enable Trade: {showPlayerStats ? "ON" : "OFF"}
//               </div>
//             </label>
//           </div>
//         </div>
//         <div className={`${styles.flexBetween} mt-10 gap-4 w-full`}>
//           <CustomButton
//             title="Change BattleGround"
//             handleClick={() => navigate("/battleground")}
//           />
//           <CustomButton
//             title="Trade Card"
//             handleClick={() => navigate("/TradeCard")}
//           />
//           <CustomButton 
//             title="Exit Battle" 
//             handleClick={handleBattleExit} 
//           />
//         </div>
//       </div>
//     </>
//   );
// };

// export default GameInfo;
///////////////////////////////////////
// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import CustomButton from "./CustomButton";
// import { useGlobalContext } from "../context";
// import { alertIcon, gameRules } from "../assets";
// import styles from "../styles";

// const GameInfo = () => {
//   const { 
//     contract, 
//     gameData, 
//     setShowAlert, 
//     setErrorMessage,
//     showPlayerStats: contextShowStats,
//     setShowPlayerStats: contextSetStats,
//     walletAddress
//   } = useGlobalContext();
  
//   const [localShowStats, setLocalShowStats] = useState(false);
//   const [toggleSideBar, setToggleSideBar] = useState(false);
//   const navigate = useNavigate();

//   const showPlayerStats = typeof contextShowStats !== 'undefined' ? contextShowStats : localShowStats;
//   const setShowPlayerStats = typeof contextSetStats === 'function' ? contextSetStats : setLocalShowStats;

//   const handleBattleExit = async () => {
//     const battleName = gameData.activeBattle.name;
//     try {
//       await contract.quitBattle(battleName, { gasLimit: 200000 });
//       setShowAlert({
//         status: true,
//         type: "info",
//         message: `You're quitting ${battleName} battle`,
//       });
//     } catch (error) {
//       setErrorMessage(error);
//     }
//   };

//   const handleToggleStats = async () => {
//     try {
//       const newValue = !showPlayerStats;
      
//       if (contract && walletAddress) {
//         const tx = await contract.setTradePreference(newValue);
//         await tx.wait();
//       }
      
//       setShowPlayerStats(newValue);
//       setShowAlert({
//         status: true,
//         type: "info",
//         message: `Trade functionality ${newValue ? "enabled" : "disabled"}`,
//       });
//     } catch (error) {
//       console.error("Error toggling stats:", error);
//       setShowAlert({
//         status: true,
//         type: "failure",
//         message: "Failed to update trade settings",
//       });
//     }
//   };

//   return (
//     <>
//       <div className={styles.gameInfoIconBox}>
//         <div
//           className={`${styles.gameInfoIcon} ${styles.flexCenter}`}
//           onClick={() => setToggleSideBar(true)}
//         >
//           <img src={alertIcon} alt="info" className={styles.gameInfoIconImg} />
//         </div>
//       </div>
//       <div
//         className={`${styles.gameInfoSidebar} ${
//           toggleSideBar ? "translate-x-0" : "translate-x-full"
//         } ${styles.glassEffect} ${styles.flexBetween} backdrop-blur-3xl`}
//       >
//         <div className="flex flex-col">
//           <div className={styles.gameInfoSidebarCloseBox}>
//             <div
//               className={`${styles.flexCenter} ${styles.gameInfoSidebarClose}`}
//               onClick={() => setToggleSideBar(false)}
//             >
//               x
//             </div>
//           </div>
//           <h3 className={styles.gameInfoHeading}>Game Rules:</h3>
//           <div className="mt-3">
//             {gameRules.map((rule, index) => (
//               <p key={`game-rule-${index}`} className={styles.gameInfoText}>
//                 <span className="font-bold">{index + 1}</span>. {rule}
//               </p>
//             ))}
//           </div>
          
//           {/* <div className="mt-6 flex items-center">
//             <label htmlFor="toggleStats" className="flex items-center cursor-pointer">
//               <div className="relative">
//                 <input 
//                   type="checkbox" 
//                   id="toggleStats" 
//                   className="sr-only" 
//                   checked={showPlayerStats}
//                   onChange={handleToggleStats}
//                 />
//                 <div className={`block w-14 h-8 rounded-full transition-colors duration-300 ease-in-out ${
//                   showPlayerStats ? 'bg-green-500' : 'bg-gray-600'
//                 }`}></div>
//                 <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-all duration-300 ease-in-out ${
//                   showPlayerStats ? 'translate-x-6' : 'translate-x-0'
//                 }`}></div>
//               </div>
//               <div className="ml-3 text-white font-medium">
//                 Enable Trade: {showPlayerStats ? "ON" : "OFF"}
//               </div>
//             </label>
//           </div> */}
//         </div>
//         <div className={`${styles.flexBetween} mt-10 gap-4 w-full`}>
//           <CustomButton
//             title="Change BattleGround"
//             handleClick={() => navigate("/battleground")}
//           />
//           <CustomButton
//             title="Trade Card"
//             handleClick={() => navigate("/TradeCard")}
//           />
//           <CustomButton 
//             title="Exit Battle" 
//             handleClick={handleBattleExit} 
//           />
//         </div>
//       </div>
//     </>
//   );
// };

// export default GameInfo;
//......................................................
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
        message: `You're quitting ${battleName} battle`,
      });
    } catch (error) {
      setErrorMessage(error);
    }
  };

  return (
    <>
      <div className={styles.gameInfoIconBox}>
        <div
          className={`${styles.gameInfoIcon} ${styles.flexCenter}`}
          onClick={() => setToggleSideBar(true)}
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