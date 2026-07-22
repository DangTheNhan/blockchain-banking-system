import { network } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
async function main() {
  const { ethers } = await network.create();
  const [deployer, treasury] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // 1. Deploy MockUSDC
  console.log("\n--- Deploying MockUSDC ---");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("MockUSDC deployed to:", usdcAddress);

  // 2. Mint EXACTLY 100,000 mUSDC to deployer, which will be immediately transferred to VaultManager
  const mintTx = await usdc.mint(deployer.address, ethers.parseUnits("100000", 6));
  await mintTx.wait();
  console.log("Minted 100,000 mUSDC to deployer for VaultManager funding");

  // 3. Deploy VaultManager
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

  // 4. Deploy SavingCore
  console.log("\n--- Deploying SavingCore ---");
  const SavingCore = await ethers.getContractFactory("SavingCore");
  const core = await SavingCore.deploy(usdcAddress);
  await core.waitForDeployment();
  const coreAddress = await core.getAddress();
  console.log("SavingCore deployed to:", coreAddress);

  // 5. Link Contracts & Setup
  console.log("\n--- Configuring System ---");
  
  // Set SavingCore in VaultManager
  const setSavingCoreTx = await vault.setSavingCore(coreAddress);
  await setSavingCoreTx.wait();
  console.log("VaultManager: SavingCore linked");

  // Set Fee Receiver in VaultManager to treasury (Account #1)
  const setFeeReceiverTx = await vault.setFeeReceiver(treasury.address);
  await setFeeReceiverTx.wait();
  console.log("VaultManager: Fee receiver set to Treasury (Account #1):", treasury.address);

  // Set VaultManager in SavingCore
  const setVaultManagerTx = await core.setVaultManager(vaultAddress);
  await setVaultManagerTx.wait();
  console.log("SavingCore: VaultManager linked");

  // 6. Create Default Plan (2.5% APR, 4.0% Penalty, 90 Days)
  const createPlanTx = await core.createPlan(250, 400, 90);
  await createPlanTx.wait();
  console.log("SavingCore: Default Plan #1 created (2.5% APR, 4% Penalty, 90 Days)");

  console.log("\n=== Deployment Completed Successfully ===");
  console.log(`MockUSDC:     ${usdcAddress}`);
  console.log(`VaultManager: ${vaultAddress}`);
  console.log(`SavingCore:   ${coreAddress}`);

  // Auto-save addresses to frontend
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const frontendDir = path.join(__dirname, "..", "frontend", "src");
  if (fs.existsSync(frontendDir)) {
    const addresses = {
      MockUSDC: usdcAddress,
      VaultManager: vaultAddress,
      SavingCore: coreAddress
    };
    const tsContent = `export const CONTRACT_ADDRESSES = ${JSON.stringify(addresses, null, 2)};\n`;
    fs.writeFileSync(
      path.join(frontendDir, "contract-addresses.ts"),
      tsContent
    );
    console.log("\n✅ Contract addresses automatically updated in frontend!");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
