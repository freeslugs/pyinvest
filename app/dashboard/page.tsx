'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useSmartWallets } from '@privy-io/react-auth/smart-wallets';
import { ArrowRight, Edit3, Globe, User, Zap } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { encodeFunctionData } from 'viem';

import { OnboardingFlow } from '@/components/OnboardingFlow';
import { SmartWalletCard } from '@/components/SmartWalletCard';
import { NetworkSelector } from '@/components/ui/network-selector';

// Custom Verified Icon Component
const VerifiedIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox='0 0 24 24'
    width='1.2em'
    height='1.2em'
    className={className}
    aria-label='Verified'
  >
    <title>Verified</title>
    <g
      fill='none'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='2'
    >
      <path d='M3.85 8.62a4 4 0 0 1 4.78-4.77a4 4 0 0 1 6.74 0a4 4 0 0 1 4.78 4.78a4 4 0 0 1 0 6.74a4 4 0 0 1-4.77 4.78a4 4 0 0 1-6.75 0a4 4 0 0 1-4.78-4.77a4 4 0 0 1 0-6.76' />
      <path d='m9 12l2 2l4-4' />
    </g>
  </svg>
);

interface WalletBalance {
  smartWallet: string;
  metaMask: string;
}

// PYUSD Token Configuration (Sepolia)
const PYUSD_TOKEN_CONFIG = {
  address: '0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9' as const,
  decimals: 6,
  symbol: 'PYUSD',
};

// USDC Token Configuration (Sepolia) - Updated to match cookbook
const USDC_TOKEN_CONFIG = {
  address: '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238' as const,
  decimals: 6,
  symbol: 'USDC',
};

// Uniswap V3 Configuration (Sepolia) - Updated to match cookbook
const UNISWAP_CONFIG = {
  UNIVERSAL_ROUTER_ADDRESS:
    '0x3A9D48AB9751398BbFa63ad67599Bb04e4BdF98b' as const, // Universal Router
  ROUTER_ADDRESS: '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E' as const, // SwapRouter02 (backup)
  POSITION_MANAGER_ADDRESS:
    '0x1238536071E1c677A632429e3655c799b22cDA52' as const,
  PYUSD_USDC_POOL: {
    address: '0x1eA26f380A71E15E75E61c6D66B4242c1f652FEd' as const,
    fee: 3000, // 0.3%
  },
};

// Permit2 Configuration
const PERMIT2_CONFIG = {
  ADDRESS: '0x000000000022d473030f116ddee9f6b43ac78ba3' as const,
};

