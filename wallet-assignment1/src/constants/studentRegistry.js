import { isAddress } from "ethers";

// Deployed StudentRegistration contract on Ethereum Sepolia
export const CONTRACT_ADDRESS = "0xa551cb621e1b7b2350049d842bf73C1c4e89a126";
export const CONTRACT_CHAIN_ID = 11155111; // Ethereum Sepolia (must be in SUPPORTED_CHAINS)

export const CONTRACT_CONFIGURED = isAddress(CONTRACT_ADDRESS);

// Multicall2 deployment on Ethereum Sepolia
export const MULTICALL2_ADDRESS = import.meta.env.VITE_MULTICALL2_ADDRESS ?? "0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696";

// Optional: used only by the "Import from explorer" button
export const EXPLORER_API_KEY = import.meta.env.VITE_EXPLORER_API_KEY ?? "";

export const STUDENT_ABI = [
  "function register(string _name, uint256 _age, string _course)",
  "function getStudent(address _student) view returns (string name, uint256 age, string course)",
  "function registered(address) view returns (bool)",
];

export const MULTICALL2_ABI = [
  "function aggregate(tuple(address target, bytes callData)[] calls) returns (uint256 blockNumber, bytes[] returnData)",
];
