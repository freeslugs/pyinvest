// Network configurations
export const NETWORKS = {
  ETHEREUM_MAINNET: {
    id: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://cloudflare-eth.com',
    explorerUrl: 'https://etherscan.io',
  },
  SEPOLIA: {
    id: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl:
      'https://ethereum-sepolia-rpc.publicnode.com/b95cdba153627243b104e8933572f0a48c39aeea53084f43e0dce7c5dbbc028a/b95cdba153627243b104e8933572f0a48c39aeea53084f43e0dce7c5dbbc028a',
    explorerUrl: 'https://sepolia.etherscan.io',
  },
  BASE: {
    id: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
  },
  BASE_SEPOLIA: {
    id: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    explorerUrl: 'https://base-sepolia.blockscout.com',
  },
  FLOW_TESTNET: {
    id: 545,
    name: 'Flow Testnet',
    rpcUrl: 'https://testnet.evm.nodes.onflow.org',
    explorerUrl: 'https://evm-testnet.flowscan.io',
  },
  BSC_TESTNET: {
    id: 97,
    name: 'BSC Testnet',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    explorerUrl: 'https://testnet.bscscan.com',
  },
} as const;

// Token configurations by network
export const TOKENS = {
  [NETWORKS.SEPOLIA.id]: {
    PYUSD: {
      address: '0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9' as const,
      decimals: 6,
      symbol: 'PYUSD',
      name: 'PayPal USD (Testnet)',
    },
    USDC: {
      address: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8' as const,
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin (Testnet)',
    },
  },
  [NETWORKS.BSC_TESTNET.id]: {
    USDC: {
      address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d' as const,
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin (Testnet)',
    },
  },
} as const;

// Pool configurations
export const POOLS = {
  [NETWORKS.SEPOLIA.id]: {
    PYUSD_USDC: {
      address: '0x1eA26f380A71E15E75E61c6D66B4242c1f652FEd' as const,
      token0: TOKENS[NETWORKS.SEPOLIA.id].PYUSD,
      token1: TOKENS[NETWORKS.SEPOLIA.id].USDC,
      fee: 3000, // 0.3% (actual fee tier of the pool)
      name: 'PYUSD/USDC',
    },
  },
  [NETWORKS.BSC_TESTNET.id]: {
    AAVE: {
      aaddress: '0x6807dc923806fE8Fd134338EABCA509979a7e0cB' as const,
    },
  },
} as const;

// Aave configurations
export const AAVE_CONTRACTS = {
  [NETWORKS.BSC_TESTNET.id]: {
    POOL: '0x6807dc923806fe8fd134338eabca509979a7e0cb' as const,
    USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d' as const,
    AUSDC: '0x00901a076785e0906d1028c7d6372d247bec7d61' as const,
  },
  [NETWORKS.SEPOLIA.id]: {
    POOL: '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951' as const,
    WETH_GATEWAY: '0x387d311e47e80b498169e6fb51d3193167d89f7d' as const,
    WETH: '0xc558dbdd856501fcd9aaf1e62eae57a9f0629a3c' as const,
    AWETH: '0x5b071b590a59395fE4025A0Ccc1FcC931AAc1830' as const,
    AUSDC: '0x16dA4541aD1807f4443d92D26044C1147406EB80' as const,
    MULTICALL3: '0xcA11bde05977b3631167028862bE2a173976CA11' as const,
  },
};

// Permit2 configuration
export const PERMIT2_CONFIG = {
  ADDRESS: '0x000000000022d473030f116ddee9f6b43ac78ba3' as const,
  ABI: [
    {
      inputs: [
        { name: 'owner', type: 'address' },
        { name: 'token', type: 'address' },
        { name: 'spender', type: 'address' },
      ],
      name: 'allowance',
      outputs: [
        { name: 'amount', type: 'uint160' },
        { name: 'expiration', type: 'uint48' },
        { name: 'nonce', type: 'uint48' },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        { name: 'token', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'amount', type: 'uint160' },
        { name: 'expiration', type: 'uint48' },
      ],
      name: 'approve',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ] as const,
};

// Standard ERC20 ABI
export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_from', type: 'address' },
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
] as const;

// WETH Gateway ABI for depositing ETH to AAVE
export const WETH_GATEWAY_ABI = [
  {
    name: 'depositETH',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'lendingPool', type: 'address' },
      { name: 'onBehalfOf', type: 'address' },
      { name: 'referralCode', type: 'uint16' },
    ],
    outputs: [],
  },
] as const;

