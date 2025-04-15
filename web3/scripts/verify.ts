const hre = require('hardhat');
const main = async () => {
    try {
        const [deployer] = await hre.ethers.getSigners(); // Gets signers for signing deployed contracts
    
        console.log("Verifying contract...");
    
        const contractAddress = '0x4a4C73F7265b0C0b201f92D3d6c8ab58FfE4D3ae';
    
        await hre.run("verify:verify", {
            address: contractAddress,
            constructorArguments: [],
        });
    
        console.log("Contract verified!");
        
    } catch (error) {
        console.error(error);
        
    }
}

const runMain = async () => {
    try {
        await main();
        process.exit(0);
    } catch (error) {
        console.error("Error: ", error);
        process.exit(1);
    }
}

runMain();