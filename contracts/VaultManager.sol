// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title VaultManager
 * @dev Manages admin funds for the savings protocol.
 * Includes pausing functionality and uses SafeERC20 for token interactions.
 */
contract VaultManager is Ownable, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;

    event AdminDeposited(uint256 amount);
    event AdminWithdrawn(uint256 amount, address to);
    event PausedByAdmin(address account);
    event UnpausedByAdmin(address account);

    /**
     * @dev Constructor sets the underlying token and initializes the Ownable contract.
     * @param _token Address of the ERC20 token (e.g., USDC).
     */
    constructor(address _token) Ownable(msg.sender) {
        require(_token != address(0), "VaultManager: Token address cannot be zero");
        token = IERC20(_token);
    }

    /**
     * @dev Pauses operations. Only callable by owner.
     */
    function pause() external onlyOwner {
        _pause();
        emit PausedByAdmin(msg.sender);
    }

    /**
     * @dev Unpauses operations. Only callable by owner.
     */
    function unpause() external onlyOwner {
        _unpause();
        emit UnpausedByAdmin(msg.sender);
    }

    /**
     * @dev Allows admin to deposit funds into the vault.
     * @param amount The amount of tokens to deposit.
     */
    function adminDeposit(uint256 amount) external onlyOwner whenNotPaused {
        require(amount > 0, "VaultManager: Deposit amount must be greater than zero");
        token.safeTransferFrom(msg.sender, address(this), amount);
        emit AdminDeposited(amount);
    }

    /**
     * @dev Allows admin to withdraw funds from the vault.
     * @param amount The amount of tokens to withdraw.
     * @param to The address to receive the withdrawn tokens.
     */
    function adminWithdraw(uint256 amount, address to) external onlyOwner {
        require(to != address(0), "VaultManager: Cannot withdraw to zero address");
        require(amount > 0, "VaultManager: Withdraw amount must be greater than zero");
        
        uint256 vaultBalance = token.balanceOf(address(this));
        require(vaultBalance >= amount, "VaultManager: Insufficient vault balance");

        token.safeTransfer(to, amount);
        emit AdminWithdrawn(amount, to);
    }

    /**
     * @dev View function to check the vault's current token balance.
     * @return The token balance of this contract.
     */
    function getVaultBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }
}
