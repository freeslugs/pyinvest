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
    rpcUrl: 'https://rpc.sepolia.org',
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
} as const;

// Token configurations by network
export const TOKENS = {
  [NETWORKS.SEPOLIA.id]: {
    PYUSD: {
      address: '0x2d5fA65fd978E4533FE6876cc19A26A285e81f72' as const,
      decimals: 18, // Most testnet tokens use 18 decimals
      symbol: 'PYUSD',
      name: 'PayPal USD (Testnet)',
    },
    USDC: {
      address: '0x703bd35f91bc3947aaC70B4b0c560Bee5F06F84c' as const,
      decimals: 6, // USDC typically uses 6 decimals
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
} as const;

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

// Uniswap V3 Router ABI (simplified for swaps and liquidity)
export const UNISWAP_V3_ROUTER_ABI = [
  {
    inputs: [
      {
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'recipient', type: 'address' },
          { name: 'deadline', type: 'uint256' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'amountOutMinimum', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint256' },
        ],
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'exactInputSingle',
    outputs: [{ name: 'amountOut', type: 'uint256' }],
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
  '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E' as const;
export const UNISWAP_V3_POSITION_MANAGER_ADDRESS =
  '0x1238536071E1c677A632429e3655c799b22cDA52' as const;
export const UNISWAP_V3_FACTORY_ADDRESS =
  '0x0227628f3F023bb0B980b67D528571c95c6DaC1c' as const;

// Helper function to get network config
export function getNetworkConfig(chainId: number) {
  return Object.values(NETWORKS).find(network => network.id === chainId);
}

// Helper function to get tokens for a network
export function getTokensForNetwork(chainId: number) {
  return TOKENS[chainId as keyof typeof TOKENS] || {};
}

// Helper function to get pools for a network
export function getPoolsForNetwork(chainId: number) {
  return POOLS[chainId as keyof typeof POOLS] || {};
}
