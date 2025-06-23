'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useSmartWallets } from '@privy-io/react-auth/smart-wallets';
import { AlertCircle, ArrowRight, Award, CheckCircle, Copy, Edit3, Globe, Shield, Zap } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { encodeFunctionData } from 'viem';

import { Modal } from '@/components/ui/modal';
import { NetworkSelector } from '@/components/ui/network-selector';

// Custom Verified Icon Component
const VerifiedIcon = ({ className }: { className?: string }) => (
  <svg viewBox='0 0 24 24' width='1.2em' height='1.2em' className={className}>
    <g
      fill='none'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='2'
    >
      <path d='M3.85 8.62a4 4 0 0 1 4.78-4.77a4 4 0 0 1 6.74 0a4 4 0 0 1 4.78 4.78a4 4 0 0 1 0 6.74a4 4 0 0 1-4.77 4.78a4 4 0 0 1-6.75 0a4 4 0 0 1-4.78-4.77a4 4 0 0 1 0-6.76'></path>
      <path d='m9 12l2 2l4-4'></path>
    </g>
  </svg>
);

interface WalletBalance {
  venmo: string;
  coinbase: string;
}

// PYUSD Token Configuration (Sepolia)
const PYUSD_TOKEN_CONFIG = {
  address: '0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9' as const,
  decimals: 6,
  symbol: 'PYUSD',
};

// USDC Token Configuration (Sepolia)
const USDC_TOKEN_CONFIG = {
  address: '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238' as const,
  decimals: 6,
  symbol: 'USDC',
};

