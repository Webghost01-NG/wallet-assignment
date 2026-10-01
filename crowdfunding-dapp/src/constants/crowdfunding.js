// Deployed crowdFunding contract on Ethereum Sepolia
export const CONTRACT_ADDRESS = "0x0B14BDDb6890202147D35C80C4C285165643D642";
export const CONTRACT_CHAIN_ID = 11155111; // Ethereum Sepolia (must be in SUPPORTED_CHAINS)

// The contract has no getter for milestones, so the app rebuilds them from event logs.
// Logs are read from this block onward. 0 works if your RPC allows wide log queries;
// for speed (or if you see "Milestone details unavailable"), set it to the block of the
// contract's creation transaction (shown on its Sepolia Etherscan page).
export const DEPLOY_BLOCK = 0;

// Only the newest campaigns are loaded, to keep the multicall small
export const MAX_CAMPAIGNS = 50;

// Multicall3 is deployed at this same address on almost every chain
export const MULTICALL3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";

// enum mileStoneStatus.Status { early, medium, late } is a uint8 in the ABI
export const STATUS_LABELS = ["Early", "Medium", "Late"];

export const CROWDFUNDING_ABI = [
  // reads
  "function NextCampignId() view returns (uint256)",
  "function campaign(uint256) view returns (address creator, uint256 target, uint256 deadline, uint256 moneyRaised, uint256 moneyavailable, bool active, bool cancelled, address tokenAccepted)",
  "function contributors(uint256, address) view returns (uint256 amount)",

  // writes
  "function createCampaign(uint256 _target, uint256 deadline, address tokenAccepted, uint256[] _amounts, uint8[] _statuses) returns (uint256 campaignId)",
  "function contributing(uint256 _amount, address _token, uint256 campaignId)",
  "function approveMilestones(uint256 campaignId) returns (bool success)",
  "function Withdrawal(uint256 campaignId)",
  "function refundMoney(uint256 campaignId)",
  "function cancelCampaign(uint256 campaignId)",

  // events (used to rebuild milestone details)
  "event CampaignCreated(address indexed creator, uint256 target, uint256 deadline)",
  "event milestoneCreated(uint256 amount, uint8 status)",
  "event withdrwalSuccessfully(uint256 _amount, address indexed _creator, uint256 campaignId, uint8 status)",

  // custom errors (so reverts can be shown by name)
  "error NotCreator()",
  "error TokenNotAccepted()",
  "error NotFunder()",
  "error MilestoneNotActive()",
  "error InvalidToken()",
  "error InvalidDeadline()",
  "error InvalidAmount()",
  "error NotActive()",
  "error ActiveCampaign()",
  "error DeadlinePassed()",
  "error UnableToContribute()",
  "error NotYetEligible()",
  "error unableToWithdraw()",
  "error alreadyCancelled()",
  "error notYetCancelled()",
  "error targetReached()",
  "error unableToRefund()",
  "error alreadyRefunded()",
  "error MilestoneAlreadyApproved()",
  "error DeadlineNotPassed()",
  "error InvalidMilestones()",
];

export const ERC20_ABI = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

export const MULTICALL3_ABI = [
  "function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) payable returns (tuple(bool success, bytes returnData)[] returnData)",
  "function getCurrentBlockTimestamp() view returns (uint256 timestamp)",
];
