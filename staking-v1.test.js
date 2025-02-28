const { expect, assert } = require("chai");
const { developmentChains } = require("./helper-hardhat.config");
const { network, getNamedAccounts, ethers, deployments } = require("hardhat");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("PikaMoon unit tests", () => {
      let pikaMoon, pikaStakingPool, poolController, deployer, user, signer;
      const toGwei = (val) => {
        ethers.parseUnits(val.toString(), 9);
      };
      beforeEach(async function () {
        signer = await ethers.provider.getSigner();
        deployer = (await getNamedAccounts()).deployer;
        user = (await getNamedAccounts()).user;
        await deployments.fixture(["all"]);
        pikaMoon = await ethers.getContract("PikaMoon", deployer);
        pikaStakingPool = await ethers.getContract("PikaStakingPool", deployer);
        poolController = await ethers.getContract("PoolController", deployer);

        const OWNER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("OWNER_ROLE"));

        const hasOwnerRole = await pikaMoon.hasRole(OWNER_ROLE, deployer);

        if (!hasOwnerRole) {
          const tx = await pikaMoon.initialize(
            "PIKAmoon",
            "PIKA",
            deployer,
            deployer
          );
          await tx.wait(1);
        }

        // const tx2 = await pikaStakingPool.initialize(
        //   pikaMoon.target,
        //   pikaMoon.target,
        //   poolController.target,
        //   200
        // );
        // await tx2.wait(1);

        // await poolController.registerPool(pikaStakingPool.target);
        // await pikaMoon.mint(poolController.target, toGwei(5000000000));
        // await pikaMoon.mint(deployer, toGwei(50));
        // await pikaMoon.mint(user, toGwei(50));
        // await pikaMoon.excludeFromTax(pikaStakingPool.target, true);
        // await pikaMoon.excludeFromTax(poolController.target, true);
      });
      describe("General Test cases", () => {
        it("Test 1", async () => {
          console.log("Working");
        });
      });
    });