// Uniswap V3 Configuration (Sepolia)
const UNISWAP_CONFIG = {
  ROUTER_ADDRESS: '0x3A9D48AB9751398BbFa63ad67599Bb04e4BdF98b' as const,
  POSITION_MANAGER_ADDRESS: '0x1238536071E1c677A632429e3655c799b22cDA52' as const,
  PYUSD_USDC_POOL: {
    address: '0x1eA26f380A71E15E75E61c6D66B4242c1f652FEd' as const,
    fee: 3000, // 0.3%
  },
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

// Uniswap V3 Router ABI (simplified)
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
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const { client } = useSmartWallets();
  const [conservativeAmount, setConservativeAmount] = useState('');
  const [growthAmount, setGrowthAmount] = useState('');
  const [isVenmoModalOpen, setIsVenmoModalOpen] = useState(false);
  const [venmoAddress, setVenmoAddress] = useState('');
  const [venmoInputValue, setVenmoInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [balances, setBalances] = useState<WalletBalance>({
    venmo: '0',
    coinbase: '4,200.00', // Hardcoded for now
  });

  // Growth Vault specific state
  const [growthVaultBalance, setGrowthVaultBalance] = useState('0.00');
  const [investmentStatus, setInvestmentStatus] = useState('');

  // KYC state management
  const [kycStatus, setKycStatus] = useState<'not_started' | 'passed' | 'claimed'>('not_started');

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

  // Mock KYC status - in real app this would come from backend
  useEffect(() => {
    if (user?.id) {
      // Mock logic - simulate different states based on user ID
      const userId = user.id;
      if (userId.endsWith('1') || userId.endsWith('2')) {
        setKycStatus('passed');
      } else if (userId.endsWith('3') || userId.endsWith('4')) {
        setKycStatus('claimed');
      } else {
        setKycStatus('not_started');
      }
    }
  }, [user?.id]);

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
  const [growthYieldEnabled, setGrowthYieldEnabled] = useState(false);

  // Load Venmo address from localStorage on component mount
  useEffect(() => {
    const savedVenmoAddress = localStorage.getItem('venmoWalletAddress');
    if (savedVenmoAddress) {
      setVenmoAddress(savedVenmoAddress);
      // Fetch balance for the saved address
      fetchVenmoBalance(savedVenmoAddress);
    }
  }, []);

  // Check Growth Vault balance on component mount and when smart wallet changes
  useEffect(() => {
    if (smartWallet && client) {
      checkGrowthVaultBalance();
    }
  }, [smartWallet, client]);

    // Function to check Growth Vault balance (LP token balance)
  const checkGrowthVaultBalance = async () => {
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
      const nftBalance = await publicClient.readContract({
        address: UNISWAP_CONFIG.POSITION_MANAGER_ADDRESS,
        abi: UNISWAP_V3_POSITION_MANAGER_ABI,
        functionName: 'balanceOf',
        args: [smartWallet.address as `0x${string}`],
      }) as bigint;

      console.log('Smart wallet NFT positions:', nftBalance.toString());

      // For simplicity, we'll show the number of positions as the "balance"
      // In a real implementation, you'd iterate through the positions and calculate their total value
      const positionCount = Number(nftBalance);
      setGrowthVaultBalance(positionCount.toString());

      console.log('Growth Vault positions:', positionCount);
    } catch (error) {
      console.error('Error checking Growth Vault balance:', error);
      setGrowthVaultBalance('0');
    }
  };

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

  // Function to transfer PYUSD from MetaMask to Smart Wallet
  const transferFromMetaMaskToSmartWallet = async (amount: bigint) => {
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

    // Transfer PYUSD from MetaMask to Smart Wallet
    const transferData = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [smartWallet.address as `0x${string}`, amount],
    });

    const txHash = await metamaskProvider.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: metamaskWallet.address,
          to: PYUSD_TOKEN_CONFIG.address,
          data: transferData,
        },
      ],
    });

    console.log('Transfer to smart wallet tx:', txHash);
    return txHash;
  };

  // Function to swap half PYUSD to USDC using smart wallet
  const swapHalfPyusdToUsdc = async (totalAmount: bigint) => {
    if (!client || !smartWallet) {
      throw new Error('Smart wallet client not available');
    }

    const swapAmount = totalAmount / 2n; // Half of the total amount
    console.log(`Swapping ${swapAmount} PYUSD to USDC`);

    // Switch smart wallet to Sepolia
    await client.switchChain({ id: 11155111 });

    // First approve the router to spend PYUSD
    const approveData = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [UNISWAP_CONFIG.ROUTER_ADDRESS, swapAmount],
    });

    console.log('Approving router to spend PYUSD...');
    const approveTx = await client.sendTransaction({
      to: PYUSD_TOKEN_CONFIG.address,
      data: approveData,
      value: 0n,
    });
    console.log('PYUSD approval tx:', approveTx);

    // Wait for approval to be mined
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Create swap parameters
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200); // 20 minutes
    const minAmountOut = swapAmount / 75n; // Conservative estimate based on price ratio

    // Encode swap command for Universal Router
    const { encodeAbiParameters } = await import('viem');

    const commands = '0x00'; // V3_SWAP_EXACT_IN

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
        minAmountOut,
        // Path: PYUSD -> 0.3% fee -> USDC
        `0x${PYUSD_TOKEN_CONFIG.address.slice(2)}${UNISWAP_CONFIG.PYUSD_USDC_POOL.fee.toString(16).padStart(6, '0')}${USDC_TOKEN_CONFIG.address.slice(2)}` as `0x${string}`,
        true,
      ]
    );

    const executeCalldata = encodeFunctionData({
      abi: UNISWAP_V3_ROUTER_ABI,
      functionName: 'execute',
      args: [commands as `0x${string}`, [swapInput], deadline],
    });

    console.log('Executing swap...');
    const swapTx = await client.sendTransaction({
      to: UNISWAP_CONFIG.ROUTER_ADDRESS,
      data: executeCalldata,
      value: 0n,
    });

    console.log('Swap tx:', swapTx);
    return swapTx;
  };

    // Function to add liquidity to the pool
  const addLiquidityToPool = async (pyusdAmount: bigint, usdcAmount: bigint) => {
    if (!client || !smartWallet) {
      throw new Error('Smart wallet client not available');
    }

    console.log(`Adding liquidity: ${pyusdAmount} PYUSD + ${usdcAmount} USDC`);

    // Approve position manager to spend both tokens
    const pyusdApproveData = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [UNISWAP_CONFIG.POSITION_MANAGER_ADDRESS, pyusdAmount],
    });

    const usdcApproveData = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [UNISWAP_CONFIG.POSITION_MANAGER_ADDRESS, usdcAmount],
    });

    console.log('Approving position manager for PYUSD...');
    const pyusdApproveTx = await client.sendTransaction({
      to: PYUSD_TOKEN_CONFIG.address,
      data: pyusdApproveData,
      value: 0n,
    });

    console.log('Approving position manager for USDC...');
    const usdcApproveTx = await client.sendTransaction({
      to: USDC_TOKEN_CONFIG.address,
      data: usdcApproveData,
      value: 0n,
    });

    console.log('Token approvals:', { pyusdApproveTx, usdcApproveTx });

    // Wait for approvals to be mined
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Determine correct token order (token0 < token1 by address)
    const isUSDCToken0 = USDC_TOKEN_CONFIG.address.toLowerCase() < PYUSD_TOKEN_CONFIG.address.toLowerCase();
    const token0Address = isUSDCToken0 ? USDC_TOKEN_CONFIG.address : PYUSD_TOKEN_CONFIG.address;
    const token1Address = isUSDCToken0 ? PYUSD_TOKEN_CONFIG.address : USDC_TOKEN_CONFIG.address;

    // Assign amounts according to token order
    const amount0Desired = isUSDCToken0 ? usdcAmount : pyusdAmount;
    const amount1Desired = isUSDCToken0 ? pyusdAmount : usdcAmount;

    // Calculate tick range for full range position
    const tickSpacing = 60; // For 0.3% fee tier
    const maxTick = 887270;
    const tickLower = -Math.floor(maxTick / tickSpacing) * tickSpacing;
    const tickUpper = Math.floor(maxTick / tickSpacing) * tickSpacing;

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
      amount0Min: (amount0Desired * 95n) / 100n, // 5% slippage tolerance
      amount1Min: (amount1Desired * 95n) / 100n, // 5% slippage tolerance
      recipient: smartWallet.address,
      deadline,
    };

    console.log('Mint parameters:', {
      ...mintParams,
      amount0Desired: mintParams.amount0Desired.toString(),
      amount1Desired: mintParams.amount1Desired.toString(),
      amount0Min: mintParams.amount0Min.toString(),
      amount1Min: mintParams.amount1Min.toString(),
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

    console.log('Liquidity mint tx:', mintTx);
    return { pyusdApproveTx, usdcApproveTx, mintTx };
  };

  // Real function to fetch PYUSD balance for Venmo wallet from Sepolia
  const fetchVenmoBalance = async (address: string) => {
    try {
      setIsLoading(true);
      console.log('Fetching PYUSD balance for address:', address);

      // Import viem utilities dynamically
      const { createPublicClient, http } = await import('viem');
      const { sepolia } = await import('viem/chains');

      // Use multiple RPC endpoints for better reliability
      const rpcUrls = [
        'https://ethereum-sepolia-rpc.publicnode.com/b95cdba153627243b104e8933572f0a48c39aeea53084f43e0dce7c5dbbc028a',
        'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
        'https://rpc.sepolia.org',
        'https://rpc2.sepolia.org',
      ];

      let publicClient;
      let workingRpc = '';

      // Try different RPC endpoints for better reliability
      for (const rpcUrl of rpcUrls) {
        try {
          console.log(`Trying RPC: ${rpcUrl}`);
          publicClient = createPublicClient({
            chain: sepolia,
            transport: http(rpcUrl, {
              timeout: 10_000, // 10 second timeout
              retryCount: 2,
            }),
          });

          // Test the connection with a simple call
          await publicClient.getBlockNumber();
          workingRpc = rpcUrl;
          console.log(`Successfully connected to: ${rpcUrl}`);
          break;
        } catch (rpcError) {
          console.log(`Failed to connect to ${rpcUrl}:`, rpcError);
          continue;
        }
      }

      if (!publicClient) {
        throw new Error('All Sepolia RPC endpoints failed');
      }

      console.log('Using RPC:', workingRpc);
      console.log('Token Contract:', PYUSD_TOKEN_CONFIG.address);

      // Verify the PYUSD contract exists
      try {
        const contractCode = await publicClient.getBytecode({
          address: PYUSD_TOKEN_CONFIG.address,
        });

        if (!contractCode || contractCode === '0x') {
          throw new Error(
            `PYUSD contract not found at ${PYUSD_TOKEN_CONFIG.address} on Sepolia`
          );
        }
        console.log('PYUSD contract verified - bytecode found');
      } catch (contractError) {
        console.error('Contract verification failed:', contractError);
        throw new Error(
          `PYUSD contract verification failed: ${contractError instanceof Error ? contractError.message : 'Unknown error'}`
        );
      }

      // Fetch PYUSD balance
      console.log('Fetching PYUSD balance...');
      const balance = await publicClient.readContract({
        address: PYUSD_TOKEN_CONFIG.address,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      });

      console.log('Raw balance:', balance);
      const formattedBalance = formatPyusdBalance(balance as bigint);
      console.log('Formatted balance:', formattedBalance);

      setBalances(prev => ({
        ...prev,
        venmo: formattedBalance,
      }));
    } catch (error) {
      console.error('Error fetching Venmo PYUSD balance:', error);
      // Set balance to 0 on error but show error message
      setBalances(prev => ({
        ...prev,
        venmo: '0',
      }));

      // Show user-friendly error message
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to fetch PYUSD balance: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total balance
  const totalBalance = () => {
    const venmoNum = parseFloat(balances.venmo.replace(/,/g, '')) || 0;
    const coinbaseNum = parseFloat(balances.coinbase.replace(/,/g, '')) || 0;
    return (venmoNum + coinbaseNum).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleVenmoSubmit = async () => {
    if (!venmoInputValue.trim()) return;

    setIsLoading(true);

    try {
      // Validate Ethereum address format (basic validation)
      const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
      if (!ethAddressRegex.test(venmoInputValue.trim())) {
        alert('Please enter a valid Ethereum address');
        return;
      }

      // Save to localStorage
      localStorage.setItem('venmoWalletAddress', venmoInputValue.trim());
      setVenmoAddress(venmoInputValue.trim());

      // Fetch balance for the new address
      await fetchVenmoBalance(venmoInputValue.trim());

      // Show success animation
      setShowSuccess(true);

      // Close modal after animation
      setTimeout(() => {
        setIsVenmoModalOpen(false);
        setShowSuccess(false);
        setVenmoInputValue('');
      }, 2000);
    } catch (error) {
      console.error('Error saving Venmo address:', error);
      alert('Error saving address. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleConservativeCustomSubmit = () => {
    if (conservativeCustomValue && parseFloat(conservativeCustomValue) > 0) {
      setConservativeAmount(conservativeCustomValue);
      setShowConservativeCustom(false);
      setConservativeCustomValue('');
    }
  };

  const handleGrowthCustomSubmit = () => {
    if (growthCustomValue && parseFloat(growthCustomValue) > 0) {
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

      console.log(`Investing ${growthAmount} PYUSD (${investmentAmountWei} wei) in Growth Vault`);

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

        const metamaskBalance = await publicClient.readContract({
          address: PYUSD_TOKEN_CONFIG.address,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [metamaskWallet.address as `0x${string}`],
        }) as bigint;

        console.log('MetaMask PYUSD balance:', metamaskBalance.toString());

        // If MetaMask has sufficient PYUSD, transfer to smart wallet
        if (metamaskBalance >= investmentAmountWei) {
          setInvestmentStatus('Transferring PYUSD to smart wallet...');
          await transferFromMetaMaskToSmartWallet(investmentAmountWei);

          // Wait for transfer to be mined
          await new Promise(resolve => setTimeout(resolve, 8000));
        }
      }

      // Step 2: Check smart wallet balance
      setInvestmentStatus('Checking smart wallet balance...');
      const smartWalletBalance = await checkSmartWalletBalance();
      console.log('Smart wallet PYUSD balance:', smartWalletBalance.toString());

      if (smartWalletBalance < investmentAmountWei) {
        throw new Error('Insufficient PYUSD balance in smart wallet');
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
      setInvestmentStatus(`Investment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

      setTimeout(() => {
        setInvestmentStatus('');
        setGrowthSliding(false);
      }, 5000);
    }
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
              <a
                href='/profile'
                className='rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors flex items-center space-x-2'
              >
                {kycStatus === 'not_started' && (
                  <AlertCircle className='h-4 w-4 text-gray-400' />
                )}
                {kycStatus === 'passed' && (
                  <Award className='h-4 w-4 text-yellow-500' />
                )}
                {kycStatus === 'claimed' && (
                  <Shield className='h-4 w-4 text-green-500' />
                )}
                <span>Profile</span>
              </a>
              <NetworkSelector />
            </div>
          </div>
          <div className='mb-2 mt-2 border-t border-gray-200'></div>
          <p className='text-base leading-relaxed text-gray-600'>
            Easily & securely put digital money to work in 1 click
          </p>
        </div>

        {/* Balance Display */}
        <div className='rounded-xl border border-gray-200 bg-white text-gray-950 shadow-sm'>
          <div className='p-6'>
            <p className='mb-2 text-base text-gray-500'>Amount</p>
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

            <div className='mt-4 border-t border-gray-100 pt-4'>
              <p className='mb-2 text-sm text-gray-400'>Balance sources</p>
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center'>
                    <Image
                      src='/assets/Venmo-icon.png'
                      alt='Venmo'
                      width={16}
                      height={16}
                      className='mr-2 h-4 w-4'
                    />
                    <span className='text-base text-gray-500'>Venmo</span>
                  </div>
                  <div className='flex items-center'>
                    {venmoAddress ? (
                      <span className='text-sm text-gray-500'>
                        ${balances.venmo}
                      </span>
                    ) : (
                      <button
                        onClick={() => setIsVenmoModalOpen(true)}
                        className='text-sm text-blue-600 hover:text-blue-800 hover:underline'
                      >
                        Configure
                      </button>
                    )}
                  </div>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center'>
                    <Image
                      src='/assets/coinbase-icon.png'
                      alt='Coinbase'
                      width={16}
                      height={16}
                      className='mr-2 h-4 w-4'
                    />
                    <span className='text-base text-gray-500'>Coinbase</span>
                  </div>
                  <span className='text-sm text-gray-500'>
                    ${balances.coinbase}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Venmo Configuration Modal */}
        <Modal
          isOpen={isVenmoModalOpen}
          onClose={() => {
            if (!isLoading) {
              setIsVenmoModalOpen(false);
              setVenmoInputValue('');
              setShowSuccess(false);
            }
          }}
          title='Configure Venmo Wallet'
        >
          {showSuccess ? (
            <div className='text-center'>
              <div className='mb-4 flex justify-center'>
                <CheckCircle className='h-16 w-16 animate-pulse text-green-500' />
              </div>
              <h3 className='mb-2 text-lg font-semibold text-gray-900'>
                Success!
              </h3>
              <p className='text-gray-600'>
                Your Venmo wallet has been configured successfully.
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              <div>
                <h3 className='mb-3 text-lg font-semibold text-gray-900'>
                  How to get your Venmo Balance:
                </h3>
                <div className='space-y-2 text-sm text-gray-700'>
                  <div className='flex items-start space-x-2'>
                    <span className='mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600'>
                      1
                    </span>
                    <p>Open your Venmo app and go to the Crypto section</p>
                  </div>
                  <div className='flex items-start space-x-2'>
                    <span className='mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600'>
                      2
                    </span>
                    <p>Tap on PayPal USD at the top of the list of options</p>
                  </div>
                  <div className='flex items-start space-x-2'>
                    <span className='mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600'>
                      3
                    </span>
                    <p>
                      Copy your Venmo PayPal wallet address (starts with 0x)
                    </p>
                  </div>
                  <div className='flex items-start space-x-2'>
                    <span className='mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600'>
                      4
                    </span>
                    <p>Paste the address below</p>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor='venmo-address'
                  className='mb-2 block text-sm font-medium text-gray-700'
                >
                  Venmo ETH Address
                </label>
                <div className='relative'>
                  <input
                    id='venmo-address'
                    type='text'
                    value={venmoInputValue}
                    onChange={e => setVenmoInputValue(e.target.value)}
                    placeholder='0x...'
                    disabled={isLoading}
                    className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100'
                  />
                  {venmoInputValue && (
                    <button
                      onClick={() => copyToClipboard(venmoInputValue)}
                      className='absolute right-2 top-1/2 -translate-y-1/2 transform p-1 text-gray-400 hover:text-gray-600'
                    >
                      <Copy className='h-4 w-4' />
                    </button>
                  )}
                </div>
              </div>

              <div className='flex space-x-3 pt-4'>
                <button
                  onClick={() => {
                    setIsVenmoModalOpen(false);
                    setVenmoInputValue('');
                  }}
                  disabled={isLoading}
                  className='flex-1 rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-50'
                >
                  Cancel
                </button>
                <button
                  onClick={handleVenmoSubmit}
                  disabled={isLoading || !venmoInputValue.trim()}
                  className='flex-1 rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50'
                >
                  {isLoading ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </div>
          )}
        </Modal>

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
                        autoFocus={showConservativeCustom}
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
                      {growthVaultBalance}
                    </span>
                    <span className='text-sm text-gray-500'>Positions</span>
                  </div>
                </div>
                {smartWallet && (
                  <div className='mt-2 text-xs text-gray-500'>
                    Smart Wallet: {smartWallet.address.slice(0, 6)}...{smartWallet.address.slice(-4)}
                  </div>
                )}
              </div>

              {/* Investment Status */}
              {investmentStatus && (
                <div className='mb-5 rounded-lg bg-blue-50 p-4'>
                  <div className='flex items-center space-x-2'>
                    <div className='h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent'></div>
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
                        autoFocus={showGrowthCustom}
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
    </div>
  );
}
