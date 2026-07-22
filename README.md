# Online Banking System - Smart Contract

## Introduction
The Decentralized Online Banking System is a Web3 application designed to provide users with a secure and transparent way to earn interest on their digital assets. By leveraging Smart Contracts on the blockchain, the system offers automated savings plans (Certificates of Deposit represented as ERC721 NFTs), configurable interest rates (APR), and built-in penalty mechanisms for early withdrawals. Admin controls are securely managed through a dedicated Vault Manager.

## Installation and Execution

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm or yarn

### Setup Instructions
1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Compile Smart Contracts:**
   ```bash
   npx hardhat compile
   ```
3. **Run Unit Tests:**
   ```bash
   npx hardhat test
   ```

## Personal Variant Parameters
| Parameter | Value | Description |
| :--- | :--- | :--- |
| **Student ID** | `2231200022` | Used for calculating variant |
| **A (Last digit)** | `2` | Used in penalty calculation |
| **B (Second-to-last digit)** | `2` | Used in grace period calculation |
| **Grace period (auto-renew)** | `4 days` | (B + 2) days |
| **Default plan APR** | `250 bps` | (2.5%) |
| **Early withdraw penalty** | `400 bps` | (A + 2) * 100 bps (4.0%) |
| **Default plan tenor** | `90 days` | Base locking period |

## Project Requirements

### Core Smart Contracts
1. **MockUSDC.sol:** Mock ERC20 token for testing. Must be set to 6 decimals and have a public mint function.
2. **VaultManager.sol:** Manages the bank's interest funds. Allows the Admin to deposit/withdraw funds, set a fee receiver for penalties, and includes a pause system feature.
3. **SavingCore.sol:** Contains all business logic (creating plans, depositing, withdrawing, renewing) and holds the users' principal funds. When a user deposits, this contract mints a certificate of deposit as an ERC721 NFT.

### Business Logic & Calculations
- Apply **simple interest** only (no compound interest within a single term).
- **APR and Penalty Snapshot:** Interest rate and penalty fee must be "snapshotted" (locked) at the time a deposit is opened. Subsequent changes by the Admin will not affect active deposits.
- **5 User Flows to Handle:**
  1. Open Deposit
  2. Withdraw at Maturity (On-time)
  3. Early Withdrawal
  4. Manual Renewal
  5. Auto Renewal (by an off-chain bot)

### Deliverables
- Full Source Code for Smart Contracts.
- Comprehensive Unit Test suite (Hardhat + ethers.js) with test coverage > 90%.
- Simple React Frontend integrated with MetaMask.
- `README.md` file containing answers to Design Questions and Personal Variant parameters.
- 3-5 minute Demo Video capturing the user flow on the frontend.