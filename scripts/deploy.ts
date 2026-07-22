import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // 1. Deploy MockUSDC
  console.log("\n--- Deploying MockUSDC ---");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("MockUSDC deployed to:", usdcAddress);

  // Mint some MockUSDC to deployer for testing
  const mintTx = await usdc.mint(deployer.address, ethers.parseUnits("1000000", 6));
  await mintTx.wait();
  console.log("Minted 1,000,000 mUSDC to deployer");

  // 2. Deploy VaultManager
  console.log("\n--- Deploying VaultManager ---");
  const VaultManager = await ethers.getContractFactory("VaultManager");
  const vault = await VaultManager.deploy(usdcAddress);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("VaultManager deployed to:", vaultAddress);

  // Deposit some funds into VaultManager to pay interest
  const approveTx = await usdc.approve(vaultAddress, ethers.parseUnits("100000", 6));
  await approveTx.wait();
  const depositTx = await vault.adminDeposit(ethers.parseUnits("100000", 6));
  await depositTx.wait();
  console.log("Admin deposited 100,000 mUSDC into VaultManager for interest payouts");

  // 3. Deploy SavingCore
  console.log("\n--- Deploying SavingCore ---");
  const SavingCore = await ethers.getContractFactory("SavingCore");
  const core = await SavingCore.deploy(usdcAddress);
  await core.waitForDeployment();
  const coreAddress = await core.getAddress();
  console.log("SavingCore deployed to:", coreAddress);

  // 4. Link Contracts & Setup
  console.log("\n--- Configuring System ---");
  
  // Set SavingCore in VaultManager
  const setSavingCoreTx = await vault.setSavingCore(coreAddress);
  await setSavingCoreTx.wait();
  console.log("VaultManager: SavingCore linked");

  // Set Fee Receiver in VaultManager
  const setFeeReceiverTx = await vault.setFeeReceiver(deployer.address);
  await setFeeReceiverTx.wait();
  console.log("VaultManager: Fee receiver set to deployer");

  // Set VaultManager in SavingCore
  const setVaultManagerTx = await core.setVaultManager(vaultAddress);
  await setVaultManagerTx.wait();
  console.log("SavingCore: VaultManager linked");

  // 5. Create Default Plan (2.5% APR, 4.0% Penalty, 90 Days)
  const createPlanTx = await core.createPlan(250, 400, 90);
  await createPlanTx.wait();
  console.log("SavingCore: Default Plan #1 created (2.5% APR, 4% Penalty, 90 Days)");

  console.log("\n=== Deployment Completed Successfully ===");
  console.log(`MockUSDC:     ${usdcAddress}`);
  console.log(`VaultManager: ${vaultAddress}`);
  console.log(`SavingCore:   ${coreAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
