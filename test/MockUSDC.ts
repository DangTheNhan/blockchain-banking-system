import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.create();

describe("MockUSDC", function () {
  async function deployMockUSDCFixture() {
    const [owner, user] = await ethers.getSigners();
    const mockUSDC = await ethers.deployContract("MockUSDC");
    return { mockUSDC, owner, user };
  }

  describe("Deployment", function () {
    it("Should have correct name and symbol", async function () {
      const { mockUSDC } = await networkHelpers.loadFixture(deployMockUSDCFixture);
      expect(await mockUSDC.name()).to.equal("Mock USDC");
      expect(await mockUSDC.symbol()).to.equal("mUSDC");
    });

    it("Should return 6 decimals", async function () {
      const { mockUSDC } = await networkHelpers.loadFixture(deployMockUSDCFixture);
      expect(await mockUSDC.decimals()).to.equal(6);
    });
  });

  describe("Minting", function () {
    it("Should allow anyone to mint tokens", async function () {
      const { mockUSDC, user } = await networkHelpers.loadFixture(deployMockUSDCFixture);
      const mintAmount = ethers.parseUnits("100", 6);
      
      await expect(mockUSDC.connect(user).mint(user.address, mintAmount))
        .to.emit(mockUSDC, "Transfer")
        .withArgs(ethers.ZeroAddress, user.address, mintAmount);

      expect(await mockUSDC.balanceOf(user.address)).to.equal(mintAmount);
      expect(await mockUSDC.totalSupply()).to.equal(mintAmount);
    });
  });
});
