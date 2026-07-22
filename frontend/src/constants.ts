import MockUSDCJSON from '../../artifacts/contracts/MockUSDC.sol/MockUSDC.json';
import VaultManagerJSON from '../../artifacts/contracts/VaultManager.sol/VaultManager.json';
import SavingCoreJSON from '../../artifacts/contracts/SavingCore.sol/SavingCore.json';

import { CONTRACT_ADDRESSES as addresses } from './contract-addresses';

export const CONTRACT_ADDRESSES = addresses;

export const ABIS = {
  MockUSDC: MockUSDCJSON.abi,
  VaultManager: VaultManagerJSON.abi,
  SavingCore: SavingCoreJSON.abi
};
