const { ethers } = require("hardhat");
require("dotenv").config();

async function deployAndPauseV2() {
  const privateKey = process.env.PRIVATE_KEY;
  const [verifierAddress] = await ethers.getSigners();
  const owner = new ethers.Wallet(privateKey, ethers.provider);

  //Prev implementation
  console.log(
    "Fetching Previous Implementations of PikaStakingPool and PoolController..."
  );
  const pikaStakingFactory = await ethers.getContractFactory("PikaStakingPool");
  const directStaking = await pikaStakingFactory.attach(
    "0xF965671DeC4C8f902083e8E0845cf86aac44FD80" //Mainnnet
    // "0x42441756E08af5652727C7a7d0a9cBC989eeeA8d" //Testnet
  );
  const lpstaking = await pikaStakingFactory.attach(
    "0xFCf12ADF9Dc9967701596A12D1c7F5E447e34736" //Mainnet
    // "0x3fD4AbD102E84459274b0afB409a432483F685CF" //Testnet
  );

  const PoolControllerFactory = await ethers.getContractFactory(
    "PoolController"
  );
  const poolController = await PoolControllerFactory.attach(
    "0x1cA441f054CCD878A3f9Dba4c35092fD1e07D17f" //Mainnet
    // "0xd622aAeCDC504B95041fE3556a4DB96f17D31919" //Testnet
  );
  console.log("Successfully fetched previous implementations!!");

  //New Deployment
  console.log("Deploying new contract instance for PikaStakingPool...");
  const newStakingImplementation = await ethers.deployContract(
    "PikaStakingPoolV2",
    []
  );
  console.log(
    "Successfully deployed new contract instance for PikaStakingPool!!",
    newStakingImplementation
  );

  //LP Staking contract upgrade
  console.log("Upgrading LP Staking contract...");
  await owner.sendTransaction({
    to: lpstaking.target,
    data:
      "0x4f1ef286000000000000000000000000" +
      newStakingImplementation.target.toString().slice(2) +
      "00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000",
  });
  console.log("Successfully Upgraded LP Staking!!");

  //Direct Staking contract upgrade
  console.log("Upgrading Direct Staking...");
  await owner.sendTransaction({
    to: directStaking.target,
    data:
      "0x4f1ef286000000000000000000000000" +
      newStakingImplementation.target.toString().slice(2) +
      "00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000",
  });
  console.log("Successfully Upgraded Direct Staking!!");

  //Deploy new Upgrade for PoolController
  console.log("Deploying new PoolController implementation...");
  const poolControllerNewImpl = await ethers.deployContract(
    "PoolControllerV2",
    []
  );
  console.log("Successfully deployed new PoolController Implementation!!");

  //Upgrade PoolController to new implementation
  console.log("Upgrading PoolController to new functionality...");
  await owner.sendTransaction({
    to: poolController.target,
    data:
      "0x4f1ef286000000000000000000000000" +
      poolControllerNewImpl.target.toString().slice(2) +
      "00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000",
  });
  console.log("Successfully Upgraded PoolController to new functionality!!");
  console.log("Upgrade complete!!");
}

deployAndPauseV2()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
