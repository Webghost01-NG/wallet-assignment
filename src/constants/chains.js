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
  {
    id: 421614,
    hexId: "0x66eee",
    name: "Arbitrum Sepolia",
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    currency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    explorer: "https://sepolia.arbiscan.io",
  },
  {
    id: 11155420,
    hexId: "0xaa37dc",
    name: "Optimism Sepolia",
    rpcUrl: "https://sepolia.optimism.io",
    currency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    explorer: "https://sepolia-optimism.etherscan.io",
  },
  {
    id: 80002,
    hexId: "0x13882",
    name: "Polygon Amoy",
    rpcUrl: "https://rpc-amoy.polygon.technology",
    currency: { name: "POL", symbol: "POL", decimals: 18 },
    explorer: "https://amoy.polygonscan.com",
  },
  {
    id: 43113,
    hexId: "0xa869",
    name: "Avalanche Fuji",
    rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
    currency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
    explorer: "https://testnet.snowtrace.io",
  },
];

export const isSupportedChain = (chainId) =>
  SUPPORTED_CHAINS.some((chain) => chain.id === chainId);

export const getChainById = (chainId) =>
  SUPPORTED_CHAINS.find((chain) => chain.id === chainId);