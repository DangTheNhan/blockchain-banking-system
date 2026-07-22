// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IVaultManager {
    function payoutInterest(address to, uint256 amount) external;
    function feeReceiver() external view returns (address);
}

/**
 * @title SavingCore
 * @dev Core business logic for the Savings Protocol.
 * Issues Certificates of Deposit as ERC721 NFTs.
 */
contract SavingCore is ERC721, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    IVaultManager public vaultManager;
    
    uint256 public gracePeriod = 4 days;

    struct Plan {
        uint256 apr;         // Interest rate in basis points (e.g. 250 = 2.5%)
        uint256 penalty;     // Early withdrawal penalty in basis points (e.g. 400 = 4.0%)
        uint256 tenor;       // Lock duration in seconds
        bool enabled;        // Is plan available for new deposits
    }

    struct Deposit {
        uint256 planId;
        uint256 amount;      // Principal amount
        uint256 apr;         // Snapshotted interest rate
        uint256 penalty;     // Snapshotted penalty
        uint256 startTime;   // Timestamp when deposit was opened
        uint256 maturityTime;// Timestamp when deposit matures
    }

    uint256 public nextPlanId;
    mapping(uint256 => Plan) public plans;

    uint256 public nextTokenId;
    mapping(uint256 => Deposit) public deposits;

    event VaultManagerSet(address vaultManager);
    event PlanCreated(uint256 indexed planId, uint256 apr, uint256 penalty, uint256 tenor);
    event PlanUpdated(uint256 indexed planId, uint256 apr, uint256 penalty, uint256 tenor);
    event PlanEnabled(uint256 indexed planId);
    event PlanDisabled(uint256 indexed planId);
    
    event DepositOpened(uint256 indexed tokenId, address indexed user, uint256 planId, uint256 amount, uint256 maturityTime);
    event WithdrawnAtMaturity(uint256 indexed tokenId, address indexed user, uint256 principal, uint256 interest);
    event EarlyWithdrawn(uint256 indexed tokenId, address indexed user, uint256 principalReturned, uint256 penaltyAmount);
    event DepositRenewed(uint256 indexed tokenId, address indexed user, uint256 newMaturityTime);
    event DepositAutoRenewed(uint256 indexed tokenId, address indexed user, uint256 newMaturityTime);

    /**
     * @dev Constructor initializes the ERC721 token and sets the underlying ERC20 token.
     * @param _token Address of the underlying ERC20 token (e.g., USDC).
     */
    constructor(address _token) ERC721("Savings Certificate", "SCD") Ownable(msg.sender) {
        require(_token != address(0), "SavingCore: Token address cannot be zero");
        token = IERC20(_token);
        
        nextPlanId = 1;
        nextTokenId = 1;
    }

    /**
     * @dev Sets the VaultManager contract address.
     * @param _vaultManager Address of the VaultManager.
     */
    function setVaultManager(address _vaultManager) external onlyOwner {
        require(_vaultManager != address(0), "SavingCore: VaultManager cannot be zero address");
        vaultManager = IVaultManager(_vaultManager);
        emit VaultManagerSet(_vaultManager);
    }

    /**
     * @dev Sets the grace period for auto-renewals.
     */
    function setGracePeriod(uint256 _gracePeriod) external onlyOwner {
        gracePeriod = _gracePeriod;
    }

    /**
     * @dev Creates a new savings plan. Only callable by owner.
     * @param _apr Interest rate in basis points.
     * @param _penalty Early withdrawal penalty in basis points.
     * @param _tenorInDays Duration of the plan in days.
     */
    function createPlan(uint256 _apr, uint256 _penalty, uint256 _tenorInDays) external onlyOwner {
        require(_tenorInDays > 0, "SavingCore: Tenor must be greater than zero");
        
        uint256 planId = nextPlanId++;
        uint256 tenorInSeconds = _tenorInDays * 1 days;

        plans[planId] = Plan({
            apr: _apr,
            penalty: _penalty,
            tenor: tenorInSeconds,
            enabled: true
        });

        emit PlanCreated(planId, _apr, _penalty, tenorInSeconds);
    }

    /**
     * @dev Updates an existing savings plan. Only callable by owner.
     * Note: This does not affect existing deposits, only new ones.
     * @param _planId ID of the plan to update.
     * @param _apr New interest rate in basis points.
     * @param _penalty New early withdrawal penalty in basis points.
     * @param _tenorInDays New duration of the plan in days.
     */
    function updatePlan(uint256 _planId, uint256 _apr, uint256 _penalty, uint256 _tenorInDays) external onlyOwner {
        require(_planId > 0 && _planId < nextPlanId, "SavingCore: Invalid plan ID");
        require(_tenorInDays > 0, "SavingCore: Tenor must be greater than zero");

        uint256 tenorInSeconds = _tenorInDays * 1 days;

        Plan storage plan = plans[_planId];
        plan.apr = _apr;
        plan.penalty = _penalty;
        plan.tenor = tenorInSeconds;

        emit PlanUpdated(_planId, _apr, _penalty, tenorInSeconds);
    }

    /**
     * @dev Enables a savings plan for new deposits. Only callable by owner.
     * @param _planId ID of the plan to enable.
     */
    function enablePlan(uint256 _planId) external onlyOwner {
        require(_planId > 0 && _planId < nextPlanId, "SavingCore: Invalid plan ID");
        plans[_planId].enabled = true;
        emit PlanEnabled(_planId);
    }

    /**
     * @dev Disables a savings plan, preventing new deposits. Only callable by owner.
     * @param _planId ID of the plan to disable.
     */
    function disablePlan(uint256 _planId) external onlyOwner {
        require(_planId > 0 && _planId < nextPlanId, "SavingCore: Invalid plan ID");
        plans[_planId].enabled = false;
        emit PlanDisabled(_planId);
    }

    /**
     * @dev Opens a new deposit.
     * @param _planId ID of the plan to subscribe to.
     * @param _amount Amount of tokens to deposit.
     */
    function openDeposit(uint256 _planId, uint256 _amount) external nonReentrant {
        require(address(vaultManager) != address(0), "SavingCore: VaultManager not set");
        require(_planId > 0 && _planId < nextPlanId, "SavingCore: Invalid plan ID");
        
        Plan memory plan = plans[_planId];
        require(plan.enabled, "SavingCore: Plan is disabled");
        require(_amount > 0, "SavingCore: Deposit amount must be greater than zero");

        // Transfer principal from user to this contract
        token.safeTransferFrom(msg.sender, address(this), _amount);

        // Snapshot parameters
        uint256 tokenId = nextTokenId++;
        uint256 startTime = block.timestamp;
        uint256 maturityTime = startTime + plan.tenor;

        deposits[tokenId] = Deposit({
            planId: _planId,
            amount: _amount,
            apr: plan.apr,
            penalty: plan.penalty,
            startTime: startTime,
            maturityTime: maturityTime
        });

        // Mint NFT receipt
        _safeMint(msg.sender, tokenId);

        emit DepositOpened(tokenId, msg.sender, _planId, _amount, maturityTime);
    }

    /**
     * @dev Withdraws principal and interest after maturity.
     * @param _tokenId ID of the deposit NFT.
     */
    function withdrawAtMaturity(uint256 _tokenId) external nonReentrant {
        require(ownerOf(_tokenId) == msg.sender, "SavingCore: Not the owner of this deposit");
        
        Deposit memory deposit = deposits[_tokenId];
        require(block.timestamp >= deposit.maturityTime, "SavingCore: Deposit has not matured yet");

        uint256 principal = deposit.amount;
        
        // Calculate simple interest: (Principal * APR * TenorInSeconds) / (10000 * 365 days)
        uint256 tenorInSeconds = deposit.maturityTime - deposit.startTime;
        uint256 interest = (principal * deposit.apr * tenorInSeconds) / (10000 * 365 days);

        _burn(_tokenId);
        delete deposits[_tokenId];

        token.safeTransfer(msg.sender, principal);
        vaultManager.payoutInterest(msg.sender, interest);

        emit WithdrawnAtMaturity(_tokenId, msg.sender, principal, interest);
    }

    /**
     * @dev Withdraws principal early with penalty.
     * @param _tokenId ID of the deposit NFT.
     */
    function earlyWithdraw(uint256 _tokenId) external nonReentrant {
        require(ownerOf(_tokenId) == msg.sender, "SavingCore: Not the owner of this deposit");
        
        Deposit memory deposit = deposits[_tokenId];
        require(block.timestamp < deposit.maturityTime, "SavingCore: Deposit already matured");

        uint256 principal = deposit.amount;
        uint256 penaltyAmount = (principal * deposit.penalty) / 10000;
        uint256 principalReturned = principal - penaltyAmount;

        address feeReceiver = vaultManager.feeReceiver();
        require(feeReceiver != address(0), "SavingCore: Fee receiver not set in VaultManager");

        _burn(_tokenId);
        delete deposits[_tokenId];

        // Transfer returned principal to user
        token.safeTransfer(msg.sender, principalReturned);
        // Transfer penalty to fee receiver
        token.safeTransfer(feeReceiver, penaltyAmount);

        emit EarlyWithdrawn(_tokenId, msg.sender, principalReturned, penaltyAmount);
    }

    /**
     * @dev Manual renewal of a deposit. Owner claims interest and starts a new term.
     * @param _tokenId ID of the deposit NFT.
     */
    function renewDeposit(uint256 _tokenId) external nonReentrant {
        address depositOwner = ownerOf(_tokenId);
        require(depositOwner == msg.sender, "SavingCore: Not the owner of this deposit");
        
        _processRenewal(_tokenId, depositOwner);
        emit DepositRenewed(_tokenId, depositOwner, deposits[_tokenId].maturityTime);
    }

    /**
     * @dev Auto renewal of a deposit by a bot.
     * @param _tokenId ID of the deposit NFT.
     */
    function autoRenewDeposit(uint256 _tokenId) external nonReentrant {
        Deposit memory deposit = deposits[_tokenId];
        require(block.timestamp >= deposit.maturityTime + gracePeriod, "SavingCore: Grace period not met");
        
        address depositOwner = ownerOf(_tokenId);
        _processRenewal(_tokenId, depositOwner);
        emit DepositAutoRenewed(_tokenId, depositOwner, deposits[_tokenId].maturityTime);
    }

    /**
     * @dev Internal function to process renewal logic.
     */
    function _processRenewal(uint256 _tokenId, address _owner) internal {
        Deposit storage deposit = deposits[_tokenId];
        require(block.timestamp >= deposit.maturityTime, "SavingCore: Deposit has not matured yet");

        uint256 principal = deposit.amount;
        uint256 tenorInSeconds = deposit.maturityTime - deposit.startTime;
        uint256 interest = (principal * deposit.apr * tenorInSeconds) / (10000 * 365 days);

        // Fetch current plan params
        Plan memory currentPlan = plans[deposit.planId];
        require(currentPlan.enabled, "SavingCore: Plan is disabled, cannot renew");

        // Update deposit with new snapshot
        deposit.apr = currentPlan.apr;
        deposit.penalty = currentPlan.penalty;
        deposit.startTime = block.timestamp;
        deposit.maturityTime = block.timestamp + currentPlan.tenor;

        // Payout the earned interest to the owner
        vaultManager.payoutInterest(_owner, interest);
    }
}
