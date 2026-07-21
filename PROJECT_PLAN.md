# 14-Day Development Plan: Decentralized Banking System

This document outlines the end-to-end development roadmap for the Online Banking System smart contracts and frontend, utilizing Agentic coding and Skill integrations.

## 📌 Project Context & Variant Parameters
- **Student ID:** `2231200022` (A=2, B=2)
- **Grace period:** 4 days
- **Default APR:** 250 bps (2.5%)
- **Early withdraw penalty:** 400 bps (4.0%)
- **Default plan tenor:** 90 days
- **Current Status:** Project initialized. Environment cleaned (boilerplate code removed). Ready for smart contract development.

---

## 🚀 Phase 1: Foundation Contracts (Days 1 - 3)
- [x] **Day 1: Project Setup & Analysis**
  - Calculate variant parameters from Student ID.
  - Initialize Hardhat, OpenZeppelin, and clean up boilerplate files (`Counter.sol`, etc.).
- [ ] **Day 2: Mock Token & Vault Manager**
  - Develop `MockUSDC.sol` (ERC20, 6 decimals).
  - Develop `VaultManager.sol` (Ownable, Pausable, Admin funds).
- [ ] **Day 3: Base Unit Tests**
  - Write test cases for `MockUSDC` minting and `VaultManager` logic.

## 🧠 Phase 2: Core Business Logic (Days 4 - 7)
- [ ] **Day 4: SavingCore & Plan Logic**
  - Implement `SavingCore.sol` inheriting ERC721.
  - Implement `createPlan`, `updatePlan`, `enablePlan`, `disablePlan`.
- [ ] **Day 5: Deposit & Maturity Withdrawals**
  - Implement `openDeposit()` with APR/Penalty snapshotting.
  - Implement `withdrawAtMaturity()` using simple interest math.
- [ ] **Day 6: Early Withdrawal & Renewals**
  - Implement `earlyWithdraw()` with penalty deduction.
  - Implement `renewDeposit()` (Manual) and `autoRenewDeposit()` (Bot).
- [ ] **Day 7: Logic Integration & Refactoring**
  - Verify mathematical precision (multiply before divide).
  - Ensure correct contract boundaries (Vault vs Principal).

## 🛡️ Phase 3: Comprehensive Testing & Bonus Challenges (Days 8 - 10)
- [ ] **Day 8: Happy Path Testing**
  - Use Hardhat time helpers to simulate maturity and grace periods.
  - Ensure solidity-coverage runs successfully.
- [ ] **Day 9: Edge Cases & Security Checks**
  - Test double withdrawals, empty vault, boundary timestamps (`>=` vs `>`).
- [ ] **Day 10: Bonus Challenges Integration**
  - Implement selected challenges (e.g., C1, C3).
  - Add isolated test cases for bonus features. Ensure overall coverage > 90%.

## 💻 Phase 4: Web3 Frontend Integration (Days 11 - 13)
- [ ] **Day 11: Frontend Scaffolding**
  - Setup React (Vite) project.
  - Integrate `ethers.js` and MetaMask connection.
- [ ] **Day 12: UI Implementation (Plans & Deposits)**
  - Render available Saving Plans.
  - Implement `openDeposit` form and transaction execution.
- [ ] **Day 13: Dashboard & User Actions**
  - Display user's Active Deposits (reading ERC721 tokens).
  - Implement Withdraw and Renew action buttons with error handling.

## 🎓 Phase 5: Finalization & Delivery (Day 14)
- [ ] **Day 14: Documentation & Demo**
  - Complete "Design Answers" (Section 8.2) in `README.md`.
  - Final test run and coverage verification.
  - Walkthrough and script preparation for the 3-5 minute demo video.