// Uniswap V3 Pool ABI (minimal - just what we need)
export const UNISWAP_V3_POOL_ABI = [
  {
    inputs: [],
    name: 'token0',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'token1',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'fee',
    outputs: [{ name: '', type: 'uint24' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Uniswap V3 Router ABI (Universal Router)
export const UNISWAP_V3_ROUTER_ABI = [
  {
    inputs: [
      { name: 'commands', type: 'bytes' },
      { name: 'inputs', type: 'bytes[]' },
      { name: 'deadline', type: 'uint256' },
    ],
    name: 'execute',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;

// Uniswap V3 Position Manager ABI (for creating liquidity positions)
export const UNISWAP_V3_POSITION_MANAGER_ABI = [
  {
    inputs: [
      {
        components: [
          { name: 'token0', type: 'address' },
          { name: 'token1', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'tickLower', type: 'int24' },
          { name: 'tickUpper', type: 'int24' },
          { name: 'amount0Desired', type: 'uint256' },
          { name: 'amount1Desired', type: 'uint256' },
          { name: 'amount0Min', type: 'uint256' },
          { name: 'amount1Min', type: 'uint256' },
          { name: 'recipient', type: 'address' },
          { name: 'deadline', type: 'uint256' },
        ],
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'mint',
    outputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'liquidity', type: 'uint128' },
      { name: 'amount0', type: 'uint256' },
      { name: 'amount1', type: 'uint256' },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'positions',
    outputs: [
      { name: 'nonce', type: 'uint96' },
      { name: 'operator', type: 'address' },
      { name: 'token0', type: 'address' },
      { name: 'token1', type: 'address' },
      { name: 'fee', type: 'uint24' },
      { name: 'tickLower', type: 'int24' },
      { name: 'tickUpper', type: 'int24' },
      { name: 'liquidity', type: 'uint128' },
      { name: 'feeGrowthInside0LastX128', type: 'uint256' },
      { name: 'feeGrowthInside1LastX128', type: 'uint256' },
      { name: 'tokensOwed0', type: 'uint128' },
      { name: 'tokensOwed1', type: 'uint128' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint256' },
    ],
    name: 'tokenOfOwnerByIndex',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Uniswap V3 contract addresses on Sepolia
export const UNISWAP_V3_ROUTER_ADDRESS =
  '0x3A9D48AB9751398BbFa63ad67599Bb04e4BdF98b' as const; // Universal Router
export const UNISWAP_V3_POSITION_MANAGER_ADDRESS =
  '0x1238536071E1c677A632429e3655c799b22cDA52' as const;
export const UNISWAP_V3_FACTORY_ADDRESS =
  '0x0227628f3F023bb0B980b67D528571c95c6DaC1c' as const;

// Utility functions for Uniswap
export const getTickSpacing = (feeTier: number): number => {
  switch (feeTier) {
    case 500:
      return 10; // 0.05%
    case 3000:
      return 60; // 0.3%
    case 10000:
      return 200; // 1%
    default:
      throw new Error(`Unsupported fee tier: ${feeTier}`);
  }
};

// Helper function to get network config
export function getNetworkConfig(chainId: number) {
  return Object.values(NETWORKS).find(network => network.id === chainId);
}

// Helper function to get available networks as array (for UI components)
export function getAvailableNetworks() {
  return Object.values(NETWORKS).map(network => ({
    id: network.id,
    name: network.name,
    rpcUrl: network.rpcUrl,
    explorerUrl: network.explorerUrl,
  }));
}

// Helper function to get tokens for a network
export function getTokensForNetwork(chainId: number) {
  return TOKENS[chainId as keyof typeof TOKENS] || {};
}

// Specific helper for Sepolia tokens to ensure proper typing
export function getSepoliaTokens() {
  return TOKENS[NETWORKS.SEPOLIA.id];
}

// Helper function to get pools for a network
export function getPoolsForNetwork(chainId: number) {
  return POOLS[chainId as keyof typeof POOLS] || {};
}

// Specific helper for Sepolia pools to ensure proper typing
export function getSepoliaPools() {
  return POOLS[NETWORKS.SEPOLIA.id];
}

// Helper function to get AAVE contracts for a network
export function getAaveContracts(chainId: number) {
  return AAVE_CONTRACTS[chainId as keyof typeof AAVE_CONTRACTS] || {};
}

// Specific helper for Sepolia AAVE contracts
export function getSepoliaAaveContracts() {
  return AAVE_CONTRACTS[NETWORKS.SEPOLIA.id];
}

// Helper function to format balance with decimals
export function formatTokenBalance(balance: bigint, decimals: number): number {
  return Number(balance) / Math.pow(10, decimals);
}

// Helper function to convert token amount to wei
export function parseTokenAmount(amount: string | number, decimals: number): bigint {
  const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
  return BigInt(Math.round(amountNum * Math.pow(10, decimals)));
}
