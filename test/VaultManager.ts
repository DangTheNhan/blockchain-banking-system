import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.create();

describe("VaultManager", function () {
  async function deployVaultManagerFixture() {
    const [owner, user] = await ethers.getSigners();
    const mockUSDC = await ethers.deployContract("MockUSDC");
    const vaultManager = await ethers.deployContract("VaultManager", [await mockUSDC.getAddress()]);
    return { mockUSDC, vaultManager, owner, user };
  }

  describe("Deployment", function () {
    it("Should set the right token address", async function () {
      const { mockUSDC, vaultManager } = await networkHelpers.loadFixture(deployVaultManagerFixture);
      expect(await vaultManager.token()).to.equal(await mockUSDC.getAddress());
    });

    it("Should set the right owner", async function () {
      const { vaultManager, owner } = await networkHelpers.loadFixture(deployVaultManagerFixture);
      expect(await vaultManager.owner()).to.equal(owner.address);
    });
  });

  describe("Pausable", function () {
    it("Should allow owner to pause and unpause", async function () {
      const { vaultManager } = await networkHelpers.loadFixture(deployVaultManagerFixture);
      
      await expect(vaultManager.pause())
        .to.emit(vaultManager, "PausedByAdmin");
      expect(await vaultManager.paused()).to.be.true;

      await expect(vaultManager.unpause())
        .to.emit(vaultManager, "UnpausedByAdmin");
      expect(await vaultManager.paused()).to.be.false;
    });

    it("Should prevent non-owner from pausing", async function () {
      const { vaultManager, user } = await networkHelpers.loadFixture(deployVaultManagerFixture);
      await expect(vaultManager.connect(user).pause())
        .to.be.revertedWithCustomError(vaultManager, "OwnableUnauthorizedAccount")
        .withArgs(user.address);
    });
  });

  describe("Admin Deposits and Withdrawals", function () {
    it("Should allow owner to deposit and emit event", async function () {
      const { mockUSDC, vaultManager, owner } = await networkHelpers.loadFixture(deployVaultManagerFixture);
      const depositAmount = ethers.parseUnits("1000", 6);
      
      // Mint tokens to owner and approve vault
      await mockUSDC.mint(owner.address, depositAmount);
      await mockUSDC.approve(await vaultManager.getAddress(), depositAmount);

      await expect(vaultManager.adminDeposit(depositAmount))
        .to.emit(vaultManager, "AdminDeposited")
        .withArgs(depositAmount);

      expect(await vaultManager.getVaultBalance()).to.equal(depositAmount);
      expect(await mockUSDC.balanceOf(await vaultManager.getAddress())).to.equal(depositAmount);
    });

    it("Should prevent deposit when paused", async function () {
      const { mockUSDC, vaultManager, owner } = await networkHelpers.loadFixture(deployVaultManagerFixture);
      const depositAmount = ethers.parseUnits("1000", 6);
      
      await mockUSDC.mint(owner.address, depositAmount);
      await mockUSDC.approve(await vaultManager.getAddress(), depositAmount);
      
      await vaultManager.pause();
      
      await expect(vaultManager.adminDeposit(depositAmount))
        .to.be.revertedWithCustomError(vaultManager, "EnforcedPause");
    });

    it("Should allow owner to withdraw and emit event", async function () {
      const { mockUSDC, vaultManager, owner, user } = await networkHelpers.loadFixture(deployVaultManagerFixture);
      const depositAmount = ethers.parseUnits("1000", 6);
      const withdrawAmount = ethers.parseUnits("400", 6);
      
      // Setup: deposit first
      await mockUSDC.mint(owner.address, depositAmount);
      await mockUSDC.approve(await vaultManager.getAddress(), depositAmount);
      await vaultManager.adminDeposit(depositAmount);

      await expect(vaultManager.adminWithdraw(withdrawAmount, user.address))
        .to.emit(vaultManager, "AdminWithdrawn")
        .withArgs(withdrawAmount, user.address);

      expect(await vaultManager.getVaultBalance()).to.equal(depositAmount - withdrawAmount);
      expect(await mockUSDC.balanceOf(user.address)).to.equal(withdrawAmount);
    });

    it("Should prevent non-owner from depositing or withdrawing", async function () {
      const { vaultManager, user } = await networkHelpers.loadFixture(deployVaultManagerFixture);
      const amount = ethers.parseUnits("100", 6);
      
      await expect(vaultManager.connect(user).adminDeposit(amount))
        .to.be.revertedWithCustomError(vaultManager, "OwnableUnauthorizedAccount");
        
      await expect(vaultManager.connect(user).adminWithdraw(amount, user.address))
        .to.be.revertedWithCustomError(vaultManager, "OwnableUnauthorizedAccount");
    });
  });
});
