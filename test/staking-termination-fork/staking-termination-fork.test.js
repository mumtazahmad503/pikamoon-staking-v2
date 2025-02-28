const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { ZeroAddress } = require("ethers");
const fs = require("fs");

const toGWei = (value) => ethers.parseUnits(value.toString(), 9);
const toWei = (value) => ethers.parseEther(value.toString());

function encodeAndHash(address, amount, restake, nonce) {
  return ethers.solidityPackedKeccak256(
    ["address", "uint256", "bool", "uint256"],
    [address, amount, restake, nonce]
  );
}

describe("Pika Staking", function () {
  async function deployFixture() {
    const [verifierAddress] = await ethers.getSigners();
    const owner = await ethers.getImpersonatedSigner(
      "0x574e11B602D05187cdA67d69fd6dd4E5c9a42f63"
    );
    const account1 = await ethers.getImpersonatedSigner(
      "0x0Ab77fbfd553BB331f1ca5291b686f02562aa114"
    );
    const wale = await ethers.getImpersonatedSigner(
      "0x00000000219ab540356cBB839Cbe05303d7705Fa"
    );

    // Send ETH to owner and account1
    await wale.sendTransaction({
      to: owner.address,
      value: ethers.parseEther("11.0"),
    });
    await wale.sendTransaction({
      to: account1.address,
      value: ethers.parseEther("11.0"),
    });

    // Get contract factories and attach to existing deployments
    const pikamoonFactory = await ethers.getContractFactory("PikaMoon");
    const ERC20 = await ethers.getContractFactory("Token");

    const token = await pikamoonFactory.attach(
      "0xd1e64bcc904cfdc19d0faba155a9edc69b4bcdae"
    );
    const lptoken = await ERC20.attach(
      "0x43a68a9f1f234e639b142f0aba946b7add26418d"
    );

    const PoolControllerFactory = await ethers.getContractFactory(
      "PoolController"
    );
    const poolController = await PoolControllerFactory.attach(
      "0x1cA441f054CCD878A3f9Dba4c35092fD1e07D17f"
    );

    const PikaStakingFactory = await ethers.getContractFactory(
      "PikaStakingPool"
    );
    const staking = await PikaStakingFactory.attach(
      "0xF965671DeC4C8f902083e8E0845cf86aac44FD80"
    );
    const lpstaking = await PikaStakingFactory.attach(
      "0xFCf12ADF9Dc9967701596A12D1c7F5E447e34736"
    );

    // Deploy new implementation for staking
    const stakingNewImpl = await ethers.deployContract("PikaStakingPoolV2", []);
    console.log("here");
    // LP staking upgrade to new implementation
    await owner.sendTransaction({
      to: lpstaking.target,
      data:
        "0x4f1ef286000000000000000000000000" +
        stakingNewImpl.target.toString().slice(2) +
        "00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000",
    });
    // Direct staking upgrade to new implementation
    await owner.sendTransaction({
      to: staking.target,
      data:
        "0x4f1ef286000000000000000000000000" +
        stakingNewImpl.target.toString().slice(2) +
        "00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000",
    });

    // Deploy new implementation for PoolController and upgrade
    const poolControllerNewImpl = await ethers.deployContract(
      "PoolControllerV2",
      []
    );
    await owner.sendTransaction({
      to: poolController.target,
      data:
        "0x4f1ef286000000000000000000000000" +
        poolControllerNewImpl.target.toString().slice(2) +
        "00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000",
    });

    return {
      token,
      lptoken,
      staking,
      lpstaking,
      owner,
      account1,
      poolController,
      verifierAddress,
    };
  }

  describe("test cases", function () {
    let token,
      lptoken,
      staking,
      lpstaking,
      owner,
      poolController,
      verifierAddress,
      account1;

    before(async () => {
      const fixture = await loadFixture(deployFixture);
      token = fixture.token;
      lptoken = fixture.lptoken;
      staking = fixture.staking;
      lpstaking = fixture.lpstaking;
      owner = fixture.owner;
      account1 = fixture.account1;
      poolController = fixture.poolController;
      verifierAddress = fixture.verifierAddress;
    });

    it("should allow unstake", async () => {
      let stakeBal = await staking.balanceOf(account1.address);
      let stakeRewards = await staking.pendingRewards(account1.address);
      console.log("stakeRewards", stakeRewards);
      console.log("stakeBal", stakeBal);
      console.log("Staking contract: ", staking.target);
      console.log("Staking: ", staking.target);

      await staking.connect(account1).unstake(0);
      stakeBal = await staking.balanceOf(account1.address);
      console.log("stakeBal after", stakeBal);
      stakeRewards = await staking.pendingRewards(account1.address);
      console.log("after stakeRewards", stakeRewards);

      await staking.connect(account1).unstake(0);
      console.log("stakeBal after", stakeBal);
      stakeRewards = await staking.pendingRewards(account1.address);
      console.log("after stakeRewards", stakeRewards);
    });
  });
});