// ERC20 ABI for balanceOf function
const ERC20_ABI = [
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

// Uniswap V3 Universal Router ABI
const UNISWAP_V3_ROUTER_ABI = [
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

// Permit2 ABI - Fixed to match cookbook
const PERMIT2_ABI = [
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
] as const;

// Uniswap V3 Position Manager ABI (for liquidity positions)
const UNISWAP_V3_POSITION_MANAGER_ABI = [
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
] as const;

// Helper function to format PYUSD balance
const formatPyusdBalance = (balance: bigint): string => {
  const balanceNumber = Number(balance) / 10 ** PYUSD_TOKEN_CONFIG.decimals;
  return balanceNumber.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default function PyUSDYieldSelector() {
  const { user, authenticated, ready } = usePrivy();
  const { wallets } = useWallets();
  const { client } = useSmartWallets();
  const [conservativeAmount, setConservativeAmount] = useState('');
  const [growthAmount, setGrowthAmount] = useState('');
  const [balances, setBalances] = useState<WalletBalance>({
    smartWallet: '0',
    metaMask: '0',
  });

  // Growth Vault specific state
  const [growthVaultBalance, setGrowthVaultBalance] = useState('0.00');
  const [investmentStatus, setInvestmentStatus] = useState('');

  // KYC state management - commented out as not currently used
  // const [kycStatus, setKycStatus] = useState<
  //   'not_started' | 'passed' | 'claimed'
  // >('not_started');

  // Find smart wallet from linked accounts
  const smartWallet = user?.linkedAccounts?.find(
    account => account.type === 'smart_wallet'
  ) as
    | { type: 'smart_wallet'; address: string; smartWalletType?: string }
    | undefined;

  // Get the connected MetaMask wallet
  const metamaskWallet = wallets.find(
    wallet => wallet.walletClientType === 'metamask'
  );

  // Onboarding and smart wallet states
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [smartWalletBalance, setSmartWalletBalance] = useState('0');
  const [showSmartWallet, setShowSmartWallet] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [isNetworkMenuOpen, setIsNetworkMenuOpen] = useState(false);
  const [isDepositFlow, setIsDepositFlow] = useState(false);

  // Mock KYC status - in real app this would come from backend - commented out as not currently used
  // useEffect(() => {
  //   if (user?.id) {
  //     // Mock logic - simulate different states based on user ID
  //     const userId = user.id;
  //     if (userId.endsWith('1') || userId.endsWith('2')) {
  //       setKycStatus('passed');
  //     } else if (userId.endsWith('3') || userId.endsWith('4')) {
  //       setKycStatus('claimed');
  //     } else {
  //       setKycStatus('not_started');
  //     }
  //   }
  // }, [user]);

  // // Get smart wallet from user's linked accounts
  // const smartWallet = user?.linkedAccounts?.find(
  //   (account: any) => account.type === 'smart_wallet'
  // ) as { address: string } | undefined;

  // Function to fetch PYUSD balance for MetaMask wallet
  const fetchMetaMaskBalance = useCallback(async () => {
    try {
      // Find MetaMask wallet from user's linked accounts
      const metaMaskWallet = user?.linkedAccounts?.find(
        account =>
          account.type === 'wallet' &&
          account.walletClientType &&
          account.walletClientType !== 'privy'
      ) as { address: string } | undefined;

      if (!metaMaskWallet) {
        console.log('No MetaMask wallet found');
        setBalances(prev => ({ ...prev, metaMask: '0' }));
        return;
      }

      console.log(
        'Fetching MetaMask PYUSD balance for address:',
        metaMaskWallet.address
      );

      // Import viem utilities dynamically
      const { createPublicClient, http } = await import('viem');
      const { sepolia } = await import('viem/chains');

      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(
          'https://ethereum-sepolia-rpc.publicnode.com/b95cdba153627243b104e8933572f0a48c39aeea53084f43e0dce7c5dbbc028a',
          {
            timeout: 10_000,
            retryCount: 2,
          }
        ),
      });

      // Fetch PYUSD balance
      const balance = await publicClient.readContract({
        address: PYUSD_TOKEN_CONFIG.address,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [metaMaskWallet.address as `0x${string}`],
      });

      const formattedBalance = formatPyusdBalance(balance as bigint);
      console.log('🟠 METAMASK BALANCE UPDATE:');
      console.log('- Raw balance from contract:', balance);
      console.log('- Formatted balance:', formattedBalance);
      console.log('- Updating balances.metaMask to:', formattedBalance);

      setBalances(prev => {
        const newBalances = {
          ...prev,
          metaMask: formattedBalance,
        };
        console.log('- New balances state after MetaMask update:', newBalances);
        return newBalances;
      });
    } catch (error) {
      console.error('Error fetching MetaMask PYUSD balance:', error);
      setBalances(prev => ({
        ...prev,
        metaMask: '0',
      }));
    }
  }, [user]);

  // Function to check Growth Vault balance (LP token balance)
  const checkGrowthVaultBalance = useCallback(async () => {
    if (!client?.chain || client.chain.id !== 11155111 || !smartWallet) {
      console.log('Must be on Sepolia network with smart wallet');
      return;
    }

    try {
      const { createPublicClient, http } = await import('viem');
      const { sepolia } = await import('viem/chains');

      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(
          'https://ethereum-sepolia-rpc.publicnode.com/b95cdba153627243b104e8933572f0a48c39aeea53084f43e0dce7c5dbbc028a'
        ),
      });

      // Check how many NFT positions the smart wallet has in the Position Manager
      const nftBalance = (await publicClient.readContract({
        address: UNISWAP_CONFIG.POSITION_MANAGER_ADDRESS,
        abi: UNISWAP_V3_POSITION_MANAGER_ABI,
        functionName: 'balanceOf',
        args: [smartWallet.address as `0x${string}`],
      })) as bigint;

      const nftCount = Number(nftBalance);
      console.log('Smart wallet NFT positions:', nftCount);

      let totalValueUSD = 0;

      if (nftCount > 0) {
        console.log(
          `📊 Processing ${nftCount} positions for value calculation`
        );

        // Process each position to calculate its value
        const positionPromises = [];
        for (let i = 0; i < nftCount; i++) {
          positionPromises.push(
            processPosition(publicClient, smartWallet.address, i)
          );
        }

        const positionResults = await Promise.allSettled(positionPromises);

        positionResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            totalValueUSD += result.value;
            console.log(
              `💰 Position ${index + 1} value: ~$${result.value.toFixed(2)} USD`
            );
          } else if (result.status === 'rejected') {
            console.warn(`⚠️ Position ${index + 1} failed:`, result.reason);
          }
        });

        console.log(`💰 Total pool value: ~$${totalValueUSD.toFixed(2)} USD`);
      }

      // Set the total USD value as the growth vault balance
      setGrowthVaultBalance(totalValueUSD.toFixed(2));

      console.log('Growth Vault total value:', totalValueUSD.toFixed(2));
    } catch (error) {
      console.error('Error checking Growth Vault balance:', error);
      setGrowthVaultBalance('0.00');
    }
  }, [client, smartWallet]);

  // Helper function to process a single position (adapted from cookbook)
  const processPosition = useCallback(
    async (
      publicClient: {
        readContract: (params: {
          address: string;
          abi: any[];
          functionName: string;
          args: any[];
        }) => Promise<any>;
      },
      walletAddress: string,
      index: number
    ): Promise<number> => {
      try {
        // Get token ID by index
        const tokenId = (await publicClient.readContract({
          address: UNISWAP_CONFIG.POSITION_MANAGER_ADDRESS as `0x${string}`,
          abi: UNISWAP_V3_POSITION_MANAGER_ABI,
          functionName: 'tokenOfOwnerByIndex',
          args: [walletAddress as `0x${string}`, BigInt(index)],
        })) as bigint;

        // Get position details
        const position = (await publicClient.readContract({
          address: UNISWAP_CONFIG.POSITION_MANAGER_ADDRESS as `0x${string}`,
          abi: UNISWAP_V3_POSITION_MANAGER_ABI,
          functionName: 'positions',
          args: [tokenId],
        })) as readonly [
          bigint,
          `0x${string}`,
          `0x${string}`,
          `0x${string}`,
          number,
          number,
          number,
          bigint,
          bigint,
          bigint,
          bigint,
          bigint,
        ];

        const [
          ,
          ,
          token0Address,
          token1Address,
          fee,
          tickLower,
          tickUpper,
          liquidity,
        ] = position;

        // Check if this is our PYUSD/USDC pool
        const isOurPool =
          ((token0Address.toLowerCase() ===
            USDC_TOKEN_CONFIG.address.toLowerCase() &&
            token1Address.toLowerCase() ===
              PYUSD_TOKEN_CONFIG.address.toLowerCase()) ||
            (token0Address.toLowerCase() ===
              PYUSD_TOKEN_CONFIG.address.toLowerCase() &&
              token1Address.toLowerCase() ===
                USDC_TOKEN_CONFIG.address.toLowerCase())) &&
          fee === UNISWAP_CONFIG.PYUSD_USDC_POOL.fee;

        if (!isOurPool || Number(liquidity) === 0) {
          return 0; // Skip non-relevant or empty positions
        }

        // Simplified value calculation to avoid heavy RPC calls (adapted from cookbook)
        const liquidityValue = Number(liquidity);
        const tickRange = Math.abs(tickUpper - tickLower);

        let estimatedValue: number;
        if (tickRange <= 1000) {
          // Narrow range - more concentrated
          estimatedValue = (liquidityValue / 83587747) * 2; // Rough approximation
        } else {
          // Full range - spread across entire range
          estimatedValue = (liquidityValue / 500000) * 2; // Rough approximation
        }

        return Math.max(0, estimatedValue);
      } catch (error) {
        console.warn(`⚠️ Error processing position ${index + 1}:`, error);
        return 0;
      }
    },
    []
  );

  // Check Growth Vault balance on component mount and when smart wallet changes
  useEffect(() => {
    if (smartWallet && client) {
      checkGrowthVaultBalance();
    }
  }, [smartWallet, client, checkGrowthVaultBalance]);

  // Function to check smart wallet PYUSD balance
  const checkSmartWalletBalance = async (): Promise<bigint> => {
    if (!client?.chain || client.chain.id !== 11155111 || !smartWallet) {
      throw new Error('Must be on Sepolia network with smart wallet');
    }

    const { createPublicClient, http } = await import('viem');
    const { sepolia } = await import('viem/chains');

    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(
        'https://ethereum-sepolia-rpc.publicnode.com/b95cdba153627243b104e8933572f0a48c39aeea53084f43e0dce7c5dbbc028a'
      ),
    });

    const balance = await publicClient.readContract({
      address: PYUSD_TOKEN_CONFIG.address,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [smartWallet.address as `0x${string}`],
    });

    return balance as bigint;
  };

  // Function to check PYUSD allowance from MetaMask to Smart Wallet
  const checkPyusdAllowance = async (): Promise<bigint> => {
    if (!metamaskWallet || !smartWallet) {
      throw new Error('MetaMask wallet or Smart Wallet not found');
    }

    const { createPublicClient, http } = await import('viem');
    const { sepolia } = await import('viem/chains');

    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(
        'https://ethereum-sepolia-rpc.publicnode.com/b95cdba153627243b104e8933572f0a48c39aeea53084f43e0dce7c5dbbc028a'
      ),
    });

    const allowance = await publicClient.readContract({
      address: PYUSD_TOKEN_CONFIG.address,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [
        metamaskWallet.address as `0x${string}`,
        smartWallet.address as `0x${string}`,
      ],
    });

    return allowance as bigint;
  };

  // Function to approve unlimited PYUSD spending for Smart Wallet
  const approvePyusdForSmartWallet = async () => {
    if (!metamaskWallet || !smartWallet) {
      throw new Error('MetaMask wallet or Smart Wallet not found');
    }

    // Get the MetaMask wallet's provider
    const metamaskProvider = await metamaskWallet.getEthereumProvider();

    // Switch to Sepolia if needed
    const currentChainId = await metamaskProvider.request({
      method: 'eth_chainId',
    });
    const sepoliaChainId = '0xaa36a7'; // 11155111 in hex

    if (currentChainId !== sepoliaChainId) {
      await metamaskProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: sepoliaChainId }],
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Approve unlimited PYUSD spending
    const MAX_UINT256 = 2n ** 256n - 1n; // Maximum uint256 value for unlimited approval

    const approveData = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [smartWallet.address as `0x${string}`, MAX_UINT256],
    });

    const txHash = await metamaskProvider.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: metamaskWallet.address,
          to: PYUSD_TOKEN_CONFIG.address,
          data: approveData,
        },
      ],
    });

    console.log('PYUSD unlimited approval tx:', txHash);
    return txHash;
  };

  // Function to transfer PYUSD from MetaMask to Smart Wallet using approval
  const transferFromMetaMaskToSmartWallet = async (amount: bigint) => {
    if (!metamaskWallet || !smartWallet || !client) {
      throw new Error('MetaMask wallet, Smart Wallet, or client not found');
    }

    console.log('🔍 Checking PYUSD allowance from MetaMask to Smart Wallet...');

    // Check current allowance
    const currentAllowance = await checkPyusdAllowance();
    console.log('Current PYUSD allowance:', currentAllowance.toString());
    console.log('Required amount:', amount.toString());

    // If allowance is insufficient, request approval
    if (currentAllowance < amount) {
      console.log(
        '⚠️ Insufficient allowance, requesting unlimited approval...'
      );
      setInvestmentStatus('Requesting PYUSD approval from MetaMask...');

      await approvePyusdForSmartWallet();

      // Wait for approval to be mined
      console.log('⏳ Waiting for approval to be mined...');
      await new Promise(resolve => setTimeout(resolve, 8000));

      // Verify approval went through
      const newAllowance = await checkPyusdAllowance();
      console.log(
        'New PYUSD allowance after approval:',
        newAllowance.toString()
      );

      if (newAllowance < amount) {
        throw new Error('Approval failed or not yet confirmed');
      }
    } else {
      console.log(
        '✅ Sufficient allowance exists, proceeding with transfer...'
      );
    }

    // Now use smart wallet to transfer tokens from MetaMask to itself
    console.log('🔄 Executing transferFrom via smart wallet...');

    // Switch smart wallet to Sepolia
    await client.switchChain({ id: 11155111 });

    const transferData = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'transferFrom',
      args: [
        metamaskWallet.address as `0x${string}`,
        smartWallet.address as `0x${string}`,
        amount,
      ],
    });

    const txHash = await client.sendTransaction({
      to: PYUSD_TOKEN_CONFIG.address,
      data: transferData,
      value: 0n,
    });

    console.log('✅ Transfer to smart wallet tx:', txHash);
    return txHash;
  };

  // Function to check Permit2 allowance for a token
  const checkPermit2Allowance = async (
    tokenAddress: string
  ): Promise<{
    isValid: boolean;
    amount: number;
    expiration: number;
    nonce: number;
    isExpired: boolean;
  }> => {
    if (!client?.chain || client.chain.id !== 11155111 || !smartWallet) {
      throw new Error('Must be on Sepolia network with smart wallet');
    }

    const { createPublicClient, http } = await import('viem');
    const { sepolia } = await import('viem/chains');

    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(
        'https://ethereum-sepolia-rpc.publicnode.com/b95cdba153627243b104e8933572f0a48c39aeea53084f43e0dce7c5dbbc028a'
      ),
    });

    try {
      const allowanceData = (await publicClient.readContract({
        address: PERMIT2_CONFIG.ADDRESS,
        abi: PERMIT2_ABI,
        functionName: 'allowance',
        args: [
          smartWallet.address as `0x${string}`,
          tokenAddress as `0x${string}`,
          UNISWAP_CONFIG.UNIVERSAL_ROUTER_ADDRESS,
        ],
      })) as [bigint, number, number];

      const [amount, expiration, nonce] = allowanceData;
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const isExpired = expiration > 0 && expiration < currentTimestamp;

      console.log(`🔍 Permit2 Allowance for ${tokenAddress}:`);
      console.log(`  Amount: ${amount.toString()}`);
      console.log(
        `  Expiration: ${expiration} (${new Date(expiration * 1000).toISOString()})`
      );
      console.log(
        `  Current: ${currentTimestamp} (${new Date(currentTimestamp * 1000).toISOString()})`
      );
      console.log(`  Is Expired: ${isExpired}`);
      console.log(`  Nonce: ${nonce}`);

      return {
        amount: Number(amount),
        expiration,
        nonce,
        isExpired,
        isValid: !isExpired && Number(amount) > 0,
      };
    } catch (error) {
      console.error('Failed to check Permit2 allowance:', error);
      return {
        amount: 0,
        expiration: 0,
        nonce: 0,
        isExpired: true,
        isValid: false,
      };
    }
  };

  // Function to approve token to Permit2 contract (Step 1)
  const approveTokenToPermit2 = async (tokenAddress: string) => {
    if (!client || !smartWallet) {
      throw new Error('Smart wallet client not available');
    }

    console.log('🔄 === STEP 1: APPROVING TOKEN TO PERMIT2 CONTRACT ===');

    // Switch smart wallet to Sepolia
    await client.switchChain({ id: 11155111 });

    const maxApproval = 2n ** 256n - 1n; // Max uint256 for traditional ERC20 approval

    console.log(`💰 Approving Permit2 contract to spend ${tokenAddress}`);
    console.log(`  Permit2 Address: ${PERMIT2_CONFIG.ADDRESS}`);
    console.log(`  Approval Amount: ${maxApproval.toString()} (max uint256)`);

    const tokenApprovalData = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [PERMIT2_CONFIG.ADDRESS, maxApproval],
    });

    const tokenApprovalTx = await client.sendTransaction({
      to: tokenAddress as `0x${string}`,
      data: tokenApprovalData,
      value: 0n,
    });

    console.log(`✅ Token approval to Permit2 sent: ${tokenApprovalTx}`);
    return tokenApprovalTx;
  };

  // Function to approve Universal Router through Permit2 (Step 2)
  const approveRouterThroughPermit2 = async (tokenAddress: string) => {
    if (!client || !smartWallet) {
      throw new Error('Smart wallet client not available');
    }

    console.log(
      '🔄 === STEP 2: APPROVING UNIVERSAL ROUTER THROUGH PERMIT2 ==='
    );

    // Switch smart wallet to Sepolia
    await client.switchChain({ id: 11155111 });

    const approveAmount = 2n ** 160n - 1n; // Max uint160 for Permit2
    const expiration = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 year from now

    console.log(
      `💰 Approving Universal Router through Permit2 for ${tokenAddress}`
    );
    console.log(`  Token: ${tokenAddress}`);
    console.log(`  Spender: ${UNISWAP_CONFIG.UNIVERSAL_ROUTER_ADDRESS}`);
    console.log(`  Amount: ${approveAmount.toString()} (max uint160)`);
    console.log(
      `  Expiration: ${expiration} (${new Date(expiration * 1000).toISOString()})`
    );

    const permit2ApprovalData = encodeFunctionData({
      abi: PERMIT2_ABI,
      functionName: 'approve',
      args: [
        tokenAddress as `0x${string}`,
        UNISWAP_CONFIG.UNIVERSAL_ROUTER_ADDRESS as `0x${string}`,
        approveAmount,
        expiration,
      ],
    });

    const permit2ApprovalTx = await client.sendTransaction({
      to: PERMIT2_CONFIG.ADDRESS,
      data: permit2ApprovalData,
      value: 0n,
    });

    console.log(`✅ Permit2 approval transaction sent: ${permit2ApprovalTx}`);
    return permit2ApprovalTx;
  };

  // Combined function to handle both steps (adapted from cookbook)
  const approvePermit2 = async (tokenAddress: string) => {
    if (!client || !smartWallet) {
      throw new Error('Smart wallet client not available');
    }

    console.log('🔄 === STARTING PERMIT2 APPROVAL (2-STEP PROCESS) ===');

    // Switch smart wallet to Sepolia
    await client.switchChain({ id: 11155111 });

    // STEP 1: Check if Permit2 contract has allowance to spend the token
    console.log('📍 Step 1: Checking token allowance to Permit2 contract...');

    const { createPublicClient, http } = await import('viem');
    const { sepolia } = await import('viem/chains');

    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(
        'https://ethereum-sepolia-rpc.publicnode.com/b95cdba153627243b104e8933572f0a48c39aeea53084f43e0dce7c5dbbc028a'
      ),
    });

    const currentAllowance = (await publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [smartWallet.address as `0x${string}`, PERMIT2_CONFIG.ADDRESS],
    })) as bigint;

    console.log(
      `Current token allowance to Permit2: ${currentAllowance.toString()}`
    );

    // If allowance is insufficient, approve Permit2 contract first
    if (currentAllowance < 1000000n) {
      console.log('💰 Step 1: Approving token to Permit2 contract...');
      await approveTokenToPermit2(tokenAddress);
      console.log('⏳ Waiting for token approval confirmation...');
      await new Promise(resolve => setTimeout(resolve, 8000));
    } else {
      console.log('✅ Permit2 already has sufficient token allowance');
    }

    // STEP 2: Approve Universal Router through Permit2
    console.log('💰 Step 2: Approving Universal Router through Permit2...');
    await approveRouterThroughPermit2(tokenAddress);
    console.log('⏳ Waiting for Permit2 approval confirmation...');
    await new Promise(resolve => setTimeout(resolve, 8000));

    console.log('✅ === PERMIT2 APPROVAL PROCESS COMPLETED ===');
  };

  // Function to swap half PYUSD to USDC using Universal Router
  const swapHalfPyusdToUsdc = async (totalAmount: bigint) => {
    if (!client || !smartWallet) {
      throw new Error('Smart wallet client not available');
    }

    const swapAmount = totalAmount / 2n; // Half of the total amount
    console.log(
      `🔄 Starting Universal Router swap: ${swapAmount} PYUSD to USDC`
    );

    // Switch smart wallet to Sepolia
    await client.switchChain({ id: 11155111 });

    // Check Permit2 allowance first
    console.log('🔍 Checking Permit2 allowance for PYUSD...');
    const permit2Check = await checkPermit2Allowance(
      PYUSD_TOKEN_CONFIG.address
    );

    if (!permit2Check.isValid) {
      console.log('⚠️ Permit2 allowance invalid, requesting approval...');
      setInvestmentStatus('Permit2 approval needed...');

      await approvePermit2(PYUSD_TOKEN_CONFIG.address);

      // Wait for approval to be mined
      console.log('⏳ Waiting for Permit2 approval...');
      await new Promise(resolve => setTimeout(resolve, 18000));

      // Recheck the allowance
      const recheckPermit2 = await checkPermit2Allowance(
        PYUSD_TOKEN_CONFIG.address
      );
      if (!recheckPermit2.isValid) {
        throw new Error('Permit2 approval failed or not yet confirmed');
      }
      console.log('✅ Permit2 approval confirmed');
    } else {
      console.log('✅ Permit2 allowance is valid, proceeding with swap...');
    }

    // Create deadline (20 minutes from now)
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);

    // Calculate minimum output with slippage protection
    // PYUSD to USDC: Both are USD-pegged stablecoins, should be roughly 1:1
    // Using conservative rate of 0.95 (expecting slightly less USDC for PYUSD)
    const estimatedOutputWei = (swapAmount * 95n) / 100n; // 0.95 USDC per PYUSD
    const slippageToleranceBps = 2500n; // 25% slippage tolerance for safety
    const amountOutMinimum =
      (estimatedOutputWei * (10000n - slippageToleranceBps)) / 10000n;

    // Ensure minimum is never 0
    const finalMinAmount = amountOutMinimum > 0n ? amountOutMinimum : 1n;

    console.log(`Swap amount: ${swapAmount} PYUSD`);
    console.log(`Estimated output: ${estimatedOutputWei} USDC`);
    console.log(`Minimum output (25% slippage): ${finalMinAmount} USDC`);

    // Encode V3_SWAP_EXACT_IN command (0x00) for Universal Router
    const { encodeAbiParameters } = await import('viem');

    // Command 0x00 = V3_SWAP_EXACT_IN
    const commands = '0x00';

    // Encode the swap input parameters for V3_SWAP_EXACT_IN
    const swapInput = encodeAbiParameters(
      [
        { name: 'recipient', type: 'address' },
        { name: 'amountIn', type: 'uint256' },
        { name: 'amountOutMinimum', type: 'uint256' },
        { name: 'path', type: 'bytes' },
        { name: 'payerIsUser', type: 'bool' },
      ],
      [
        smartWallet.address as `0x${string}`,
        swapAmount,
        finalMinAmount,
        // Encode path: PYUSD + fee + USDC (packed format)
        `0x${PYUSD_TOKEN_CONFIG.address.slice(2)}${UNISWAP_CONFIG.PYUSD_USDC_POOL.fee.toString(16).padStart(6, '0')}${USDC_TOKEN_CONFIG.address.slice(2)}` as `0x${string}`,
        true, // User pays input token
      ]
    );

    console.log('Universal Router command:', commands);
    console.log('Swap input data length:', swapInput.length);

    // Encode the Universal Router execute call
    const executeCalldata = encodeFunctionData({
      abi: UNISWAP_V3_ROUTER_ABI,
      functionName: 'execute',
      args: [commands as `0x${string}`, [swapInput], deadline],
    });

    console.log('Execute calldata length:', executeCalldata.length);
    console.log(
      'Universal Router address:',
      UNISWAP_CONFIG.UNIVERSAL_ROUTER_ADDRESS
    );

    try {
      console.log('🚀 Executing Universal Router swap transaction...');

      const swapTx = await client.sendTransaction({
        to: UNISWAP_CONFIG.UNIVERSAL_ROUTER_ADDRESS,
        data: executeCalldata,
        value: 0n,
      });

      console.log('✅ Universal Router swap tx:', swapTx);
      return swapTx;
    } catch (swapError) {
      console.error('❌ Universal Router swap failed:', swapError);

      // Enhanced debugging information
      console.error('🔍 Swap Error Debug Info:');

      try {
        const currentBalance = await checkSmartWalletBalance();
        console.error(
          `- Current smart wallet PYUSD balance: ${currentBalance.toString()}`
        );
        console.error(`- Required for swap: ${swapAmount.toString()}`);

        const permit2Check = await checkPermit2Allowance(
          PYUSD_TOKEN_CONFIG.address
        );
        console.error('- Permit2 allowance valid:', permit2Check.isValid);
        console.error('- Permit2 amount:', permit2Check.amount.toString());

        if (currentBalance < swapAmount) {
          console.error(
            '❌ INSUFFICIENT BALANCE: Smart wallet does not have enough PYUSD'
          );
        }
        if (!permit2Check.isValid) {
          console.error(
            '❌ INVALID PERMIT2: Permit2 allowance is invalid or expired'
          );
        }
      } catch (debugError) {
        console.error('- Could not fetch debug info:', debugError);
      }

      // Re-throw with more context
      const errorMessage =
        swapError instanceof Error ? swapError.message : String(swapError);
      throw new Error(`Universal Router swap failed: ${errorMessage}`);
    }
  };

  // Function to check smart wallet's token allowance for position manager
  const checkPositionManagerAllowance = async (
    tokenAddress: string
  ): Promise<bigint> => {
    if (!client?.chain || client.chain.id !== 11155111 || !smartWallet) {
      throw new Error('Must be on Sepolia network with smart wallet');
    }

    const { createPublicClient, http } = await import('viem');
    const { sepolia } = await import('viem/chains');

    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(
        'https://ethereum-sepolia-rpc.publicnode.com/b95cdba153627243b104e8933572f0a48c39aeea53084f43e0dce7c5dbbc028a'
      ),
    });

    const allowance = await publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [
        smartWallet.address as `0x${string}`,
        UNISWAP_CONFIG.POSITION_MANAGER_ADDRESS as `0x${string}`,
      ],
    });

    return allowance as bigint;
  };

  // Function to add liquidity to the pool
  const addLiquidityToPool = async (
    pyusdAmount: bigint,
    usdcAmount: bigint
  ) => {
    if (!client || !smartWallet) {
      throw new Error('Smart wallet client not available');
    }

    console.log(
      `🏦 Adding liquidity: ${pyusdAmount} PYUSD + ${usdcAmount} USDC`
    );

    // Switch smart wallet to Sepolia
    await client.switchChain({ id: 11155111 });

    // Check current balances first
    const currentPyusdBalance = await checkSmartWalletBalance();
    const { createPublicClient, http } = await import('viem');
    const { sepolia } = await import('viem/chains');

    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(
        'https://ethereum-sepolia-rpc.publicnode.com/b95cdba153627243b104e8933572f0a48c39aeea53084f43e0dce7c5dbbc028a'
      ),
    });

    const currentUsdcBalance = (await publicClient.readContract({
      address: USDC_TOKEN_CONFIG.address,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [smartWallet.address as `0x${string}`],
    })) as bigint;

    console.log('💰 Current Balances:');
    console.log(`  - PYUSD: ${currentPyusdBalance.toString()} wei`);
    console.log(`  - USDC: ${currentUsdcBalance.toString()} wei`);

    // Use balanced amounts based on available balances
    // Calculate how much we can add while keeping roughly 1:1 ratio
    const pyusdAvailable = currentPyusdBalance;
    const usdcAvailable = currentUsdcBalance;

    // Use the smaller amount to maintain balance (both in similar USD value)
    // Since both are USD-pegged, use the smaller USD amount for both
    const pyusdUsdValue = Number(pyusdAvailable) / 1000000; // PYUSD has 6 decimals
    const usdcUsdValue = Number(usdcAvailable) / 1000000; // USDC has 6 decimals

    // Use most of both amounts available, but ensure they're balanced
    // If we have very little USDC compared to PYUSD, use more USDC
    const maxLiquidityUsd = Math.min(pyusdUsdValue * 0.95, usdcUsdValue * 0.95);

    // However, if one token is much smaller, use a higher percentage of the smaller one
    // to maximize liquidity utilization
    let actualPyusdUsd: number;
    let actualUsdcUsd: number;

    if (usdcUsdValue < pyusdUsdValue * 0.1) {
      // USDC is much smaller, use more of it
      actualUsdcUsd = usdcUsdValue * 0.98;
      actualPyusdUsd = actualUsdcUsd; // Match the USDC amount
    } else if (pyusdUsdValue < usdcUsdValue * 0.1) {
      // PYUSD is much smaller, use more of it
      actualPyusdUsd = pyusdUsdValue * 0.98;
      actualUsdcUsd = actualPyusdUsd; // Match the PYUSD amount
    } else {
      // Amounts are reasonably balanced, use 90% of smaller
      actualPyusdUsd = actualUsdcUsd = maxLiquidityUsd;
    }

    const balancedPyusdAmount = BigInt(Math.floor(actualPyusdUsd * 1000000));
    const balancedUsdcAmount = BigInt(Math.floor(actualUsdcUsd * 1000000));

    console.log('🔄 === USING BALANCED AMOUNTS ===');
    console.log(
      `💰 Available: ${pyusdUsdValue.toFixed(2)} PYUSD + ${usdcUsdValue.toFixed(2)} USDC`
    );
    console.log(`💰 Max liquidity USD: ${maxLiquidityUsd.toFixed(2)}`);
    console.log(
      `💰 Using balanced amounts: ${Number(balancedPyusdAmount) / 1000000} PYUSD + ${Number(balancedUsdcAmount) / 1000000} USDC`
    );
    console.log(`💰 PYUSD amount: ${balancedPyusdAmount.toString()} wei`);
    console.log(`💰 USDC amount: ${balancedUsdcAmount.toString()} wei`);

    // Validate we have enough balance for balanced amounts
    if (currentPyusdBalance < balancedPyusdAmount) {
      throw new Error(
        `Insufficient PYUSD: have ${Number(currentPyusdBalance) / 1000000}, need ${Number(balancedPyusdAmount) / 1000000}`
      );
    }
    if (currentUsdcBalance < balancedUsdcAmount) {
      throw new Error(
        `Insufficient USDC: have ${Number(currentUsdcBalance) / 1000000}, need ${Number(balancedUsdcAmount) / 1000000}`
      );
    }

    console.log('✅ Sufficient balances for balanced amounts');

    // Use the balanced amounts for liquidity addition
    const actualPyusdAmount = balancedPyusdAmount;
    const actualUsdcAmount = balancedUsdcAmount;

    // Check and batch approve position manager for both tokens
    const MAX_UINT256 = 2n ** 256n - 1n;
    const approvalsNeeded = [];

    // Check PYUSD allowance
    console.log('🔍 Checking PYUSD allowance for Position Manager...');
    const pyusdAllowance = await checkPositionManagerAllowance(
      PYUSD_TOKEN_CONFIG.address
    );
    console.log(
      `PYUSD allowance: ${pyusdAllowance.toString()}, required: ${actualPyusdAmount.toString()}`
    );

    if (pyusdAllowance < actualPyusdAmount) {
      console.log('📝 PYUSD approval needed for Position Manager...');
      const pyusdApproveData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [UNISWAP_CONFIG.POSITION_MANAGER_ADDRESS, MAX_UINT256],
      });
      approvalsNeeded.push({
        to: PYUSD_TOKEN_CONFIG.address,
        data: pyusdApproveData,
        value: 0n,
      });
    } else {
      console.log('✅ Sufficient PYUSD allowance exists');
    }

    // Check USDC allowance
    console.log('🔍 Checking USDC allowance for Position Manager...');
    const usdcAllowance = await checkPositionManagerAllowance(
      USDC_TOKEN_CONFIG.address
    );
    console.log(
      `USDC allowance: ${usdcAllowance.toString()}, required: ${actualUsdcAmount.toString()}`
    );

    if (usdcAllowance < actualUsdcAmount) {
      console.log('📝 USDC approval needed for Position Manager...');
      const usdcApproveData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [UNISWAP_CONFIG.POSITION_MANAGER_ADDRESS, MAX_UINT256],
      });
      approvalsNeeded.push({
        to: USDC_TOKEN_CONFIG.address,
        data: usdcApproveData,
        value: 0n,
      });
    } else {
      console.log('✅ Sufficient USDC allowance exists');
    }

    // Batch send approvals if needed
    if (approvalsNeeded.length > 0) {
      console.log(`📝 Sending ${approvalsNeeded.length} approvals in batch...`);
      const batchTx = await client.sendTransaction({
        calls: approvalsNeeded,
      });
      console.log('✅ Batch approval tx:', batchTx);

      // Wait for batch transaction to be confirmed
      console.log('⏳ Waiting for batch approvals to be confirmed...');
      const { createPublicClient, http } = await import('viem');
      const { sepolia } = await import('viem/chains');
      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(
          'https://ethereum-sepolia-rpc.publicnode.com/b95cdba153627243b104e8933572f0a48c39aeea53084f43e0dce7c5dbbc028a'
        ),
      });
      await publicClient.waitForTransactionReceipt({ hash: batchTx });
      console.log('✅ Batch approvals confirmed on-chain');
    } else {
      console.log('✅ No approvals needed - sufficient allowances exist');
    }

    // Determine correct token order (token0 < token1 by address)
    const isUSDCToken0 =
      USDC_TOKEN_CONFIG.address.toLowerCase() <
      PYUSD_TOKEN_CONFIG.address.toLowerCase();
    const token0Address = isUSDCToken0
      ? USDC_TOKEN_CONFIG.address
      : PYUSD_TOKEN_CONFIG.address;
    const token1Address = isUSDCToken0
      ? PYUSD_TOKEN_CONFIG.address
      : USDC_TOKEN_CONFIG.address;

    // Assign amounts according to token order
    const amount0Desired = isUSDCToken0 ? actualUsdcAmount : actualPyusdAmount;
    const amount1Desired = isUSDCToken0 ? actualPyusdAmount : actualUsdcAmount;

    console.log('💰 Token assignment:');
    console.log(
      `  - Token0 (${isUSDCToken0 ? 'USDC' : 'PYUSD'}): ${amount0Desired.toString()}`
    );
    console.log(
      `  - Token1 (${isUSDCToken0 ? 'PYUSD' : 'USDC'}): ${amount1Desired.toString()}`
    );

    // Calculate tick range for full range position (matching cookbook)
    const tickSpacing = 60; // For 0.3% fee tier
    const maxTick = 887220; // Use cookbook's maxTick value
    const tickLower = -Math.floor(maxTick / tickSpacing) * tickSpacing;
    const tickUpper = Math.floor(maxTick / tickSpacing) * tickSpacing;

    console.log('🎯 Tick range:');
    console.log(`  - tickLower: ${tickLower}`);
    console.log(`  - tickUpper: ${tickUpper}`);
    console.log(`  - tickSpacing: ${tickSpacing}`);

    // Add 90% slippage protection (very loose to avoid failures)
    const slippageToleranceBps = 9000n; // 90% - EXTREMELY loose
    const amount0Min =
      (amount0Desired * (10000n - slippageToleranceBps)) / 10000n;
    const amount1Min =
      (amount1Desired * (10000n - slippageToleranceBps)) / 10000n;

    console.log('🛡️ Slippage protection (90% - EXTREMELY LOOSE):');
    console.log(`  - amount0Min: ${amount0Min.toString()}`);
    console.log(`  - amount1Min: ${amount1Min.toString()}`);

    // Create deadline (20 minutes from now)
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);

    // Prepare mint parameters
    const mintParams = {
      token0: token0Address,
      token1: token1Address,
      fee: UNISWAP_CONFIG.PYUSD_USDC_POOL.fee,
      tickLower,
      tickUpper,
      amount0Desired,
      amount1Desired,
      amount0Min,
      amount1Min,
      recipient: smartWallet.address as `0x${string}`,
      deadline,
    };

    console.log('📋 Final mint parameters:', {
      token0: mintParams.token0,
      token1: mintParams.token1,
      fee: mintParams.fee,
      tickLower: mintParams.tickLower,
      tickUpper: mintParams.tickUpper,
      amount0Desired: mintParams.amount0Desired.toString(),
      amount1Desired: mintParams.amount1Desired.toString(),
      amount0Min: mintParams.amount0Min.toString(),
      amount1Min: mintParams.amount1Min.toString(),
      recipient: mintParams.recipient,
      deadline: mintParams.deadline.toString(),
    });

    // Encode the mint function call
    const mintData = encodeFunctionData({
      abi: UNISWAP_V3_POSITION_MANAGER_ABI,
      functionName: 'mint',
      args: [mintParams],
    });

    console.log('Minting liquidity position...');
    const mintTx = await client.sendTransaction({
      to: UNISWAP_CONFIG.POSITION_MANAGER_ADDRESS,
      data: mintData,
      value: 0n,
    });

    console.log('✅ Liquidity mint tx:', mintTx);
    return { mintTx };
  };

  // Function to fetch PYUSD balance for smart wallet
  const fetchSmartWalletBalance = useCallback(async (address: string) => {
    try {
      console.log('Fetching smart wallet PYUSD balance for address:', address);

      // Import viem utilities dynamically
      const { createPublicClient, http } = await import('viem');
      const { sepolia } = await import('viem/chains');

      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(
          'https://ethereum-sepolia-rpc.publicnode.com/b95cdba153627243b104e8933572f0a48c39aeea53084f43e0dce7c5dbbc028a',
          {
            timeout: 10_000,
            retryCount: 2,
          }
        ),
      });

      // Fetch PYUSD balance
      const balance = await publicClient.readContract({
        address: PYUSD_TOKEN_CONFIG.address,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      });

      const formattedBalance = formatPyusdBalance(balance as bigint);
      console.log('🔵 SMART WALLET BALANCE UPDATE:');
      console.log('- Raw balance from contract:', balance);
      console.log('- Formatted balance:', formattedBalance);
      console.log('- Updating smartWalletBalance state to:', formattedBalance);
      console.log('- Updating balances.smartWallet to:', formattedBalance);

      setSmartWalletBalance(formattedBalance);

      // Also update the balances state
      setBalances(prev => {
        const newBalances = {
          ...prev,
          smartWallet: formattedBalance,
        };
        console.log(
          '- New balances state after smart wallet update:',
          newBalances
        );
        return newBalances;
      });

      // If they have a balance, show smart wallet view
      if (Number.parseFloat(formattedBalance) > 0) {
        setShowSmartWallet(true);
      }
    } catch (error) {
      console.error('Error fetching smart wallet balance:', error);
      setSmartWalletBalance('0');
    }
  }, []);

  // Custom input states
  const [showConservativeCustom, setShowConservativeCustom] = useState(false);
  const [showGrowthCustom, setShowGrowthCustom] = useState(false);
  const [conservativeCustomValue, setConservativeCustomValue] = useState('');
  const [growthCustomValue, setGrowthCustomValue] = useState('');

  // Slide to confirm states
  const [conservativeSliding, setConservativeSliding] = useState(false);
  const [growthSliding, setGrowthSliding] = useState(false);

  // Yield toggle states
  const [conservativeYieldEnabled, setConservativeYieldEnabled] =
    useState(false);

  // Check onboarding status - only show for truly new users
  useEffect(() => {
    console.log('🔍 ONBOARDING CHECK EFFECT RUNNING:');
    console.log('- ready:', ready);
    console.log('- authenticated:', authenticated);
    console.log('- onboardingChecked:', onboardingChecked);

    // Wait for everything to be ready and only run once
    if (!ready || !authenticated || onboardingChecked) {
      console.log('❌ Early return from onboarding check');
      return;
    }

    // Small delay to ensure all Privy data is loaded and prevent flickering
    const checkOnboarding = setTimeout(() => {
      // Check if user has ever connected any external wallet
      // Smart wallet is created automatically, so we only count external wallets
      const hasEverConnectedWallet =
        user?.linkedAccounts?.some(
          account =>
            account.type === 'wallet' &&
            account.walletClientType &&
            account.walletClientType !== 'privy'
        ) || false;

      console.log('📊 ONBOARDING DECISION FACTORS:');
      console.log('- hasEverConnectedWallet:', hasEverConnectedWallet);
      console.log('- user?.linkedAccounts:', user?.linkedAccounts);
      console.log(
        '- Total linked accounts:',
        user?.linkedAccounts?.length || 0
      );

      // Only show onboarding for users who have never connected an external wallet
      // Email, phone, social accounts are part of normal signup flow, not onboarding completion
      const isNewUser = !hasEverConnectedWallet;

      console.log('🎯 ONBOARDING LOGIC:');
      console.log('- isNewUser (no external wallet):', isNewUser);

      if (isNewUser) {
        console.log('✅ NEW USER DETECTED - SHOWING ONBOARDING MODAL');
        setShowOnboarding(true);
      } else {
        console.log('❌ RETURNING USER - NOT SHOWING ONBOARDING MODAL');
        console.log(
          '  - has connected external wallet?',
          hasEverConnectedWallet
        );
      }

      // Mark onboarding check as completed
      setOnboardingChecked(true);

      // Fetch balances for existing users
      console.log('⚡ BALANCE FETCHING TRIGGERS:');
      console.log('- Smart wallet exists:', !!smartWallet);
      console.log('- Smart wallet address:', smartWallet?.address);

      if (smartWallet) {
        console.log(
          '🔄 Triggering smart wallet balance fetch for:',
          smartWallet.address
        );
        fetchSmartWalletBalance(smartWallet.address);
      }

      // Fetch MetaMask balance if connected
      if (hasEverConnectedWallet) {
        console.log('🔄 Triggering MetaMask balance fetch');
        fetchMetaMaskBalance();
        setShowSmartWallet(true);
      }
    }, 100); // Small delay to prevent flickering

    return () => clearTimeout(checkOnboarding);
  }, [
    ready,
    authenticated,
    user,
    smartWallet,
    onboardingChecked,
    fetchMetaMaskBalance,
    fetchSmartWalletBalance,
  ]);

  // Calculate total balance
  const totalBalance = () => {
    console.log('=== TOTAL BALANCE CALCULATION ===');
    console.log('Raw balances object:', balances);
    console.log('Smart Wallet balance string:', balances.smartWallet);
    console.log('MetaMask balance string:', balances.metaMask);

    const smartWalletNum =
      Number.parseFloat(balances.smartWallet.replace(/,/g, '')) || 0;
    const metaMaskNum =
      Number.parseFloat(balances.metaMask.replace(/,/g, '')) || 0;

    console.log('Smart Wallet parsed number:', smartWalletNum);
    console.log('MetaMask parsed number:', metaMaskNum);

    const total = smartWalletNum + metaMaskNum;
    console.log('Total sum:', total);

    const formattedTotal = total.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    console.log('Formatted total:', formattedTotal);
    console.log('=== END TOTAL BALANCE CALCULATION ===');

    return formattedTotal;
  };

  const handleConservativeCustomSubmit = () => {
    if (
      conservativeCustomValue &&
      Number.parseFloat(conservativeCustomValue) > 0
    ) {
      setConservativeAmount(conservativeCustomValue);
      setShowConservativeCustom(false);
      setConservativeCustomValue('');
    }
  };

  const handleGrowthCustomSubmit = () => {
    if (growthCustomValue && Number.parseFloat(growthCustomValue) > 0) {
      setGrowthAmount(growthCustomValue);
      setShowGrowthCustom(false);
      setGrowthCustomValue('');
    }
  };

  const handleConservativeCustomCancel = () => {
    setShowConservativeCustom(false);
    setConservativeCustomValue('');
  };

  const handleGrowthCustomCancel = () => {
    setShowGrowthCustom(false);
    setGrowthCustomValue('');
  };

  const handleConservativeSlideComplete = () => {
    // Investment logic would go here
    console.log(`Investing ${conservativeAmount} in Conservative Vault`);
    setConservativeSliding(false);
  };

  const handleGrowthSlideComplete = async () => {
    if (!growthAmount) return;

    setInvestmentStatus('Starting investment...');

    try {
      const investmentAmountWei = BigInt(
        Number(growthAmount) * 10 ** PYUSD_TOKEN_CONFIG.decimals
      );

      console.log(
        `Investing ${growthAmount} PYUSD (${investmentAmountWei} wei) in Growth Vault`
      );

      // Enhanced debugging
      console.log('🔍 Investment Debug Info:');
      console.log('- Smart wallet address:', smartWallet?.address);
      console.log('- Client chain ID:', client?.chain?.id);
      console.log('- Investment amount (wei):', investmentAmountWei.toString());
      console.log(
        '- Half amount for swap (wei):',
        (investmentAmountWei / 2n).toString()
      );

      // Step 1: Check if MetaMask has PYUSD and transfer to smart wallet if needed
      if (metamaskWallet) {
        setInvestmentStatus('Checking MetaMask balance...');

        const { createPublicClient, http } = await import('viem');
        const { sepolia } = await import('viem/chains');

        const publicClient = createPublicClient({
          chain: sepolia,
          transport: http(
            'https://ethereum-sepolia-rpc.publicnode.com/b95cdba153627243b104e8933572f0a48c39aeea53084f43e0dce7c5dbbc028a'
          ),
        });

        const metamaskBalance = (await publicClient.readContract({
          address: PYUSD_TOKEN_CONFIG.address,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [metamaskWallet.address as `0x${string}`],
        })) as bigint;

        console.log('MetaMask PYUSD balance:', metamaskBalance.toString());

        // If MetaMask has sufficient PYUSD, transfer to smart wallet
        if (metamaskBalance >= investmentAmountWei) {
          setInvestmentStatus('Setting up PYUSD transfer to smart wallet...');
          await transferFromMetaMaskToSmartWallet(investmentAmountWei);

          // Wait for transfer to be mined
          setInvestmentStatus('Waiting for transfer to complete...');
          await new Promise(resolve => setTimeout(resolve, 8000));
        }
      }

      // Step 2: Check smart wallet balance
      setInvestmentStatus('Checking smart wallet balance...');
      const smartWalletBalance = await checkSmartWalletBalance();
      console.log('Smart wallet PYUSD balance:', smartWalletBalance.toString());
      console.log('Required PYUSD amount:', investmentAmountWei.toString());

      if (smartWalletBalance < investmentAmountWei) {
        const formattedBalance =
          Number(smartWalletBalance) / 10 ** PYUSD_TOKEN_CONFIG.decimals;
        const formattedRequired =
          Number(investmentAmountWei) / 10 ** PYUSD_TOKEN_CONFIG.decimals;
        throw new Error(
          `Insufficient PYUSD balance in smart wallet: have ${formattedBalance.toFixed(2)} PYUSD, need ${formattedRequired.toFixed(2)} PYUSD`
        );
      }

      // Step 3: Swap half PYUSD to USDC
      setInvestmentStatus('Swapping half PYUSD to USDC...');
      await swapHalfPyusdToUsdc(investmentAmountWei);

      // Wait for swap to be mined
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Step 4: Add liquidity to the pool
      setInvestmentStatus('Adding liquidity to pool...');
      const halfAmount = investmentAmountWei / 2n;

      // Check USDC balance after swap (estimated)
      const estimatedUsdcAmount = halfAmount / 70n; // Rough conversion rate

      await addLiquidityToPool(halfAmount, estimatedUsdcAmount);

      // Wait for liquidity addition to be mined
      await new Promise(resolve => setTimeout(resolve, 10000));

      setInvestmentStatus('Investment complete!');

      // Refresh vault balance
      await checkGrowthVaultBalance();

      setTimeout(() => {
        setInvestmentStatus('');
        setGrowthSliding(false);
      }, 3000);
    } catch (error) {
      console.error('Investment failed:', error);
      setInvestmentStatus(
        `Investment failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      setTimeout(() => {
        setInvestmentStatus('');
        setGrowthSliding(false);
      }, 5000);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setIsDepositFlow(false);
    // Refresh smart wallet balance after onboarding
    if (smartWallet) {
      fetchSmartWalletBalance(smartWallet.address);
    }
  };

  const handleDepositClick = () => {
    setIsDepositFlow(true);
    setShowOnboarding(true);
  };

  return (
    <div className='min-h-screen bg-white p-4'>
      <div className='mx-auto max-w-md space-y-8'>
        {/* Header */}
        <div className='px-2 pb-4 pt-12'>
          <div className='mb-2 flex items-center justify-between'>
            <div className='flex items-center' style={{ gap: '10px' }}>
              <div className='flex h-10 w-10 items-center justify-center'>
                <Image
                  src='/assets/PyInvest-logomark.png'
                  alt='PyInvest logo'
                  width={28}
                  height={28}
                  className='h-7 w-7'
                  unoptimized
                />
              </div>
              <div className='flex-1'>
                <h1 className='text-3xl font-medium leading-tight tracking-tight text-gray-900'>
                  PyInvest
                </h1>
              </div>
            </div>
            <div className='flex items-center space-x-3'>
              {/* Profile Icon - Direct Link */}
              <a
                href='/profile'
                className='flex items-center justify-center rounded-full bg-gray-100 p-2 transition-colors hover:bg-gray-200'
              >
                <User className='h-5 w-5 text-gray-600' />
              </a>

              {/* Network Status Dropdown */}
              <div className='relative'>
                <button
                  type='button'
                  onClick={() => setIsNetworkMenuOpen(!isNetworkMenuOpen)}
                  className='relative flex items-center justify-center rounded-full bg-gray-100 p-2 transition-colors hover:bg-gray-200'
                >
                  <Globe className='h-5 w-5 text-gray-600' />
                  {/* Blinking green dot */}
                  <div className='absolute -right-0.5 -top-0.5 h-3 w-3 animate-pulse rounded-full bg-green-500'>
                    <div className='absolute inset-0 h-3 w-3 animate-ping rounded-full bg-green-500 opacity-75' />
                  </div>
                </button>

                {/* Network Dropdown Menu */}
                {isNetworkMenuOpen && (
                  <>
                    <div className='absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg'>
                      <div className='py-1'>
                        <div className='border-b border-gray-100 px-4 py-3'>
                          <div className='mb-2 flex items-center space-x-2'>
                            <div className='h-2 w-2 animate-pulse rounded-full bg-green-500' />
                            <span className='text-xs font-medium text-gray-700'>
                              Network Status
                            </span>
                          </div>
                          <NetworkSelector />
                        </div>
                      </div>
                    </div>
                    <div
                      className='fixed inset-0 z-40'
                      onClick={() => setIsNetworkMenuOpen(false)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setIsNetworkMenuOpen(false);
                        }
                      }}
                      role='button'
                      tabIndex={0}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
          <div className='mb-2 mt-2 border-t border-gray-200' />
          <p className='text-base leading-relaxed text-gray-600' />
        </div>

        {/* Balance Display */}
        {showSmartWallet && smartWallet ? (
          <SmartWalletCard
            address={smartWallet.address}
            balance={smartWalletBalance}
          />
        ) : (
          <div className='space-y-4'>
            <div className='rounded-xl border border-gray-200 bg-white text-gray-950 shadow-sm'>
              <div className='p-6'>
                <p className='mb-2 text-base text-gray-500'>Balance</p>
                <div className='mb-1 flex items-center space-x-2'>
                  <span className='font-adelle text-4xl font-light text-gray-300'>
                    $
                  </span>
                  <p className='font-adelle text-4xl font-medium text-gray-800'>
                    {totalBalance()}
                  </p>
                  <Image
                    src='/assets/pyusd_logo.png'
                    alt='pyUSD logo'
                    width={24}
                    height={24}
                    className='ml-1 h-6 w-6'
                    unoptimized
                  />
                </div>
              </div>
            </div>

            {/* Deposit Button */}
            <button
              type='button'
              onClick={handleDepositClick}
              className='flex w-full items-center justify-center space-x-2 rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700'
            >
              <div className='relative flex items-center'>
                {/* Stacked/overlapped logos */}
                <Image
                  src='/assets/Venmo-icon.png'
                  alt='Venmo'
                  width={16}
                  height={16}
                  className='relative z-30 rounded-full border border-white shadow-sm'
                />
                <Image
                  src='/assets/pyusd_logo.png'
                  alt='PayPal'
                  width={16}
                  height={16}
                  className='relative z-20 -ml-1.5 rounded-full border border-white shadow-sm'
                />
                <Image
                  src='/assets/coinbase-icon.png'
                  alt='Coinbase'
                  width={16}
                  height={16}
                  className='relative z-10 -ml-1.5 rounded-full border border-white shadow-sm'
                />
              </div>
              <span>Deposit</span>
            </button>
          </div>
        )}

        {/* Investment Options */}
        <div className='space-y-6'>
          <h2 className='px-2 text-2xl font-medium text-gray-900'>
            Earn Strategies
          </h2>

          {/* Conservative Vault */}
          <div className='group cursor-pointer rounded-2xl border border-gray-200 bg-white transition-all duration-200'>
            <div className='p-6'>
              {/* Header Bar */}
              <div className='mb-5 flex items-center justify-between border-b border-gray-100 pb-4'>
                <div className='flex items-center space-x-2'>
                  <div className='flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-gray-100'>
                    <Globe className='h-4 w-4 text-gray-400' />
                  </div>
                  <span className='text-base font-medium text-gray-700'>
                    Conservative Vault
                  </span>
                </div>
                <div className='flex items-center space-x-1'>
                  <VerifiedIcon className='h-4 w-4 text-blue-500' />
                  <span
                    className={`text-sm font-medium ${conservativeYieldEnabled ? 'text-blue-600' : 'text-gray-400'}`}
                  >
                    4.2% - 5.8% APY
                  </span>
                </div>
              </div>

              {/* Toggle Section */}
              <div className='mb-5 flex items-center justify-between'>
                <span className='text-sm font-medium text-gray-700'>
                  Yield Active
                </span>
                <button
                  type='button'
                  onClick={() =>
                    setConservativeYieldEnabled(!conservativeYieldEnabled)
                  }
                  className={`relative inline-flex h-8 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    conservativeYieldEnabled ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  role='switch'
                  aria-checked={conservativeYieldEnabled}
                >
                  <span
                    aria-hidden='true'
                    className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      conservativeYieldEnabled
                        ? 'translate-x-4'
                        : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Amount Selection */}
              <div className='mb-5 space-y-4'>
                <div className='text-base font-medium text-gray-900'>
                  Select amount to invest
                </div>
                <div className='flex w-full gap-2'>
                  <div className='relative w-full overflow-hidden'>
                    <div
                      className={`duration-250 flex w-full gap-2 transition-all ease-in-out ${
                        showConservativeCustom
                          ? '-translate-x-full transform opacity-0'
                          : 'translate-x-0 transform opacity-100'
                      }`}
                    >
                      <div role='radiogroup' className='flex w-full gap-2'>
                        {['25', '50', '100', '250'].map(amount => (
                          <button
                            key={amount}
                            type='button'
                            onClick={() => {
                              if (conservativeAmount === amount) {
                                setConservativeAmount('');
                              } else {
                                setConservativeAmount(amount);
                              }
                            }}
                            className={`flex w-full cursor-pointer justify-center rounded-md border px-2 py-2 text-center text-sm font-normal leading-normal transition-colors hover:bg-gray-50 ${
                              conservativeAmount === amount
                                ? 'border-blue-500 bg-blue-50 text-blue-600'
                                : 'border-gray-200 text-gray-500'
                            }`}
                          >
                            ${amount}
                          </button>
                        ))}
                      </div>
                      <button
                        type='button'
                        onClick={() => setShowConservativeCustom(true)}
                        className='flex min-w-[42px] items-center justify-center rounded-lg border border-gray-300 py-2 text-gray-600 transition-colors hover:bg-gray-50'
                      >
                        <Edit3 className='h-4 w-4' />
                      </button>
                    </div>
                    <div
                      className={`duration-250 absolute inset-0 flex w-full gap-2 transition-all ease-in-out ${
                        showConservativeCustom
                          ? 'translate-x-0 transform opacity-100'
                          : 'translate-x-full transform opacity-0'
                      }`}
                    >
                      <input
                        type='number'
                        value={conservativeCustomValue}
                        onChange={e =>
                          setConservativeCustomValue(e.target.value)
                        }
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            handleConservativeCustomSubmit();
                          } else if (e.key === 'Escape') {
                            handleConservativeCustomCancel();
                          }
                        }}
                        placeholder='Enter amount'
                        className='flex-1 rounded-lg border-[1.5px] border-gray-300 bg-white px-3 py-2 text-base text-gray-700 placeholder-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400'
                      />
                      <button
                        type='button'
                        onClick={handleConservativeCustomSubmit}
                        className='flex min-w-[42px] items-center justify-center rounded-lg border-[1.5px] border-green-500 bg-green-50 py-2 font-bold text-green-600 transition-colors hover:bg-green-100'
                      >
                        ✓
                      </button>
                      <button
                        type='button'
                        onClick={handleConservativeCustomCancel}
                        className='flex min-w-[42px] items-center justify-center rounded-lg border-[1.5px] border-gray-300 py-2 font-bold text-gray-600 transition-colors hover:bg-gray-50'
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Press to Confirm Button */}
              <div
                className={`relative h-11 w-full overflow-hidden rounded-lg transition-all duration-500 ease-in-out ${
                  conservativeAmount && conservativeYieldEnabled
                    ? 'bg-blue-600'
                    : 'bg-blue-600/30'
                }`}
              >
                <div
                  className={`absolute inset-0 flex items-center justify-center text-base font-medium transition-all duration-500 ease-in-out ${
                    conservativeAmount && conservativeYieldEnabled
                      ? 'text-white'
                      : 'text-white/80'
                  } ${conservativeSliding ? 'opacity-0' : 'opacity-100'}`}
                >
                  <span>
                    {!conservativeYieldEnabled
                      ? 'Yield disabled'
                      : conservativeAmount
                        ? `Invest $${conservativeAmount}`
                        : 'Select amount to invest'}
                  </span>
                  {conservativeAmount && conservativeYieldEnabled && (
                    <ArrowRight className='ml-2 h-4 w-4' />
                  )}
                </div>
                {/* Explosion animation */}
                <div
                  className={`absolute left-1/2 top-1/2 flex items-center justify-center rounded-full text-base font-medium text-white transition-all duration-200 ease-out ${
                    conservativeSliding
                      ? 'h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 opacity-100'
                      : 'h-0 w-0 -translate-x-1/2 -translate-y-1/2 opacity-0'
                  }`}
                  style={{ backgroundColor: '#10B981' }}
                >
                  <span
                    className={
                      conservativeSliding ? 'opacity-100' : 'opacity-0'
                    }
                  >
                    ✓ Confirmed!
                  </span>
                </div>
                {conservativeAmount && conservativeYieldEnabled && (
                  <button
                    type='button'
                    onMouseDown={() => setConservativeSliding(true)}
                    onMouseUp={() => {
                      if (conservativeSliding) {
                        setTimeout(
                          () => handleConservativeSlideComplete(),
                          1200
                        );
                      }
                    }}
                    onMouseLeave={() => setConservativeSliding(false)}
                    onTouchStart={() => setConservativeSliding(true)}
                    onTouchEnd={() => {
                      if (conservativeSliding) {
                        setTimeout(
                          () => handleConservativeSlideComplete(),
                          1200
                        );
                      }
                    }}
                    className='absolute inset-0 h-full w-full cursor-pointer bg-transparent'
                  />
                )}
              </div>
            </div>
          </div>

          {/* Growth Vault */}
          <div className='group cursor-pointer rounded-2xl border border-gray-200 bg-white transition-all duration-200'>
            <div className='p-6'>
              {/* Header Bar */}
              <div className='mb-5 flex items-center justify-between border-b border-gray-100 pb-4'>
                <div className='flex items-center space-x-2'>
                  <div className='flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-gray-100'>
                    <Globe className='h-4 w-4 text-gray-400' />
                  </div>
                  <span className='text-base font-medium text-gray-700'>
                    Growth Vault
                  </span>
                </div>
                <div className='flex items-center space-x-1'>
                  <VerifiedIcon className='h-4 w-4 text-blue-500' />
                  <span className='text-sm font-medium text-blue-600'>
                    8.5% - 12.3% APY
                  </span>
                </div>
              </div>

              {/* Vault Balance Display */}
              <div className='mb-5 rounded-lg bg-gray-50 p-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium text-gray-700'>
                    Current Vault Balance
                  </span>
                  <div className='flex items-center space-x-2'>
                    <span className='text-lg font-semibold text-gray-900'>
                      ${growthVaultBalance}
                    </span>
                    <span className='text-sm text-gray-500'>USD</span>
                  </div>
                </div>
                {smartWallet && (
                  <div className='mt-2 text-xs text-gray-500'>
                    Smart Wallet: {smartWallet.address.slice(0, 6)}...
                    {smartWallet.address.slice(-4)}
                  </div>
                )}
              </div>

              {/* Investment Status */}
              {investmentStatus && (
                <div className='mb-5 rounded-lg bg-blue-50 p-4'>
                  <div className='flex items-center space-x-2'>
                    <div className='h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent' />
                    <span className='text-sm font-medium text-blue-700'>
                      {investmentStatus}
                    </span>
                  </div>
                </div>
              )}

              {/* Toggle Section - Commented Out */}
              {/*
              <div className='mb-5 flex items-center justify-between'>
                <span className='text-sm font-medium text-gray-700'>
                  Yield Active
                </span>
                <button
                  onClick={() => setGrowthYieldEnabled(!growthYieldEnabled)}
                  className={`relative inline-flex h-8 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    growthYieldEnabled ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  role='switch'
                  aria-checked={growthYieldEnabled}
                >
                  <span
                    aria-hidden='true'
                    className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      growthYieldEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              */}

              {/* Amount Selection */}
              <div className='mb-5 space-y-4'>
                <div className='text-base font-medium text-gray-900'>
                  Select amount to invest
                </div>
                <div className='flex w-full gap-2'>
                  <div className='relative w-full overflow-hidden'>
                    <div
                      className={`duration-250 flex w-full gap-2 transition-all ease-in-out ${
                        showGrowthCustom
                          ? '-translate-x-full transform opacity-0'
                          : 'translate-x-0 transform opacity-100'
                      }`}
                    >
                      <div role='radiogroup' className='flex w-full gap-2'>
                        {['25', '50', '100', '250'].map(amount => (
                          <button
                            key={amount}
                            type='button'
                            onClick={() => {
                              if (growthAmount === amount) {
                                setGrowthAmount('');
                              } else {
                                setGrowthAmount(amount);
                              }
                            }}
                            className={`flex w-full cursor-pointer justify-center rounded-md border px-2 py-2 text-center text-sm font-normal leading-normal transition-colors hover:bg-gray-50 ${
                              growthAmount === amount
                                ? 'border-blue-500 bg-blue-50 text-blue-600'
                                : 'border-gray-200 text-gray-500'
                            }`}
                          >
                            ${amount}
                          </button>
                        ))}
                      </div>
                      <button
                        type='button'
                        onClick={() => setShowGrowthCustom(true)}
                        className='flex min-w-[42px] items-center justify-center rounded-lg border border-gray-300 py-2 text-gray-600 transition-colors hover:bg-gray-50'
                      >
                        <Edit3 className='h-4 w-4' />
                      </button>
                    </div>
                    <div
                      className={`duration-250 absolute inset-0 flex w-full gap-2 transition-all ease-in-out ${
                        showGrowthCustom
                          ? 'translate-x-0 transform opacity-100'
                          : 'translate-x-full transform opacity-0'
                      }`}
                    >
                      <input
                        type='number'
                        value={growthCustomValue}
                        onChange={e => setGrowthCustomValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            handleGrowthCustomSubmit();
                          } else if (e.key === 'Escape') {
                            handleGrowthCustomCancel();
                          }
                        }}
                        placeholder='Enter amount'
                        className='flex-1 rounded-lg border-[1.5px] border-gray-300 bg-white px-3 py-2 text-base text-gray-700 placeholder-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400'
                      />
                      <button
                        type='button'
                        onClick={handleGrowthCustomSubmit}
                        className='flex min-w-[42px] items-center justify-center rounded-lg border-[1.5px] border-green-500 bg-green-50 py-2 font-bold text-green-600 transition-colors hover:bg-green-100'
                      >
                        ✓
                      </button>
                      <button
                        type='button'
                        onClick={handleGrowthCustomCancel}
                        className='flex min-w-[42px] items-center justify-center rounded-lg border-[1.5px] border-gray-300 py-2 font-bold text-gray-600 transition-colors hover:bg-gray-50'
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Press to Confirm Button */}
              <div
                className={`relative h-11 w-full overflow-hidden rounded-lg transition-all duration-500 ease-in-out ${
                  growthAmount && !investmentStatus
                    ? 'bg-blue-600'
                    : 'bg-blue-600/30'
                }`}
              >
                <div
                  className={`absolute inset-0 flex items-center justify-center text-base font-medium transition-all duration-500 ease-in-out ${
                    growthAmount && !investmentStatus
                      ? 'text-white'
                      : 'text-white/80'
                  } ${growthSliding ? 'opacity-0' : 'opacity-100'}`}
                >
                  <span>
                    {investmentStatus
                      ? 'Processing...'
                      : growthAmount
                        ? `Invest $${growthAmount}`
                        : 'Select amount to invest'}
                  </span>
                  {growthAmount && !investmentStatus && (
                    <ArrowRight className='ml-2 h-4 w-4' />
                  )}
                </div>
                {/* Explosion animation */}
                <div
                  className={`absolute left-1/2 top-1/2 flex items-center justify-center rounded-full text-base font-medium text-white transition-all duration-200 ease-out ${
                    growthSliding
                      ? 'h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 opacity-100'
                      : 'h-0 w-0 -translate-x-1/2 -translate-y-1/2 opacity-0'
                  }`}
                  style={{ backgroundColor: '#10B981' }}
                >
                  <span className={growthSliding ? 'opacity-100' : 'opacity-0'}>
                    ✓ Confirmed!
                  </span>
                </div>
                {growthAmount && !investmentStatus && (
                  <button
                    type='button'
                    onMouseDown={() => setGrowthSliding(true)}
                    onMouseUp={() => {
                      if (growthSliding) {
                        setTimeout(() => handleGrowthSlideComplete(), 1200);
                      }
                    }}
                    onMouseLeave={() => setGrowthSliding(false)}
                    onTouchStart={() => setGrowthSliding(true)}
                    onTouchEnd={() => {
                      if (growthSliding) {
                        setTimeout(() => handleGrowthSlideComplete(), 1200);
                      }
                    }}
                    className='absolute inset-0 h-full w-full cursor-pointer bg-transparent'
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className='rounded-xl border-0 bg-gradient-to-r from-blue-600 to-blue-700'>
          <div className='p-6 text-white'>
            <div className='mb-3 flex items-center space-x-2'>
              <Zap className='h-5 w-5' />
              <h3 className='text-lg font-medium'>Instant Deployment</h3>
            </div>
            <p className='mb-4 text-base text-blue-100'>
              Your pyUSD starts earning yield immediately after investment
            </p>
            <div className='grid grid-cols-2 gap-4 text-center'>
              <div>
                <p className='text-2xl font-bold'>$2.4M+</p>
                <p className='text-sm text-blue-100'>Total Value Locked</p>
              </div>
              <div>
                <p className='text-2xl font-bold'>1,200+</p>
                <p className='text-sm text-blue-100'>Active Investors</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='pb-8 text-center text-sm text-gray-500'>
          <p>Powered by institutional-grade DeFi protocols</p>
          <p className='mt-1'>Your funds are secured by smart contracts</p>
        </div>
      </div>

      {/* Onboarding Flow */}
      {onboardingChecked && (
        <OnboardingFlow
          isOpen={showOnboarding}
          onComplete={handleOnboardingComplete}
          skipWelcome={isDepositFlow}
        />
      )}
    </div>
  );
}
