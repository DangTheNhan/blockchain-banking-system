// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title SavingCore
 * @dev Core business logic for the Savings Protocol.
 * Issues Certificates of Deposit as ERC721 NFTs.
 */
contract SavingCore is ERC721, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    
    struct Plan {
        uint256 apr;         // Interest rate in basis points (e.g. 250 = 2.5%)
        uint256 penalty;     // Early withdrawal penalty in basis points (e.g. 400 = 4.0%)
        uint256 tenor;       // Lock duration in seconds
        bool enabled;        // Is plan available for new deposits
    }

    uint256 public nextPlanId;
    mapping(uint256 => Plan) public plans;

    event PlanCreated(uint256 indexed planId, uint256 apr, uint256 penalty, uint256 tenor);
    event PlanUpdated(uint256 indexed planId, uint256 apr, uint256 penalty, uint256 tenor);
    event PlanEnabled(uint256 indexed planId);
    event PlanDisabled(uint256 indexed planId);

    /**
     * @dev Constructor initializes the ERC721 token and sets the underlying ERC20 token.
     * @param _token Address of the underlying ERC20 token (e.g., USDC).
     */
    constructor(address _token) ERC721("Savings Certificate", "SCD") Ownable(msg.sender) {
        require(_token != address(0), "SavingCore: Token address cannot be zero");
        token = IERC20(_token);
        
        // Start plan IDs from 1
        nextPlanId = 1;
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
}
