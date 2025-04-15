import { ethers } from 'hardhat';

async function deploy(name: string, ...params: [string]) {
  const contractFactory = await ethers.getContractFactory(name);
  const contract = await contractFactory.deploy(...params);
  await contract.waitForDeployment();
  return contract;
}

async function main() {
  const [admin] = await ethers.getSigners();

  console.log(`Deploying a smart contract...`);

  const _metadataUri = 'https://gateway.pinata.cloud/ipfs/QmX2ubhtBPtYw75Wrpv6HLb1fhbJqxrnbhDo1RViW3oVoi';
  const AVAXGods = await deploy('AVAXGods', _metadataUri);

  console.log({ AVAXGods: await AVAXGods.getAddress() });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

//https://gateway.pinata.cloud/ipfs/