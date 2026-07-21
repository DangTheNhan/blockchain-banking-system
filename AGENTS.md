# Hardhat + ethers project

## Project layout

```
contracts/        Solidity source files (*.sol) and unit tests (*.t.sol)
test/             TypeScript integration tests and Solidity unit tests (*.sol)
ignition/         Hardhat Ignition deployment modules
scripts/          Standalone scripts run with `hardhat run`
hardhat.config.ts
```

## Working in this project

When writing or modifying tests, configuring `hardhat.config.ts`, or interacting with the network from TypeScript, use the **`hardhat`** skill (`/.agents/skills/hardhat/SKILL.md`). It covers Solidity and TypeScript testing, how to choose between them, `forge-std` cheatcodes, the `network.create()` API, `networkHelpers`, and the compile-then-typecheck workflow.

For toolbox-specific guidance (signers, contract interaction, assertions), also load the **`hardhat-toolbox-mocha-ethers`** skill (`/.agents/skills/hardhat-toolbox-mocha-ethers/SKILL.md`).

## Skills

All skills are stored in the `/.agents/skills/` directory.
- **hardhat** — `/.agents/skills/hardhat/SKILL.md`
- **hardhat-toolbox-mocha-ethers** — `/.agents/skills/hardhat-toolbox-mocha-ethers/SKILL.md`

## Docs

- Hardhat 3 — https://hardhat.org/llms.txt
- ethers.js — https://docs.ethers.org/v6/
