const { network, ethers, upgrades } = require("hardhat");
const { verify } = require("../utils/verification");
const { developmentChains } = require("../helper-hardhat.config");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log, save } = deployments;
  const { deployer } = await getNamedAccounts();

  log("-------------------------------------------------");
  log("Deploying PoolController and setting up proxy...");

  // Deploy the upgradeable contract
  const PoolController = await ethers.getContractFactory("PoolController");
  const poolController = await upgrades.deployProxy(
    PoolController,
    [], // No constructor args for PoolController's initialize function
    {
      initializer: "initialize",
      kind: "uups", // UUPS proxy type
    }
  );

  await poolController.waitForDeployment();
  const proxyAddress = await poolController.getAddress();
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    proxyAddress
  );

  // Save the proxy contract to deployments
  await save("PoolController", {
    address: proxyAddress,
    abi: JSON.parse(PoolController.interface.formatJson()),
  });

  log(`PoolController Proxy deployed to: ${proxyAddress}`);
  log(`Implementation deployed to: ${implementationAddress}`);

  // Verify on non-development chains
  if (!developmentChains.includes(network.name)) {
    log("Verifying implementation contract...");
    await verify(implementationAddress, []);
  }

  log("-------------------------------------------------");
  log("PoolController successfully deployed and initialized!");
};

module.exports.tags = ["all", "PoolController"];
