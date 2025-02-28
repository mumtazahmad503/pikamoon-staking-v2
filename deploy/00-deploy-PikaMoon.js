const { network, ethers, upgrades } = require("hardhat");
const { verify } = require("../utils/verification");
const { developmentChains } = require("../helper-hardhat.config");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log, save } = deployments;
  const { deployer } = await getNamedAccounts();

  log("-------------------------------------------------");
  log("Deploying PikaMoon and setting up proxy...");

  // Deploy the upgradeable contract
  const PikaMoon = await ethers.getContractFactory("PikaMoon");
  const pikaMoon = await upgrades.deployProxy(
    PikaMoon,
    ["PIKAmoon", "PIKA", deployer, deployer],
    {
      initializer: "initialize",
      kind: "transparent",
    }
  );

  await pikaMoon.waitForDeployment();
  const proxyAddress = await pikaMoon.getAddress();
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    proxyAddress
  );

  // Save the proxy contract to deployments
  await save("PikaMoon", {
    address: proxyAddress,
    abi: JSON.parse(PikaMoon.interface.formatJson()),
  });

  log(`PikaMoon Proxy deployed to: ${proxyAddress}`);
  log(`Implementation deployed to: ${implementationAddress}`);

  // Verify on non-development chains
  if (!developmentChains.includes(network.name)) {
    log("Verifying implementation contract...");
    await verify(implementationAddress, []);
  }

  log("-------------------------------------------------");
  log("PikaMoon successfully deployed and initialized!");
};

module.exports.tags = ["all", "PikaMoon"];
