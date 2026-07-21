// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @dev Mock ERC20 token to simulate USDC for testing purposes.
 * Features 6 decimals instead of the default 18.
 */
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "mUSDC") {}

    /**
     * @dev Overrides the decimals to 6 to match real USDC.
     */
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    /**
     * @dev Allows anyone to mint tokens for testing.
     * In a production environment, this function would be restricted.
     * @param to Address to receive the minted tokens.
     * @param amount Amount of tokens to mint.
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
