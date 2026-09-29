export const SUPPORTED_CHAINS = [
  {
    id: 11155111,
    hexId: "0xaa36a7",
    name: "Ethereum Sepolia",
    rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
    currency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    explorer: "https://sepolia.etherscan.io",
  },
  {
    id: 84532,
    hexId: "0x14a34",
    name: "Base Sepolia",
    rpcUrl: "https://sepolia.base.org",
    currency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    explorer: "https://sepolia.basescan.org",
  },
];

export const isSupportedChain = (chainId) =>
  SUPPORTED_CHAINS.some((chain) => chain.id === chainId);

export const getChainById = (chainId) =>
  SUPPORTED_CHAINS.find((chain) => chain.id === chainId);