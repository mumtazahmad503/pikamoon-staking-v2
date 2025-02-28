const { network, ethers, upgrades } = require("hardhat");
const { verify } = require("../utils/verification");
const { developmentChains } = require("../helper-hardhat.config");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log, save } = deployments;
  const { deployer } = await getNamedAccounts();

  log("-------------------------------------------------");
  log("Deploying PikaStakingPool and setting up proxy...");

  const pika = await ethers.getContract("PikaMoon", deployer);
  const poolController = await ethers.getContract("PoolController", deployer);

  // Deploy the upgradeable contract
  const PikaStakingPool = await ethers.getContractFactory("PikaStakingPool");
  const pikaStakingPool = await upgrades.deployProxy(
    PikaStakingPool,
    [pika.target, pika.target, poolController, 200],
    {
      initializer: "initialize",
      kind: "uups",
    }
  );

  await pikaStakingPool.waitForDeployment();
  const proxyAddress = await pikaStakingPool.getAddress();
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    proxyAddress
  );

  // Save the proxy contract to deployments
  await save("PikaStakingPool", {
    address: proxyAddress,
    abi: JSON.parse(PikaStakingPool.interface.formatJson()),
  });

  log(`PikaStakingPool Proxy deployed to: ${proxyAddress}`);
  log(`Implementation deployed to: ${implementationAddress}`);

  // Verify on non-development chains
  if (!developmentChains.includes(network.name)) {
    log("Verifying implementation contract...");
    await verify(implementationAddress, []);
  }

  log("-------------------------------------------------");
  log("PikaStakingPool successfully deployed and initialized!");
};

module.exports.tags = ["all", "PikaStakingPool"];
