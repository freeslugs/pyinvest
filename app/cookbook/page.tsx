'use client';

import { getAccessToken, usePrivy, useWallets } from '@privy-io/react-auth';
import { useSmartWallets } from '@privy-io/react-auth/smart-wallets';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { encodeFunctionData } from 'viem';

import WalletList from '../../components/WalletList';
import {
  NETWORKS,
  UNISWAP_V3_POSITION_MANAGER_ABI,
  UNISWAP_V3_POSITION_MANAGER_ADDRESS,
  UNISWAP_V3_ROUTER_ABI,
  UNISWAP_V3_ROUTER_ADDRESS,
  getPoolsForNetwork,
  getTokensForNetwork,
} from '../../lib/constants';

// Types for our pool data
interface PoolData {
  metaMaskPYUSDBalance: number;
  metaMaskUSDCBalance: number;
  routerAllowance: number;
  positionManagerAllowance: number;
  positionManagerUSDCAllowance: number;
  poolLiquidity: string;
  swapStatus: string;
  liquidityStatus: string;
  nftPositionCount: number;
  totalPoolValueUSD: number;
  error?: string;
}

async function verifyToken() {
  const url = '/api/verify';
  const accessToken = await getAccessToken();
  const result = await fetch(url, {
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined),
    },
  });

  return await result.json();
}

export default function CookbookPage() {
  const [verifyResult, setVerifyResult] = useState();
  const [smartWalletDeploymentStatus, setSmartWalletDeploymentStatus] =
    useState<{ isDeployed: boolean; isChecking: boolean }>({
      isDeployed: false,
      isChecking: false,
    });
  const [isNetworkSwitching, setIsNetworkSwitching] = useState(false);
  const [testResults, setTestResults] = useState<{
    message?: string;
    signature?: string;
    error?: string;
    signerAddress?: string;
    isSmartWalletSigner?: boolean;
    verificationDetails?: string;
  }>({});
  const [tokenTestResults, setTokenTestResults] = useState<{
    approveStatus?: string;
    transferStatus?: string;
    approveHash?: string;
    transferHash?: string;
    error?: string;
    balances?: { metamask: string; smartWallet: string };
  }>({});

  const [usdcTestResults, setUsdcTestResults] = useState<{
    approveStatus?: string;
    transferStatus?: string;
    aaveDepositStatus?: string;
    approveHash?: string;
    transferHash?: string;
    aaveDepositHash?: string;
    error?: string;
    balances?: { metamask: string; smartWallet: string };
  }>({});

  const [comprehensiveBalances, setComprehensiveBalances] = useState<{
    ethBalances?: { eoaEth: string; smartWalletEth: string };
    usdcBalances?: { eoaUsdc: string; smartWalletUsdc: string };
    aavePositions?: {
      eoaAweth: string;
      smartWalletAweth: string;
      eoaAusdc: string;
      smartWalletAusdc: string;
    };
    error?: string;
    loading?: boolean;
  }>({});
  const router = useRouter();
  const {
    ready,
    authenticated,
    user,
    logout,
    linkEmail,
    linkWallet,
    unlinkEmail,
    linkPhone,
    unlinkPhone,
    unlinkWallet,
    linkGoogle,
    unlinkGoogle,
    linkTwitter,
    unlinkTwitter,
    linkDiscord,
    unlinkDiscord,
  } = usePrivy();
  const { wallets } = useWallets();
  const { client } = useSmartWallets();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  const numAccounts = user?.linkedAccounts?.length || 0;
  const canRemoveAccount = numAccounts > 1;

  const email = user?.email;
  const phone = user?.phone;
  const wallet = user?.wallet;

  // Find smart wallet from linked accounts
  const smartWallet = user?.linkedAccounts?.find(
    account => account.type === 'smart_wallet'
  ) as
    | { type: 'smart_wallet'; address: string; smartWalletType?: string }
    | undefined;

  const googleSubject = user?.google?.subject || null;
  const twitterSubject = user?.twitter?.subject || null;
  const discordSubject = user?.discord?.subject || null;

  // Available networks for switching
  const availableNetworks = [
    { id: 1, name: 'Ethereum Mainnet', rpcUrl: 'https://cloudflare-eth.com' },
    {
      id: 11155111,
      name: 'Sepolia Testnet',
      rpcUrl: 'https://rpc.sepolia.org',
    },
    { id: 8453, name: 'Base', rpcUrl: 'https://mainnet.base.org' },
    { id: 84532, name: 'Base Sepolia', rpcUrl: 'https://sepolia.base.org' },
  ];
  // PYUSD Token Configuration (Sepolia)
  const PYUSD_TOKEN_CONFIG = {
    address: '0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9' as const,
    decimals: 6,
    symbol: 'PYUSD',
  };

  // USDC Token Configuration (Sepolia)
  const USDC_TOKEN_CONFIG = {
    address: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8' as const,
    decimals: 6,
    symbol: 'USDC',
  };

  // AAVE Configuration (Sepolia)
  const AAVE_CONFIG = {
    POOL: '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951' as const,
    WETH_GATEWAY: '0x387d311e47e80b498169e6fb51d3193167d89f7d' as const,
    WETH: '0xc558dbdd856501fcd9aaf1e62eae57a9f0629a3c' as const,
    AWETH: '0x5b071b590a59395fE4025A0Ccc1FcC931AAc1830' as const,
    AUSDC: '0x16dA4541aD1807f4443d92D26044C1147406EB80' as const, // aUSDC token address
    MULTICALL3: '0xcA11bde05977b3631167028862bE2a173976CA11' as const,
  };

  // Add Permit2 configuration after AAVE_CONFIG
  const PERMIT2_CONFIG = {
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

  // ERC20 ABI for approve and transfer functions
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

  // WETH Gateway ABI for depositing ETH
  const WETH_GATEWAY_ABI = [
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

  // Get the connected MetaMask wallet
  const metamaskWallet = wallets.find(
    wallet => wallet.walletClientType === 'metamask'
  );

  // Pool data state
  const [poolData, setPoolData] = useState<PoolData>({
    metaMaskPYUSDBalance: 0,
    metaMaskUSDCBalance: 0,
    routerAllowance: 0,
    positionManagerAllowance: 0,
    positionManagerUSDCAllowance: 0,
    poolLiquidity: '0',
    swapStatus: 'Ready',
    liquidityStatus: 'Ready',
    nftPositionCount: 0,
    totalPoolValueUSD: 0,
  });

  // Add state for Permit2 allowances
  const [permit2Data, setPermit2Data] = useState<{
    pyusdPermit2: {
      isValid: boolean;
      isExpired: boolean;
      expiration: number;
    } | null;
    usdcPermit2: {
      isValid: boolean;
      isExpired: boolean;
      expiration: number;
    } | null;
  }>({
    pyusdPermit2: null,
    usdcPermit2: null,
  });

  // Form state
  const [swapAmount, setSwapAmount] = useState<string>('1');
  const [liquidityAmount, setLiquidityAmount] = useState<string>('2');

  // Get token and pool configurations for Sepolia
  const SEPOLIA_TOKENS = getTokensForNetwork(NETWORKS.SEPOLIA.id);
  const SEPOLIA_POOLS = getPoolsForNetwork(NETWORKS.SEPOLIA.id);
  const PYUSD_TOKEN = SEPOLIA_TOKENS.PYUSD;
  const USDC_TOKEN = SEPOLIA_TOKENS.USDC;
  const PYUSD_USDC_POOL = SEPOLIA_POOLS.PYUSD_USDC;

  // Function to switch networks
  const switchNetwork = async (chainId: number) => {
    if (!client) return;

    setIsNetworkSwitching(true);
    try {
      await client.switchChain({ id: chainId });
      // Clear test results when switching networks
      setTestResults({});
      setSmartWalletDeploymentStatus({ isDeployed: false, isChecking: false });
    } catch (error) {
      console.error('Error switching network:', error);
    } finally {
      setIsNetworkSwitching(false);
    }
  };

  // Function to check if smart wallet is deployed
  const checkSmartWalletDeployment = async () => {
    if (!smartWallet?.address || !client?.chain) return;

    setSmartWalletDeploymentStatus({ isDeployed: false, isChecking: true });

    try {
      // Import viem utilities dynamically
      const { createPublicClient, http } = await import('viem');

      // Create a public client for the current chain
      const publicClient = createPublicClient({
        chain: client.chain,
        transport: http(),
      });

      // Check if there's code at the smart wallet address
      const code = await publicClient.getBytecode({
        address: smartWallet.address as `0x${string}`,
      });

      const isDeployed = code !== undefined && code !== '0x' && code !== null;
      setSmartWalletDeploymentStatus({ isDeployed, isChecking: false });
    } catch (error) {
      console.error('Error checking deployment:', error);
      setSmartWalletDeploymentStatus({ isDeployed: false, isChecking: false });
    }
  };

  // Function to test smart wallet with message signing and verification
  const testSmartWallet = async () => {
    if (!client || !smartWallet) return;

    setTestResults({ message: 'Testing...', signature: '', error: '' });

    try {
      const message = `Hello from Smart Wallet! Timestamp: ${Date.now()}`;

      // Sign the message
      const signature = await client.signMessage({
        message,
      });

      // Import viem utilities for signature verification
      const { verifyMessage, recoverMessageAddress } = await import('viem');

      // Try to verify against smart wallet address
      let isSmartWalletSigner = false;
      let recoveredAddress = '';
      let verificationDetails = '';

      try {
        // First, try to verify directly against smart wallet address
        isSmartWalletSigner = await verifyMessage({
          address: smartWallet.address as `0x${string}`,
          message,
          signature: signature as `0x${string}`,
        });

        if (isSmartWalletSigner) {
          verificationDetails =
            '✅ Signature verified against smart wallet address';
        } else {
          // If direct verification fails, try to recover the address
          recoveredAddress = await recoverMessageAddress({
            message,
            signature: signature as `0x${string}`,
          });

          if (
            recoveredAddress.toLowerCase() === smartWallet.address.toLowerCase()
          ) {
            isSmartWalletSigner = true;
            verificationDetails = '✅ Recovered address matches smart wallet';
          } else {
            verificationDetails = `⚠️ Signature from different address: ${recoveredAddress}`;

            // Check if it's the embedded wallet
            const embeddedWallet = user?.linkedAccounts?.find(
              account =>
                account.type === 'wallet' &&
                account.walletClientType === 'privy'
            ) as { address: string } | undefined;

            if (
              embeddedWallet &&
              recoveredAddress.toLowerCase() ===
                embeddedWallet.address.toLowerCase()
            ) {
              verificationDetails +=
                ' (This is your embedded wallet - not the smart wallet!)';
            }
          }
        }
      } catch (verifyError) {
        // Fallback: just recover the address
        try {
          recoveredAddress = await recoverMessageAddress({
            message,
            signature: signature as `0x${string}`,
          });
          verificationDetails = `⚠️ Could not verify directly. Recovered address: ${recoveredAddress}`;
        } catch (recoverError) {
          verificationDetails = `❌ Verification failed: ${recoverError instanceof Error ? recoverError.message : 'Unknown error'}`;
        }
      }

      setTestResults({
        message,
        signature,
        error: '',
        signerAddress: recoveredAddress || smartWallet.address,
        isSmartWalletSigner,
        verificationDetails,
      });
    } catch (error) {
      console.error('Error testing smart wallet:', error);
      setTestResults({
        message: '',
        signature: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Function to check token balances
  const checkTokenBalances = async () => {
    if (!client?.chain || client.chain.id !== 11155111 || !smartWallet) {
      console.log('Must be on Sepolia network with smart wallet');
      setTokenTestResults({
        error: 'Must be on Sepolia network with smart wallet',
      });
      return;
    }

    setTokenTestResults(prev => ({ ...prev, error: '', balances: undefined }));

    try {
      const { createPublicClient, http } = await import('viem');
      const { sepolia } = await import('viem/chains');

      console.log('Creating public client for Sepolia...');

      // Use multiple RPC endpoints for better reliability
      const rpcUrls = [
        'https://ethereum-sepolia-rpc.publicnode.com',
        'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
        'https://rpc.sepolia.org',
        'https://rpc2.sepolia.org',
      ];

      let publicClient;
      let workingRpc = '';

      // Try different RPC endpoints
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

      // Get MetaMask wallet address
      const metamaskWallet = user?.linkedAccounts?.find(
        account =>
          account.type === 'wallet' && account.walletClientType !== 'privy'
      ) as { address: string } | undefined;

      if (!metamaskWallet) {
        console.log('MetaMask wallet not found');
        setTokenTestResults({ error: 'MetaMask wallet not found' });
        return;
      }

      console.log('Checking balances for:');
      console.log('MetaMask:', metamaskWallet.address);
      console.log('Smart Wallet:', smartWallet.address);
      console.log('Token Contract:', PYUSD_TOKEN_CONFIG.address);
      console.log('Using RPC:', workingRpc);

      // First, let's verify the contract exists
      try {
        const contractCode = await publicClient.getBytecode({
          address: PYUSD_TOKEN_CONFIG.address,
        });

        if (!contractCode || contractCode === '0x') {
          throw new Error(
            `Token contract not found at ${PYUSD_TOKEN_CONFIG.address} on Sepolia`
          );
        }
        console.log('Contract verified - bytecode found');
      } catch (contractError) {
        console.error('Contract verification failed:', contractError);
        setTokenTestResults({
          error: `Token contract verification failed: ${contractError instanceof Error ? contractError.message : 'Unknown error'}`,
        });
        return;
      }

      // Check balances with individual calls for better error handling
      let metamaskBalance, smartWalletBalance;

      try {
        console.log('Checking MetaMask balance...');
        metamaskBalance = await publicClient.readContract({
          address: PYUSD_TOKEN_CONFIG.address,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [metamaskWallet.address as `0x${string}`],
        });
        console.log('MetaMask balance:', metamaskBalance);
      } catch (mmError) {
        console.error('MetaMask balance check failed:', mmError);
        metamaskBalance = 0n;
      }

      try {
        console.log('Checking Smart Wallet balance...');
        smartWalletBalance = await publicClient.readContract({
          address: PYUSD_TOKEN_CONFIG.address,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [smartWallet.address as `0x${string}`],
        });
        console.log('Smart Wallet balance:', smartWalletBalance);
      } catch (swError) {
        console.error('Smart Wallet balance check failed:', swError);
        smartWalletBalance = 0n;
      }

      const formatBalance = (balance: bigint) => {
        return (Number(balance) / 10 ** PYUSD_TOKEN_CONFIG.decimals).toFixed(2);
      };

      setTokenTestResults(prev => ({
        ...prev,
        balances: {
          metamask: formatBalance(metamaskBalance as bigint),
          smartWallet: formatBalance(smartWalletBalance as bigint),
        },
      }));

      console.log('Balance check completed successfully');
    } catch (error) {
      console.error('Error checking balances:', error);
      setTokenTestResults({
        error: `Error checking balances: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  // Function to approve smart wallet to spend PYUSD from MetaMask
  const approveSmartWallet = async () => {
    if (!client?.chain || client.chain.id !== 11155111 || !smartWallet) {
      setTokenTestResults({
        error: 'Must be on Sepolia network with smart wallet',
      });
      return;
    }

    setTokenTestResults({ approveStatus: 'Requesting approval...', error: '' });

    try {
      // Get MetaMask wallet address to ensure we're approving from the right wallet
      const metamaskWallet = user?.linkedAccounts?.find(
        account =>
          account.type === 'wallet' && account.walletClientType !== 'privy'
      ) as { address: string } | undefined;

      if (!metamaskWallet) {
        setTokenTestResults({ error: 'MetaMask wallet not found' });
        return;
      }

      console.log('Approving from MetaMask wallet:', metamaskWallet.address);
      console.log('Approving smart wallet to spend:', smartWallet.address);

      // Switch to the MetaMask wallet first, then send the approval transaction
      const metamaskWalletInList = wallets.find(
        w =>
          w.address.toLowerCase() === metamaskWallet.address.toLowerCase() &&
          w.walletClientType !== 'privy'
      );

      if (!metamaskWalletInList) {
        setTokenTestResults({
          error: 'MetaMask wallet not found in wallet list',
        });
        return;
      }

      // Get the MetaMask wallet's provider directly
      const metamaskProvider = await metamaskWalletInList.getEthereumProvider();

      // Check if MetaMask is on Sepolia network (chainId 11155111 = 0xaa36a7 in hex)
      const currentChainId = await metamaskProvider.request({
        method: 'eth_chainId',
      });
      const sepoliaChainId = '0xaa36a7'; // 11155111 in hex

      if (currentChainId !== sepoliaChainId) {
        setTokenTestResults({
          approveStatus: 'Switching MetaMask to Sepolia...',
          error: '',
        });

        try {
          // Request to switch to Sepolia
          await metamaskProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: sepoliaChainId }],
          });

          // Wait a moment for the switch to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (switchError: any) {
          // If the network doesn't exist, try to add it
          if (switchError.code === 4902) {
            try {
              await metamaskProvider.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: sepoliaChainId,
                    chainName: 'Sepolia Testnet',
                    nativeCurrency: {
                      name: 'Sepolia ETH',
                      symbol: 'SEP',
                      decimals: 18,
                    },
                    rpcUrls: ['https://rpc.sepolia.org'],
                    blockExplorerUrls: ['https://sepolia.etherscan.io'],
                  },
                ],
              });
            } catch (addError) {
              setTokenTestResults({
                error: 'Failed to add Sepolia network to MetaMask',
              });
              return;
            }
          } else {
            setTokenTestResults({
              error: 'Failed to switch MetaMask to Sepolia network',
            });
            return;
          }
        }
      }

      setTokenTestResults({
        approveStatus: 'Preparing approval transaction...',
        error: '',
      });

      const { encodeFunctionData } = await import('viem');

      // Approve 100 PYUSD (with 6 decimals)
      const approveAmount = BigInt(100 * 10 ** PYUSD_TOKEN_CONFIG.decimals);

      const data = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [smartWallet.address as `0x${string}`, approveAmount],
      });

      // Send transaction directly through MetaMask provider
      const txHash = await metamaskProvider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: metamaskWallet.address,
            to: PYUSD_TOKEN_CONFIG.address,
            data,
          },
        ],
      });

      setTokenTestResults({
        approveStatus: 'Approval successful!',
        approveHash: txHash,
        error: '',
      });

      // Refresh balances after approval
      setTimeout(() => {
        checkTokenBalances();
      }, 2000);
    } catch (error) {
      console.error('Error approving:', error);
      setTokenTestResults({
        approveStatus: 'Approval failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Function to transfer PYUSD using smart wallet
  const transferWithSmartWallet = async () => {
    if (!client?.chain || client.chain.id !== 11155111 || !smartWallet) {
      setTokenTestResults({
        error: 'Must be on Sepolia network with smart wallet',
      });
      return;
    }

    setTokenTestResults({
      ...tokenTestResults,
      transferStatus: 'Preparing transfer...',
      error: '',
    });

    try {
      const { encodeFunctionData } = await import('viem');

      // zakhap.eth resolved address
      const recipientAddress = '0x92811c982c63d3aff70c6c7546a3f6bde1d6d861';

      // Get MetaMask wallet address
      const metamaskWallet = user?.linkedAccounts?.find(
        account =>
          account.type === 'wallet' && account.walletClientType !== 'privy'
      ) as { address: string } | undefined;

      if (!metamaskWallet) {
        setTokenTestResults({ error: 'MetaMask wallet not found' });
        return;
      }

      // Transfer 1 PYUSD (with 6 decimals)
      const transferAmount = BigInt(1 * 10 ** PYUSD_TOKEN_CONFIG.decimals);

      const data = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'transferFrom',
        args: [
          metamaskWallet.address as `0x${string}`,
          recipientAddress as `0x${string}`,
          transferAmount,
        ],
      });

      setTokenTestResults({
        ...tokenTestResults,
        transferStatus: 'Executing transfer with smart wallet...',
        error: '',
      });

      // This will be signed by the smart wallet
      const txHash = await client.sendTransaction({
        to: PYUSD_TOKEN_CONFIG.address,
        data,
        value: 0n,
      });

      setTokenTestResults({
        ...tokenTestResults,
        transferStatus: 'Transfer successful!',
        transferHash: txHash,
        error: '',
      });

      // Refresh balances after transfer
      setTimeout(() => checkTokenBalances(), 2000);
    } catch (error) {
      console.error('Error transferring:', error);
      setTokenTestResults({
        ...tokenTestResults,
        transferStatus: 'Transfer failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // USDC Functions - duplicated from PYUSD functions
  // Function to check USDC token balances
  const checkUsdcBalances = async () => {
    if (!client?.chain || client.chain.id !== 11155111 || !smartWallet) {
      console.log('Must be on Sepolia network with smart wallet');
      setUsdcTestResults({
        error: 'Must be on Sepolia network with smart wallet',
      });
      return;
    }

    setUsdcTestResults(prev => ({ ...prev, error: '', balances: undefined }));

    try {
      const { createPublicClient, http } = await import('viem');
      const { sepolia } = await import('viem/chains');

      console.log('Creating public client for Sepolia...');

      // Use multiple RPC endpoints for better reliability
      const rpcUrls = [
        'https://ethereum-sepolia-rpc.publicnode.com',
        'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
        'https://rpc.sepolia.org',
        'https://rpc2.sepolia.org',
      ];

      let publicClient;
      let workingRpc = '';

      // Try different RPC endpoints
      for (const rpcUrl of rpcUrls) {
        try {
          console.log(`Trying RPC: ${rpcUrl}`);
          publicClient = createPublicClient({
            chain: sepolia,
            transport: http(rpcUrl),
          });

          // Test the connection with a simple call
          await publicClient.getBlockNumber();
          workingRpc = rpcUrl;
          console.log(`Successfully connected to ${rpcUrl}`);
          break;
        } catch (rpcError) {
          console.log(`Failed to connect to ${rpcUrl}:`, rpcError);
          continue;
        }
      }

      if (!publicClient || !workingRpc) {
        throw new Error('Failed to connect to any RPC endpoint');
      }

      console.log(`Using RPC: ${workingRpc}`);

      // Get MetaMask wallet address
      const metamaskWallet = user?.linkedAccounts?.find(
        account =>
          account.type === 'wallet' && account.walletClientType !== 'privy'
      ) as { address: string } | undefined;

      if (!metamaskWallet) {
        setUsdcTestResults({ error: 'MetaMask wallet not found' });
        return;
      }

      console.log('MetaMask wallet address:', metamaskWallet.address);
      console.log('Smart wallet address:', smartWallet.address);
      console.log('USDC token address:', USDC_TOKEN_CONFIG.address);

      // Check MetaMask wallet USDC balance
      console.log('Checking MetaMask USDC balance...');
      const metamaskBalanceRaw = await publicClient.readContract({
        address: USDC_TOKEN_CONFIG.address,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [metamaskWallet.address as `0x${string}`],
      });

      console.log('MetaMask balance raw:', metamaskBalanceRaw);
      const metamaskBalance = (
        Number(metamaskBalanceRaw) /
        10 ** USDC_TOKEN_CONFIG.decimals
      ).toFixed(6);

      // Check Smart Wallet USDC balance
      console.log('Checking Smart Wallet USDC balance...');
      const smartWalletBalanceRaw = await publicClient.readContract({
        address: USDC_TOKEN_CONFIG.address,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [smartWallet.address as `0x${string}`],
      });

      console.log('Smart Wallet balance raw:', smartWalletBalanceRaw);
      const smartWalletBalance = (
        Number(smartWalletBalanceRaw) /
        10 ** USDC_TOKEN_CONFIG.decimals
      ).toFixed(6);

      console.log('Balances calculated successfully:', {
        metamask: metamaskBalance,
        smartWallet: smartWalletBalance,
      });

      setUsdcTestResults({
        error: '',
        balances: {
          metamask: metamaskBalance,
          smartWallet: smartWalletBalance,
        },
      });
    } catch (error) {
      console.error('Error checking USDC balances:', error);
      setUsdcTestResults({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Function to approve smart wallet to spend USDC from MetaMask
  const approveSmartWalletUsdc = async () => {
    if (!client?.chain || client.chain.id !== 11155111 || !smartWallet) {
      setUsdcTestResults({
        error: 'Must be on Sepolia network with smart wallet',
      });
      return;
    }

    setUsdcTestResults({ approveStatus: 'Requesting approval...', error: '' });

    try {
      // Get MetaMask wallet address to ensure we're approving from the right wallet
      const metamaskWallet = user?.linkedAccounts?.find(
        account =>
          account.type === 'wallet' && account.walletClientType !== 'privy'
      ) as { address: string } | undefined;

      if (!metamaskWallet) {
        setUsdcTestResults({ error: 'MetaMask wallet not found' });
        return;
      }

      console.log('Approving from MetaMask wallet:', metamaskWallet.address);
      console.log('Approving smart wallet to spend:', smartWallet.address);

      // Switch to the MetaMask wallet first, then send the approval transaction
      const metamaskWalletInList = wallets.find(
        w =>
          w.address.toLowerCase() === metamaskWallet.address.toLowerCase() &&
          w.walletClientType !== 'privy'
      );

      if (!metamaskWalletInList) {
        setUsdcTestResults({
          error: 'MetaMask wallet not found in wallet list',
        });
        return;
      }

      // Get the MetaMask wallet's provider directly
      const metamaskProvider = await metamaskWalletInList.getEthereumProvider();

      // Check if MetaMask is on Sepolia network (chainId 11155111 = 0xaa36a7 in hex)
      const currentChainId = await metamaskProvider.request({
        method: 'eth_chainId',
      });
      const sepoliaChainId = '0xaa36a7'; // 11155111 in hex

      if (currentChainId !== sepoliaChainId) {
        setUsdcTestResults({
          approveStatus: 'Switching MetaMask to Sepolia...',
          error: '',
        });

        try {
          // Request to switch to Sepolia
          await metamaskProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: sepoliaChainId }],
          });

          // Wait a moment for the switch to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (switchError: any) {
          // If the network doesn't exist, try to add it
          if (switchError.code === 4902) {
            try {
              await metamaskProvider.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: sepoliaChainId,
                    chainName: 'Sepolia Testnet',
                    nativeCurrency: {
                      name: 'Sepolia ETH',
                      symbol: 'SEP',
                      decimals: 18,
                    },
                    rpcUrls: ['https://rpc.sepolia.org'],
                    blockExplorerUrls: ['https://sepolia.etherscan.io'],
                  },
                ],
              });
            } catch (addError) {
              setUsdcTestResults({
                error: 'Failed to add Sepolia network to MetaMask',
              });
              return;
            }
          } else {
            setUsdcTestResults({
              error: 'Failed to switch MetaMask to Sepolia network',
            });
            return;
          }
        }
      }

      setUsdcTestResults({
        approveStatus: 'Preparing approval transaction...',
        error: '',
      });

      const { encodeFunctionData } = await import('viem');

      // Approve 100 USDC (with 6 decimals)
      const approveAmount = BigInt(100 * 10 ** USDC_TOKEN_CONFIG.decimals);

      const data = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [smartWallet.address as `0x${string}`, approveAmount],
      });

      // Send transaction directly through MetaMask provider
      const txHash = await metamaskProvider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: metamaskWallet.address,
            to: USDC_TOKEN_CONFIG.address,
            data,
          },
        ],
      });

      setUsdcTestResults({
        approveStatus: 'Approval successful!',
        approveHash: txHash,
        error: '',
      });

      // Refresh balances after approval
      setTimeout(() => {
        checkUsdcBalances();
      }, 2000);
    } catch (error) {
      console.error('Error approving:', error);
      setUsdcTestResults({
        approveStatus: 'Approval failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Function to transfer USDC using smart wallet
  const transferWithSmartWalletUsdc = async () => {
    if (!client?.chain || client.chain.id !== 11155111 || !smartWallet) {
      setUsdcTestResults({
        error: 'Must be on Sepolia network with smart wallet',
      });
      return;
    }

    setUsdcTestResults({ transferStatus: 'Preparing transfer...', error: '' });

    try {
      // Get MetaMask wallet address
      const metamaskWallet = user?.linkedAccounts?.find(
        account =>
          account.type === 'wallet' && account.walletClientType !== 'privy'
      ) as { address: string } | undefined;

      if (!metamaskWallet) {
        setUsdcTestResults({ error: 'MetaMask wallet not found' });
        return;
      }

      console.log('Transferring from MetaMask:', metamaskWallet.address);
      console.log('Using smart wallet:', smartWallet.address);

      // Transfer 1 USDC (with 6 decimals)
      const transferAmount = BigInt(1 * 10 ** USDC_TOKEN_CONFIG.decimals);

      const recipientAddress = '0x7A33615d12A12f58b25c653dc5E44188D44f6898'; // freeslugs.eth

      const { encodeFunctionData } = await import('viem');

      const data = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'transferFrom',
        args: [
          metamaskWallet.address as `0x${string}`,
          recipientAddress as `0x${string}`,
          transferAmount,
        ],
      });

      console.log('Sending transferFrom transaction...');

      // This will be signed by the smart wallet
      const txHash = await client.sendTransaction({
        to: USDC_TOKEN_CONFIG.address,
        data,
        value: 0n,
      });

      console.log('Transfer transaction hash:', txHash);

      setUsdcTestResults({
        ...usdcTestResults,
        transferStatus: 'Transfer successful!',
        transferHash: txHash,
        error: '',
      });

      // Refresh balances after transfer
      setTimeout(() => checkUsdcBalances(), 2000);
    } catch (error) {
      console.error('Error transferring:', error);
      setUsdcTestResults({
        ...usdcTestResults,
        transferStatus: 'Transfer failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Function to deposit ETH to AAVE using Smart Wallet
  const depositEthToAave = async () => {
    if (!client?.chain || client.chain.id !== 11155111 || !smartWallet) {
      setUsdcTestResults({
        error: 'Must be on Sepolia network with smart wallet',
      });
      return;
    }

    setUsdcTestResults({
      aaveDepositStatus: 'Preparing ETH deposit to AAVE...',
      error: '',
    });

    try {
      console.log('Starting ETH deposit to AAVE via smart wallet...');
      console.log('Smart wallet address:', smartWallet.address);

      // Check if smart wallet has enough ETH balance
      const { createPublicClient, http } = await import('viem');
      const { sepolia } = await import('viem/chains');

      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http('https://ethereum-sepolia-rpc.publicnode.com'),
      });

      const currentBalanceWei = await publicClient.getBalance({
        address: smartWallet.address as `0x${string}`,
      });

      const currentBalance = Number(currentBalanceWei) / 10 ** 18; // ETH has 18 decimals
      const requiredAmount = 0.01; // We're depositing 0.01 ETH
      console.log('Smart wallet ETH balance:', currentBalance);
      console.log('Required amount:', requiredAmount);

      if (currentBalance < requiredAmount) {
        setUsdcTestResults({
          error: `Insufficient ETH balance in smart wallet. Have: ${currentBalance.toFixed(4)}, Need: ${requiredAmount}. Send ETH to smart wallet first.`,
        });
        return;
      }

      // Deposit 0.01 ETH (18 decimals)
      const depositAmount = BigInt(Math.floor(0.01 * 10 ** 18));

      const { encodeFunctionData } = await import('viem');

      // Deposit ETH directly via WETH Gateway (no approval needed for ETH)
      setUsdcTestResults({
        aaveDepositStatus: 'Depositing ETH to AAVE...',
        error: '',
      });

      const depositData = encodeFunctionData({
        abi: WETH_GATEWAY_ABI,
        functionName: 'depositETH',
        args: [AAVE_CONFIG.POOL, smartWallet.address as `0x${string}`, 0],
      });

      const depositTxHash = await client.sendTransaction({
        to: AAVE_CONFIG.WETH_GATEWAY,
        data: depositData,
        value: depositAmount,
      });

      console.log('ETH AAVE deposit transaction hash:', depositTxHash);

      setUsdcTestResults({
        ...usdcTestResults,
        aaveDepositStatus: 'ETH AAVE deposit successful!',
        aaveDepositHash: depositTxHash,
        error: '',
      });

      // Refresh balances after deposit
      setTimeout(() => checkUsdcBalances(), 3000);
    } catch (error) {
      console.error('Error depositing ETH to AAVE:', error);
      setUsdcTestResults({
        ...usdcTestResults,
        aaveDepositStatus: 'ETH AAVE deposit failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Function to deposit ETH to AAVE using EOA/MetaMask
  const depositEthToAaveEOA = async () => {
    if (!client?.chain || client.chain.id !== 11155111 || !smartWallet) {
      setUsdcTestResults({
        error: 'Must be on Sepolia network with smart wallet',
      });
      return;
    }

    setUsdcTestResults({
      aaveDepositStatus: 'Preparing EOA AAVE deposit...',
      error: '',
    });

    try {
      // Get MetaMask wallet address
      const metamaskWallet = user?.linkedAccounts?.find(
        account =>
          account.type === 'wallet' && account.walletClientType !== 'privy'
      ) as { address: string } | undefined;

      if (!metamaskWallet) {
        setUsdcTestResults({ error: 'MetaMask wallet not found' });
        return;
      }

      // Find the MetaMask wallet in the wallets list
      const metamaskWalletInList = wallets.find(
        w =>
          w.address.toLowerCase() === metamaskWallet.address.toLowerCase() &&
          w.walletClientType !== 'privy'
      );

      if (!metamaskWalletInList) {
        setUsdcTestResults({
          error: 'MetaMask wallet not found in wallet list',
        });
        return;
      }

      // Get the MetaMask wallet's provider
      const metamaskProvider = await metamaskWalletInList.getEthereumProvider();

      // Check if MetaMask is on Sepolia network
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

      console.log('Starting ETH deposit to AAVE via EOA/MetaMask...');
      console.log('MetaMask address:', metamaskWallet.address);
      console.log('WETH Gateway:', AAVE_CONFIG.WETH_GATEWAY);
      console.log('AAVE Pool contract:', AAVE_CONFIG.POOL);

      // Deposit 0.01 ETH (18 decimals)
      const depositAmount = BigInt(Math.floor(0.01 * 10 ** 18));
      console.log('Deposit amount (wei):', depositAmount.toString());

      // Check if user has enough ETH balance
      const { createPublicClient, http } = await import('viem');
      const { sepolia } = await import('viem/chains');

      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http('https://ethereum-sepolia-rpc.publicnode.com'),
      });

      const currentBalanceWei = await publicClient.getBalance({
        address: metamaskWallet.address as `0x${string}`,
      });

      const currentBalance = Number(currentBalanceWei) / 10 ** 18;
      const requiredAmount = 0.01; // We're depositing 0.01 ETH
      console.log('Current ETH balance:', currentBalance);
      console.log('Required amount:', requiredAmount);

      if (currentBalance < requiredAmount) {
        setUsdcTestResults({
          error: `Insufficient ETH balance. Have: ${currentBalance.toFixed(4)}, Need: ${requiredAmount}`,
        });
        return;
      }

      const { encodeFunctionData } = await import('viem');

      // Deposit ETH directly via WETH Gateway (no approval needed for ETH)
      setUsdcTestResults({
        aaveDepositStatus: 'EOA: Depositing ETH to AAVE...',
        error: '',
      });

      const depositData = encodeFunctionData({
        abi: WETH_GATEWAY_ABI,
        functionName: 'depositETH',
        args: [AAVE_CONFIG.POOL, metamaskWallet.address as `0x${string}`, 0],
      });

      console.log('Deposit calldata:', depositData);
      console.log('About to send ETH deposit transaction with params:', {
        from: metamaskWallet.address,
        to: AAVE_CONFIG.WETH_GATEWAY,
        data: depositData,
        value: `0x${depositAmount.toString(16)}`,
      });

      const depositTxHash = await metamaskProvider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: metamaskWallet.address,
            to: AAVE_CONFIG.WETH_GATEWAY,
            data: depositData,
            value: `0x${depositAmount.toString(16)}`,
          },
        ],
      });

      console.log('EOA ETH AAVE deposit transaction hash:', depositTxHash);

      setUsdcTestResults({
        ...usdcTestResults,
        aaveDepositStatus: 'EOA ETH AAVE deposit successful!',
        aaveDepositHash: depositTxHash,
        error: '',
      });

      // Refresh balances after deposit
      setTimeout(() => checkUsdcBalances(), 3000);
    } catch (error) {
      console.error('Error depositing to AAVE via EOA:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));

      // Try to extract more specific error information
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
        if (error.message.includes('execution reverted')) {
          errorMessage = `Transaction reverted: ${error.message}`;
        }
      }

      setUsdcTestResults({
        ...usdcTestResults,
        aaveDepositStatus: 'EOA AAVE deposit failed',
        error: errorMessage,
      });
    }
  };

  // Simple test function to verify USDC contract works
  const testUsdcContract = async () => {
    try {
      console.log('Testing USDC contract...');

      const metamaskWallet = user?.linkedAccounts?.find(
        account =>
          account.type === 'wallet' && account.walletClientType !== 'privy'
      ) as { address: string } | undefined;

      if (!metamaskWallet) {
        console.error('MetaMask wallet not found');
        return;
      }

      const { createPublicClient, http } = await import('viem');
      const { sepolia } = await import('viem/chains');

      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http('https://ethereum-sepolia-rpc.publicnode.com'),
      });

      // Test: Get USDC balance
      const balance = await publicClient.readContract({
        address: USDC_TOKEN_CONFIG.address,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [metamaskWallet.address as `0x${string}`],
      });

      console.log('USDC balance (raw):', (balance as bigint).toString());
      console.log(
        'USDC balance (formatted):',
        (Number(balance as bigint) / 10 ** 6).toFixed(6)
      );

      // Test: Get current allowance for AAVE Pool
      const allowance = await publicClient.readContract({
        address: USDC_TOKEN_CONFIG.address,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [metamaskWallet.address as `0x${string}`, AAVE_CONFIG.POOL],
      });

      console.log(
        'Current AAVE allowance (raw):',
        (allowance as bigint).toString()
      );
      console.log(
        'Current AAVE allowance (formatted):',
        (Number(allowance as bigint) / 10 ** 6).toFixed(6)
      );

      setUsdcTestResults({
        aaveDepositStatus: `USDC Contract Test: Balance=${(Number(balance as bigint) / 10 ** 6).toFixed(6)}, Allowance=${(Number(allowance as bigint) / 10 ** 6).toFixed(6)}`,
        error: '',
      });
    } catch (error) {
      console.error('USDC contract test failed:', error);
      setUsdcTestResults({
        aaveDepositStatus: 'USDC contract test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Comprehensive balance checking function
  const checkComprehensiveBalances = async () => {
    if (!client?.chain || client.chain.id !== 11155111 || !smartWallet) {
      setComprehensiveBalances({
        error: 'Must be on Sepolia network with smart wallet',
        loading: false,
      });
      return;
    }

    setComprehensiveBalances({ loading: true, error: '' });

    try {
      const { createPublicClient, http, formatEther } = await import('viem');
      const { sepolia } = await import('viem/chains');

      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http('https://ethereum-sepolia-rpc.publicnode.com', {
          timeout: 10_000,
          retryCount: 2,
        }),
      });

      // Get EOA wallet address
      const eoaWallet = user?.linkedAccounts?.find(
        account =>
          account.type === 'wallet' && account.walletClientType !== 'privy'
      ) as { address: string } | undefined;

      if (!eoaWallet) {
        throw new Error('EOA wallet not found');
      }

      console.log('Checking comprehensive balances for:');
      console.log('EOA:', eoaWallet.address);
      console.log('Smart Wallet:', smartWallet.address);

      // Check ETH balances
      const [eoaEthBalance, smartWalletEthBalance] = await Promise.all([
        publicClient.getBalance({
          address: eoaWallet.address as `0x${string}`,
        }),
        publicClient.getBalance({
          address: smartWallet.address as `0x${string}`,
        }),
      ]);

      // Check USDC balances
      const [eoaUsdcBalance, smartWalletUsdcBalance] = await Promise.all([
        publicClient.readContract({
          address: USDC_TOKEN_CONFIG.address,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [eoaWallet.address as `0x${string}`],
        }),
        publicClient.readContract({
          address: USDC_TOKEN_CONFIG.address,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [smartWallet.address as `0x${string}`],
        }),
      ]);

      // Check AAVE positions (aTokens)
      const [
        eoaAwethBalance,
        smartWalletAwethBalance,
        eoaAusdcBalance,
        smartWalletAusdcBalance,
      ] = await Promise.all([
        publicClient.readContract({
          address: AAVE_CONFIG.AWETH,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [eoaWallet.address as `0x${string}`],
        }),
        publicClient.readContract({
          address: AAVE_CONFIG.AWETH,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [smartWallet.address as `0x${string}`],
        }),
        publicClient.readContract({
          address: AAVE_CONFIG.AUSDC,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [eoaWallet.address as `0x${string}`],
        }),
        publicClient.readContract({
          address: AAVE_CONFIG.AUSDC,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [smartWallet.address as `0x${string}`],
        }),
      ]);

      // Format balances
      const formatTokenBalance = (balance: bigint, decimals: number) => {
        const divisor = BigInt(10 ** decimals);
        const formatted = Number(balance) / Number(divisor);
        return formatted.toFixed(6);
      };

      setComprehensiveBalances({
        ethBalances: {
          eoaEth: formatEther(eoaEthBalance),
          smartWalletEth: formatEther(smartWalletEthBalance),
        },
        usdcBalances: {
          eoaUsdc: formatTokenBalance(
            eoaUsdcBalance as bigint,
            USDC_TOKEN_CONFIG.decimals
          ),
          smartWalletUsdc: formatTokenBalance(
            smartWalletUsdcBalance as bigint,
            USDC_TOKEN_CONFIG.decimals
          ),
        },
        aavePositions: {
          eoaAweth: formatEther(eoaAwethBalance as bigint),
          smartWalletAweth: formatEther(smartWalletAwethBalance as bigint),
          eoaAusdc: formatTokenBalance(
            eoaAusdcBalance as bigint,
            USDC_TOKEN_CONFIG.decimals
          ),
          smartWalletAusdc: formatTokenBalance(
            smartWalletAusdcBalance as bigint,
            USDC_TOKEN_CONFIG.decimals
          ),
        },
        loading: false,
        error: '',
      });

      console.log('✅ Comprehensive balance check completed');
    } catch (error) {
      console.error('Comprehensive balance check failed:', error);
      setComprehensiveBalances({
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Function to check Permit2 allowance
  const checkPermit2Allowance = async (
    tokenAddress: string,
    ownerAddress: string
  ) => {
    try {
      const { createPublicClient, http } = await import('viem');
      const { sepolia } = await import('viem/chains');

      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http('https://ethereum-sepolia-rpc.publicnode.com'),
      });

      const allowanceData = (await publicClient.readContract({
        address: PERMIT2_CONFIG.ADDRESS,
        abi: PERMIT2_CONFIG.ABI,
        functionName: 'allowance',
        args: [
          ownerAddress as `0x${string}`,
          tokenAddress as `0x${string}`,
          UNISWAP_V3_ROUTER_ADDRESS,
        ],
      })) as readonly [bigint, number, number];

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
      console.error('Error checking Permit2 allowance:', error);
      return {
        amount: 0,
        expiration: 0,
        nonce: 0,
        isExpired: true,
        isValid: false,
      };
    }
  };

  // Function to approve ERC20 token to Permit2 contract
  const approveTokenToPermit2 = async (tokenAddress: string) => {
    if (!metamaskWallet) return;

    try {
      console.log('🔄 === STEP 1: APPROVING TOKEN TO PERMIT2 CONTRACT ===');

      // Switch to Sepolia
      await metamaskWallet.switchChain(NETWORKS.SEPOLIA.id);

      // Get Ethereum provider
      const provider = await metamaskWallet.getEthereumProvider();

      const maxApproval = 2n ** 256n - 1n; // Max uint256 for traditional ERC20 approval

      console.log(`💰 Approving Permit2 contract to spend ${tokenAddress}`);
      console.log(`  Permit2 Address: ${PERMIT2_CONFIG.ADDRESS}`);
      console.log(`  Approval Amount: ${maxApproval.toString()} (max uint256)`);

      const tokenApprovalTx = await provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: metamaskWallet.address,
            to: tokenAddress,
            data: encodeFunctionData({
              abi: ERC20_ABI,
              functionName: 'approve',
              args: [PERMIT2_CONFIG.ADDRESS, maxApproval],
            }),
          },
        ],
      });

      console.log(`✅ Token approval to Permit2 sent: ${tokenApprovalTx}`);
      return tokenApprovalTx;
    } catch (error) {
      console.error('❌ Token approval to Permit2 failed:', error);
      throw error;
    }
  };

  // Function to approve Universal Router through Permit2
  const approveRouterThroughPermit2 = async (tokenAddress: string) => {
    if (!metamaskWallet) return;

    try {
      console.log(
        '🔄 === STEP 2: APPROVING UNIVERSAL ROUTER THROUGH PERMIT2 ==='
      );

      // Switch to Sepolia
      await metamaskWallet.switchChain(NETWORKS.SEPOLIA.id);

      // Get Ethereum provider
      const provider = await metamaskWallet.getEthereumProvider();

      const approveAmount = 2n ** 160n - 1n; // Max uint160 for Permit2
      const expiration = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 year from now

      console.log(
        `💰 Approving Universal Router through Permit2 for ${tokenAddress}`
      );
      console.log(`  Token: ${tokenAddress}`);
      console.log(`  Spender: ${UNISWAP_V3_ROUTER_ADDRESS}`);
      console.log(`  Amount: ${approveAmount.toString()} (max uint160)`);
      console.log(
        `  Expiration: ${expiration} (${new Date(expiration * 1000).toISOString()})`
      );

      const permit2ApprovalTx = await provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: metamaskWallet.address,
            to: PERMIT2_CONFIG.ADDRESS,
            data: encodeFunctionData({
              abi: PERMIT2_CONFIG.ABI,
              functionName: 'approve',
              args: [
                tokenAddress as `0x${string}`,
                UNISWAP_V3_ROUTER_ADDRESS as `0x${string}`,
                approveAmount,
                expiration,
              ],
            }),
          },
        ],
      });

      console.log(`✅ Permit2 approval transaction sent: ${permit2ApprovalTx}`);
      return permit2ApprovalTx;
    } catch (error) {
      console.error('❌ Permit2 approval failed:', error);
      throw error;
    }
  };

  // Combined function to handle both steps
  const approvePermit2 = async (tokenAddress: string) => {
    if (!metamaskWallet) return;

    try {
      console.log('🔄 === STARTING PERMIT2 APPROVAL (2-STEP PROCESS) ===');

      // Switch to Sepolia
      await metamaskWallet.switchChain(NETWORKS.SEPOLIA.id);

      // Get Ethereum provider
      const provider = await metamaskWallet.getEthereumProvider();

      // STEP 1: Check if Permit2 contract has allowance to spend the token
      console.log('📍 Step 1: Checking token allowance to Permit2 contract...');

      const { createPublicClient, http } = await import('viem');
      const { sepolia } = await import('viem/chains');

      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http('https://ethereum-sepolia-rpc.publicnode.com'),
      });

      const currentAllowance = (await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [metamaskWallet.address as `0x${string}`, PERMIT2_CONFIG.ADDRESS],
      })) as bigint;

      console.log(
        `Current token allowance to Permit2: ${currentAllowance.toString()}`
      );

      // If allowance is insufficient, approve Permit2 contract first
      if (currentAllowance < 1000000n) {
        console.log('💰 Step 1: Approving token to Permit2 contract...');
        const tokenTx = await approveTokenToPermit2(tokenAddress);
        console.log('⏳ Waiting for token approval confirmation...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        console.log('✅ Permit2 already has sufficient token allowance');
      }

      // STEP 2: Approve Universal Router through Permit2
      console.log('💰 Step 2: Approving Universal Router through Permit2...');
      const permit2Tx = await approveRouterThroughPermit2(tokenAddress);

      return permit2Tx;
    } catch (error) {
      console.error('❌ Permit2 approval failed:', error);
      throw error;
    }
  };

  // Check token balances and allowances
  const checkBalancesAndAllowances = useCallback(async () => {
    if (!metamaskWallet || !PYUSD_TOKEN || !USDC_TOKEN) {
      console.log('❌ Missing requirements for balance check');
      return;
    }

    try {
      console.log('🔍 === STARTING BALANCE & ALLOWANCE CHECK ===');
      console.log('📍 MetaMask address:', metamaskWallet.address);
      console.log('📍 PYUSD token:', PYUSD_TOKEN.address);
      console.log('📍 USDC token:', USDC_TOKEN.address);
      console.log('📍 Universal Router address:', UNISWAP_V3_ROUTER_ADDRESS);
      console.log('📍 Position Manager:', UNISWAP_V3_POSITION_MANAGER_ADDRESS);

      // Create viem public client
      const { createPublicClient, http } = await import('viem');
      const { sepolia } = await import('viem/chains');

      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http('https://ethereum-sepolia-rpc.publicnode.com'),
      });

      // Check PYUSD balance
      console.log('💰 Checking PYUSD balance...');
      const pyusdBalance = (await publicClient.readContract({
        address: PYUSD_TOKEN.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [metamaskWallet.address as `0x${string}`],
      })) as bigint;

      const pyusdBalanceFormatted =
        Number(pyusdBalance) / Math.pow(10, PYUSD_TOKEN.decimals);
      console.log(`✅ PYUSD Balance: ${pyusdBalanceFormatted} PYUSD`);

      // Check USDC balance
      console.log('💰 Checking USDC balance...');
      const usdcBalance = (await publicClient.readContract({
        address: USDC_TOKEN.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [metamaskWallet.address as `0x${string}`],
      })) as bigint;

      const usdcBalanceFormatted =
        Number(usdcBalance) / Math.pow(10, USDC_TOKEN.decimals);
      console.log(`✅ USDC Balance: ${usdcBalanceFormatted} USDC`);

      // Check Universal Router allowance for PYUSD
      console.log('🔐 Checking Universal Router allowance for PYUSD...');
      const routerAllowance = (await publicClient.readContract({
        address: PYUSD_TOKEN.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [
          metamaskWallet.address as `0x${string}`,
          UNISWAP_V3_ROUTER_ADDRESS,
        ],
      })) as bigint;

      const routerAllowanceFormatted =
        Number(routerAllowance) / Math.pow(10, PYUSD_TOKEN.decimals);
      console.log(`✅ Router Allowance: ${routerAllowanceFormatted} PYUSD`);

      // Check position manager allowances for BOTH tokens
      console.log('🔐 Checking position manager allowances...');
      const pyusdPMAllowance = (await publicClient.readContract({
        address: PYUSD_TOKEN.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [
          metamaskWallet.address as `0x${string}`,
          UNISWAP_V3_POSITION_MANAGER_ADDRESS,
        ],
      })) as bigint;

      const usdcPMAllowance = (await publicClient.readContract({
        address: USDC_TOKEN.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [
          metamaskWallet.address as `0x${string}`,
          UNISWAP_V3_POSITION_MANAGER_ADDRESS,
        ],
      })) as bigint;

      const pyusdPMAllowanceFormatted =
        Number(pyusdPMAllowance) / Math.pow(10, PYUSD_TOKEN.decimals);
      const usdcPMAllowanceFormatted =
        Number(usdcPMAllowance) / Math.pow(10, USDC_TOKEN.decimals);
      console.log(
        `✅ Position Manager PYUSD Allowance: ${pyusdPMAllowanceFormatted} PYUSD`
      );
      console.log(
        `✅ Position Manager USDC Allowance: ${usdcPMAllowanceFormatted} USDC`
      );

      // Check Uniswap V3 NFT positions
      console.log('🎯 Checking Uniswap V3 positions...');
      let nftCount = 0;
      let totalValueUSD = 0;

      try {
        // Get NFT balance (number of positions)
        const nftBalance = (await publicClient.readContract({
          address: UNISWAP_V3_POSITION_MANAGER_ADDRESS as `0x${string}`,
          abi: UNISWAP_V3_POSITION_MANAGER_ABI,
          functionName: 'balanceOf',
          args: [metamaskWallet.address as `0x${string}`],
        })) as bigint;

        nftCount = Number(nftBalance);
        console.log(`💎 NFT Positions owned: ${nftCount}`);

        if (nftCount > 0) {
          // For each NFT, get position details and calculate value
          for (let i = 0; i < nftCount; i++) {
            try {
              // Get token ID by index
              const tokenId = (await publicClient.readContract({
                address: UNISWAP_V3_POSITION_MANAGER_ADDRESS as `0x${string}`,
                abi: UNISWAP_V3_POSITION_MANAGER_ABI,
                functionName: 'tokenOfOwnerByIndex',
                args: [metamaskWallet.address as `0x${string}`, BigInt(i)],
              })) as bigint;

              console.log(`📍 Position ${i + 1} - Token ID: ${tokenId}`);

              // Get position details
              const position = (await publicClient.readContract({
                address: UNISWAP_V3_POSITION_MANAGER_ADDRESS as `0x${string}`,
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

              // Position data structure: [nonce, operator, token0, token1, fee, tickLower, tickUpper, liquidity, feeGrowthInside0LastX128, feeGrowthInside1LastX128, tokensOwed0, tokensOwed1]
              const token0Address = position[2];
              const token1Address = position[3];
              const fee = position[4];
              const tickLower = position[5];
              const tickUpper = position[6];
              const liquidity = position[7];
              const tokensOwed0 = position[10];
              const tokensOwed1 = position[11];

              console.log(`🔍 Position ${i + 1} Details:`);
              console.log(`   Token0: ${token0Address}`);
              console.log(`   Token1: ${token1Address}`);
              console.log(`   Fee: ${fee}`);
              console.log(
                `   TickLower: ${tickLower}, TickUpper: ${tickUpper}`
              );
              console.log(`   Liquidity: ${liquidity.toString()}`);
              console.log(`   TokensOwed0 (fees): ${tokensOwed0.toString()}`);
              console.log(`   TokensOwed1 (fees): ${tokensOwed1.toString()}`);

              // Check if this is our PYUSD/USDC pool
              const isOurPool =
                ((token0Address.toLowerCase() ===
                  USDC_TOKEN.address.toLowerCase() &&
                  token1Address.toLowerCase() ===
                    PYUSD_TOKEN.address.toLowerCase()) ||
                  (token0Address.toLowerCase() ===
                    PYUSD_TOKEN.address.toLowerCase() &&
                    token1Address.toLowerCase() ===
                      USDC_TOKEN.address.toLowerCase())) &&
                fee === PYUSD_USDC_POOL.fee;

              console.log(`   Is our PYUSD/USDC pool: ${isOurPool}`);

              if (isOurPool && Number(liquidity) > 0) {
                try {
                  // Get current pool state to calculate position value
                  const poolSlot0 = (await publicClient.readContract({
                    address: PYUSD_USDC_POOL.address as `0x${string}`,
                    abi: [
                      {
                        inputs: [],
                        name: 'slot0',
                        outputs: [
                          { name: 'sqrtPriceX96', type: 'uint160' },
                          { name: 'tick', type: 'int24' },
                          { name: 'observationIndex', type: 'uint16' },
                          { name: 'observationCardinality', type: 'uint16' },
                          {
                            name: 'observationCardinalityNext',
                            type: 'uint16',
                          },
                          { name: 'feeProtocol', type: 'uint8' },
                          { name: 'unlocked', type: 'bool' },
                        ],
                        stateMutability: 'view',
                        type: 'function',
                      },
                    ],
                    functionName: 'slot0',
                  })) as readonly [
                    bigint,
                    number,
                    number,
                    number,
                    number,
                    number,
                    boolean,
                  ];

                  const currentTick = poolSlot0[1];
                  const sqrtPriceX96 = poolSlot0[0];

                  console.log(`   Current pool tick: ${currentTick}`);
                  console.log(
                    `   Current sqrtPriceX96: ${sqrtPriceX96.toString()}`
                  );

                  // Calculate position value using proper Uniswap V3 math approximation
                  // For stablecoin pairs, use a more realistic conversion factor
                  const liquidityNum = Number(liquidity);
                  console.log(`   Raw liquidity: ${liquidityNum}`);

                  // Simplified calculation for PYUSD/USDC stablecoin pair
                  // Since both tokens are worth ~$1, we can use a much simpler approach

                  // For Uniswap V3 stablecoin positions, use empirical conversion based on observed data
                  // This is calibrated for PYUSD/USDC pairs on Sepolia
                  const liquidityValue = Number(liquidity);

                  // Convert liquidity units to approximate USD value
                  // TODO: This needs calibration based on actual user deposits
                  // For now, using a conservative estimate - will adjust based on real data
                  const conversionFactor = 200000000; // Adjust this based on actual liquidity values
                  const approxTotalValue = liquidityValue / conversionFactor;

                  console.log(
                    `   Liquidity: ${liquidityValue.toLocaleString()} units`
                  );
                  console.log(
                    `   Estimated value: $${approxTotalValue.toFixed(6)} USD`
                  );

                  if (currentTick >= tickLower && currentTick <= tickUpper) {
                    console.log(
                      `   Position is IN RANGE (current tick ${currentTick} between ${tickLower} and ${tickUpper})`
                    );
                    console.log(
                      `   💰 Position has both PYUSD and USDC tokens`
                    );
                  } else {
                    console.log(
                      `   Position is OUT OF RANGE (current tick ${currentTick} not between ${tickLower} and ${tickUpper})`
                    );
                    console.log(`   💰 Position is entirely in one token`);
                  }

                  totalValueUSD += approxTotalValue;
                  console.log(
                    `💰 Position ${i + 1} value: ~$${approxTotalValue.toFixed(2)} USD`
                  );

                  // Also check unclaimed fees
                  const feeAmount0 = Number(tokensOwed0) / Math.pow(10, 6);
                  const feeAmount1 = Number(tokensOwed1) / Math.pow(10, 6);
                  const totalFees = feeAmount0 + feeAmount1;

                  if (totalFees > 0) {
                    console.log(
                      `💸 Position ${i + 1} unclaimed fees: $${totalFees.toFixed(4)} USD`
                    );
                    totalValueUSD += totalFees; // Add fees to total value
                  }
                } catch (poolStateError) {
                  console.warn(
                    `⚠️ Could not read pool state for position ${i + 1}:`,
                    poolStateError
                  );

                  // Fallback: use same simple conversion
                  const liquidityNum = Number(liquidity);
                  if (liquidityNum > 0) {
                    // Use same conversion factor
                    const roughValue = liquidityNum / 200000000;
                    totalValueUSD += roughValue;
                    console.log(
                      `💰 Position ${i + 1} (fallback) value: ~$${roughValue.toFixed(2)} USD`
                    );
                  }
                }
              } else if (!isOurPool) {
                console.log(
                  `   Skipping position ${i + 1} - not our PYUSD/USDC pool`
                );
              } else {
                console.log(`   Skipping position ${i + 1} - no liquidity`);
              }
            } catch (positionError) {
              console.warn(
                `⚠️ Could not read position ${i + 1}:`,
                positionError
              );
            }
          }
        }

        console.log(`💎 Total NFT positions: ${nftCount}`);
        console.log(`💰 Total pool value: ~$${totalValueUSD.toFixed(2)} USD`);
      } catch (nftError) {
        console.warn('⚠️ Could not read NFT positions:', nftError);
      }

      // Update state
      setPoolData(prev => ({
        ...prev,
        metaMaskPYUSDBalance: pyusdBalanceFormatted,
        metaMaskUSDCBalance: usdcBalanceFormatted,
        routerAllowance: routerAllowanceFormatted,
        positionManagerAllowance: pyusdPMAllowanceFormatted,
        positionManagerUSDCAllowance: usdcPMAllowanceFormatted,
        nftPositionCount: nftCount,
        totalPoolValueUSD: totalValueUSD,
        error: undefined,
      }));

      // Check Permit2 allowances
      console.log('🔍 Checking Permit2 allowances...');
      try {
        const [pyusdPermit2, usdcPermit2] = await Promise.all([
          checkPermit2Allowance(PYUSD_TOKEN.address, metamaskWallet.address),
          checkPermit2Allowance(USDC_TOKEN.address, metamaskWallet.address),
        ]);

        setPermit2Data({
          pyusdPermit2,
          usdcPermit2,
        });

        console.log('✅ Permit2 allowances checked');
      } catch (permit2Error) {
        console.warn('⚠️ Could not check Permit2 allowances:', permit2Error);
      }

      console.log('✅ === BALANCE & ALLOWANCE CHECK COMPLETED ===\n');
    } catch (error) {
      console.error('❌ Error checking balances:', error);
      setPoolData(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [metamaskWallet, PYUSD_TOKEN, USDC_TOKEN]);

  // Load data on component mount and when wallet changes
  useEffect(() => {
    if (ready && authenticated && metamaskWallet) {
      checkBalancesAndAllowances();
    }
  }, [ready, authenticated, metamaskWallet, checkBalancesAndAllowances]);

  // Approve router to spend PYUSD
  const approveRouter = async () => {
    if (!metamaskWallet || !PYUSD_TOKEN) {
      console.log('❌ Missing requirements for router approval');
      return;
    }

    try {
      console.log('🔄 === STARTING ROUTER APPROVAL ===');

      // Switch to Sepolia
      await metamaskWallet.switchChain(NETWORKS.SEPOLIA.id);

      // Large approval amount (1 million PYUSD)
      const approvalAmount = BigInt(
        1_000_000 * Math.pow(10, PYUSD_TOKEN.decimals)
      );
      console.log(
        `💰 Approving ${Number(approvalAmount) / Math.pow(10, PYUSD_TOKEN.decimals)} PYUSD to router`
      );

      // Get Ethereum provider
      const provider = await metamaskWallet.getEthereumProvider();

      // Create approval transaction
      const approveTx = await provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: metamaskWallet.address,
            to: PYUSD_TOKEN.address,
            data: encodeFunctionData({
              abi: ERC20_ABI,
              functionName: 'approve',
              args: [UNISWAP_V3_ROUTER_ADDRESS, approvalAmount],
            }),
          },
        ],
      });

      console.log(`✅ Router approval transaction sent: ${approveTx}`);

      // Wait a bit then refresh balances
      setTimeout(() => {
        checkBalancesAndAllowances();
      }, 3000);
    } catch (error) {
      console.error('❌ Router approval failed:', error);
      setPoolData(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Approval failed',
      }));
    }
  };

  // Approve position manager to spend tokens
  const approvePositionManager = async () => {
    if (!metamaskWallet || !PYUSD_TOKEN || !USDC_TOKEN) {
      console.log('❌ Missing requirements for position manager approval');
      return;
    }

    try {
      console.log('🔄 === STARTING POSITION MANAGER APPROVAL ===');

      // Switch to Sepolia
      await metamaskWallet.switchChain(NETWORKS.SEPOLIA.id);

      // Get Ethereum provider
      const provider = await metamaskWallet.getEthereumProvider();

      // Large approval amount
      const approvalAmount = BigInt(
        1_000_000 * Math.pow(10, PYUSD_TOKEN.decimals)
      );

      console.log('💰 Approving PYUSD to position manager...');
      const pyusdApproval = await provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: metamaskWallet.address,
            to: PYUSD_TOKEN.address,
            data: encodeFunctionData({
              abi: ERC20_ABI,
              functionName: 'approve',
              args: [UNISWAP_V3_POSITION_MANAGER_ADDRESS, approvalAmount],
            }),
          },
        ],
      });
      console.log(`✅ PYUSD approval: ${pyusdApproval}`);

      console.log('💰 Approving USDC to position manager...');
      const usdcApprovalAmount = BigInt(
        1_000_000 * Math.pow(10, USDC_TOKEN.decimals)
      );
      const usdcApproval = await provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: metamaskWallet.address,
            to: USDC_TOKEN.address,
            data: encodeFunctionData({
              abi: ERC20_ABI,
              functionName: 'approve',
              args: [UNISWAP_V3_POSITION_MANAGER_ADDRESS, usdcApprovalAmount],
            }),
          },
        ],
      });
      console.log(`✅ USDC approval: ${usdcApproval}`);

      // Wait then refresh balances
      setTimeout(() => {
        checkBalancesAndAllowances();
      }, 5000);
    } catch (error) {
      console.error('❌ Position manager approval failed:', error);
      setPoolData(prev => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : 'Position manager approval failed',
      }));
    }
  };

  // Perform swap: PYUSD → USDC
  const performSwap = async () => {
    if (!metamaskWallet || !PYUSD_TOKEN || !USDC_TOKEN || !PYUSD_USDC_POOL) {
      console.log('❌ Missing requirements for swap');
      return;
    }

    try {
      console.log('🔄 === STARTING PYUSD → USDC SWAP ===');
      setPoolData(prev => ({ ...prev, swapStatus: 'Swapping...' }));

      // Check Permit2 allowance first
      console.log('🔍 Checking Permit2 allowance before swap...');
      const permit2Check = await checkPermit2Allowance(
        PYUSD_TOKEN.address,
        metamaskWallet.address
      );

      if (!permit2Check.isValid) {
        console.log(
          '⚠️ Permit2 allowance invalid or expired, requesting approval...'
        );
        setPoolData(prev => ({
          ...prev,
          swapStatus: 'Permit2 approval needed...',
        }));

        try {
          const approveTx = await approvePermit2(PYUSD_TOKEN.address);
          console.log('✅ Permit2 approved, waiting for confirmation...');
          setPoolData(prev => ({
            ...prev,
            swapStatus: 'Waiting for Permit2 confirmation...',
          }));

          // Wait a bit for the transaction to be mined
          await new Promise(resolve => setTimeout(resolve, 5000));

          // Recheck the allowance
          const recheckPermit2 = await checkPermit2Allowance(
            PYUSD_TOKEN.address,
            metamaskWallet.address
          );
          if (!recheckPermit2.isValid) {
            throw new Error(
              'Permit2 approval was not successful. Please try again.'
            );
          }

          console.log('✅ Permit2 approval confirmed, proceeding with swap...');
          setPoolData(prev => ({
            ...prev,
            swapStatus: 'Permit2 approved, swapping...',
          }));
        } catch (permit2Error) {
          console.error('❌ Permit2 approval failed:', permit2Error);
          setPoolData(prev => ({
            ...prev,
            swapStatus: 'Permit2 approval failed',
            error:
              permit2Error instanceof Error
                ? permit2Error.message
                : 'Permit2 approval failed',
          }));
          return;
        }
      } else {
        console.log('✅ Permit2 allowance is valid, proceeding with swap...');
      }

      // Switch to Sepolia
      await metamaskWallet.switchChain(NETWORKS.SEPOLIA.id);

      // Get Ethereum provider
      const provider = await metamaskWallet.getEthereumProvider();

      // Calculate swap amount in wei
      const swapAmountWei = BigInt(
        Number(swapAmount) * Math.pow(10, PYUSD_TOKEN.decimals)
      );
      console.log(
        `💱 Swapping ${swapAmount} PYUSD (${swapAmountWei} wei) for USDC`
      );

      // Create deadline (20 minutes from now)
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);
      console.log(`⏰ Deadline: ${deadline}`);

      // Calculate minimum output amount with 5% slippage tolerance
      // Based on rough price ratio from successful txs: ~70 PYUSD per USDC
      const estimatedOutputWei = swapAmountWei / 70n; // Rough estimate
      const slippageToleranceBps = 500n; // 5% = 500 basis points
      const amountOutMinimum =
        (estimatedOutputWei * (10000n - slippageToleranceBps)) / 10000n;

      console.log(`📊 Estimated output: ${estimatedOutputWei} wei USDC`);
      console.log(
        `📊 Minimum output (5% slippage): ${amountOutMinimum} wei USDC`
      );

      // Construct swap parameters
      const swapParams = {
        tokenIn: PYUSD_TOKEN.address as `0x${string}`,
        tokenOut: USDC_TOKEN.address as `0x${string}`,
        fee: PYUSD_USDC_POOL.fee,
        recipient: metamaskWallet.address as `0x${string}`,
        deadline,
        amountIn: swapAmountWei,
        amountOutMinimum, // Proper slippage protection
        sqrtPriceLimitX96: 0n, // No price limit for now
      };

      console.log('📋 Swap parameters:', {
        ...swapParams,
        deadline: swapParams.deadline.toString(),
        amountIn: swapParams.amountIn.toString(),
        amountOutMinimum: swapParams.amountOutMinimum.toString(),
      });

      // Validate parameters before encoding
      console.log('🔍 Validating swap parameters...');
      console.log(`  - Token In: ${swapParams.tokenIn}`);
      console.log(`  - Token Out: ${swapParams.tokenOut}`);
      console.log(`  - Fee: ${swapParams.fee}`);
      console.log(`  - Recipient: ${swapParams.recipient}`);
      console.log(
        `  - Amount In: ${swapParams.amountIn.toString()} wei (${Number(swapParams.amountIn) / Math.pow(10, PYUSD_TOKEN.decimals)} tokens)`
      );
      console.log(
        `  - Min Amount Out: ${swapParams.amountOutMinimum.toString()} wei (${Number(swapParams.amountOutMinimum) / Math.pow(10, USDC_TOKEN.decimals)} tokens)`
      );

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
          metamaskWallet.address as `0x${string}`,
          swapAmountWei,
          amountOutMinimum,
          // Encode path: token0 + fee + token1 (packed format)
          `0x${PYUSD_TOKEN.address.slice(2)}${PYUSD_USDC_POOL.fee.toString(16).padStart(6, '0')}${USDC_TOKEN.address.slice(2)}` as `0x${string}`,
          true, // User pays input token
        ]
      );

      console.log('📞 Universal Router command:', commands);
      console.log('📞 Swap input data:', swapInput);

      // Encode the Universal Router execute call
      const executeCalldata = encodeFunctionData({
        abi: UNISWAP_V3_ROUTER_ABI,
        functionName: 'execute',
        args: [commands as `0x${string}`, [swapInput], deadline],
      });

      console.log('📞 Execute calldata:', executeCalldata);
      console.log('📞 Universal Router address:', UNISWAP_V3_ROUTER_ADDRESS);

      // Execute swap transaction
      console.log('🚀 Executing Universal Router swap transaction...');
      const swapGasLimit = '0x7A120'; // 500k gas limit (sufficient for swaps)
      console.log(
        '📊 Swap gas limit:',
        parseInt(swapGasLimit, 16).toLocaleString(),
        'gas'
      );

      const swapTx = await provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: metamaskWallet.address,
            to: UNISWAP_V3_ROUTER_ADDRESS,
            data: executeCalldata,
            gas: swapGasLimit,
          },
        ],
      });

      console.log(`✅ Swap transaction sent: ${swapTx}`);
      setPoolData(prev => ({
        ...prev,
        swapStatus: `Swap completed! Tx: ${swapTx}`,
      }));

      // Refresh balances after swap
      setTimeout(() => {
        checkBalancesAndAllowances();
      }, 5000);
    } catch (error) {
      console.error('❌ Swap failed:', error);
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
      });

      // Try to extract more meaningful error info
      let errorMessage = 'Swap failed';
      if (error instanceof Error) {
        if (
          error.message.includes('AllowanceExpired') ||
          error.message.includes('allowance.expiration')
        ) {
          errorMessage =
            '🔒 Permit2 allowance has expired. The token approval to Permit2 needs to be renewed. Please approve Permit2 again.';
        } else if (error.message.includes('execution reverted')) {
          errorMessage =
            'Transaction reverted - check slippage/liquidity or token approvals';
        } else if (error.message.includes('insufficient')) {
          errorMessage = 'Insufficient balance or allowance';
        } else if (error.message.includes('user denied')) {
          errorMessage = 'Transaction rejected by user';
        } else {
          errorMessage = error.message;
        }
      }

      setPoolData(prev => ({
        ...prev,
        swapStatus: 'Swap failed',
        error: errorMessage,
      }));
    }
  };

  // Add liquidity to Uniswap V3 pool
  const addLiquidity = async () => {
    if (!metamaskWallet || !PYUSD_TOKEN || !USDC_TOKEN || !PYUSD_USDC_POOL) {
      console.log('❌ Missing requirements for liquidity');
      return;
    }

    try {
      console.log('🔄 === STARTING LIQUIDITY ADDITION ===');
      setPoolData(prev => ({
        ...prev,
        liquidityStatus: 'Adding liquidity...',
      }));

      // Switch to Sepolia
      await metamaskWallet.switchChain(NETWORKS.SEPOLIA.id);

      // Get Ethereum provider
      const provider = await metamaskWallet.getEthereumProvider();

      console.log('🔍 === LIQUIDITY VALIDATION & SETUP ===');
      console.log('📍 Wallet Address:', metamaskWallet.address);
      console.log(
        '📍 PYUSD Token:',
        PYUSD_TOKEN.address,
        `(${PYUSD_TOKEN.decimals} decimals)`
      );
      console.log(
        '📍 USDC Token:',
        USDC_TOKEN.address,
        `(${USDC_TOKEN.decimals} decimals)`
      );
      console.log('📍 Pool Address:', PYUSD_USDC_POOL.address);
      console.log('📍 Position Manager:', UNISWAP_V3_POSITION_MANAGER_ADDRESS);

      // Validate pool configuration by reading from the pool contract
      console.log('🔍 === POOL VALIDATION ===');
      try {
        const { createPublicClient, http } = await import('viem');
        const { sepolia } = await import('viem/chains');

        const publicClient = createPublicClient({
          chain: sepolia,
          transport: http('https://ethereum-sepolia-rpc.publicnode.com'),
        });

        // Read pool configuration
        const poolToken0 = (await publicClient.readContract({
          address: PYUSD_USDC_POOL.address as `0x${string}`,
          abi: [
            {
              inputs: [],
              name: 'token0',
              outputs: [{ name: '', type: 'address' }],
              stateMutability: 'view',
              type: 'function',
            },
          ],
          functionName: 'token0',
        })) as string;

        const poolToken1 = (await publicClient.readContract({
          address: PYUSD_USDC_POOL.address as `0x${string}`,
          abi: [
            {
              inputs: [],
              name: 'token1',
              outputs: [{ name: '', type: 'address' }],
              stateMutability: 'view',
              type: 'function',
            },
          ],
          functionName: 'token1',
        })) as string;

        const poolFee = (await publicClient.readContract({
          address: PYUSD_USDC_POOL.address as `0x${string}`,
          abi: [
            {
              inputs: [],
              name: 'fee',
              outputs: [{ name: '', type: 'uint24' }],
              stateMutability: 'view',
              type: 'function',
            },
          ],
          functionName: 'fee',
        })) as number;

        console.log('✅ Pool Validation Results:');
        console.log('📍 Pool Token0:', poolToken0);
        console.log('📍 Pool Token1:', poolToken1);
        console.log('📍 Pool Fee:', poolFee);
        console.log(
          '✅ Token0 matches USDC:',
          poolToken0.toLowerCase() === USDC_TOKEN.address.toLowerCase()
        );
        console.log(
          '✅ Token1 matches PYUSD:',
          poolToken1.toLowerCase() === PYUSD_TOKEN.address.toLowerCase()
        );
        console.log('✅ Fee matches config:', poolFee === PYUSD_USDC_POOL.fee);

        if (poolFee !== PYUSD_USDC_POOL.fee) {
          throw new Error(
            `Pool fee mismatch: expected ${PYUSD_USDC_POOL.fee}, got ${poolFee}`
          );
        }
      } catch (poolValidationError) {
        console.error('❌ Pool validation failed:', poolValidationError);
        // Continue anyway, but log the issue
      }

      // Calculate amounts in wei
      const pyusdAmountWei = BigInt(
        Number(liquidityAmount) * Math.pow(10, PYUSD_TOKEN.decimals)
      );
      const usdcAmountWei = BigInt(
        Number(liquidityAmount) * Math.pow(10, USDC_TOKEN.decimals)
      );

      console.log(
        `💰 Desired amounts: ${liquidityAmount} PYUSD (${pyusdAmountWei} wei) and ${liquidityAmount} USDC (${usdcAmountWei} wei)`
      );

      // Determine correct token order (token0 < token1 by address)
      const isUSDCToken0 =
        USDC_TOKEN.address.toLowerCase() < PYUSD_TOKEN.address.toLowerCase();
      const token0Address = isUSDCToken0
        ? USDC_TOKEN.address
        : PYUSD_TOKEN.address;
      const token1Address = isUSDCToken0
        ? PYUSD_TOKEN.address
        : USDC_TOKEN.address;
      const token0Symbol = isUSDCToken0 ? 'USDC' : 'PYUSD';
      const token1Symbol = isUSDCToken0 ? 'PYUSD' : 'USDC';

      // Assign amounts according to token order
      const amount0Desired = isUSDCToken0 ? usdcAmountWei : pyusdAmountWei;
      const amount1Desired = isUSDCToken0 ? pyusdAmountWei : usdcAmountWei;

      console.log('🔄 === TOKEN ORDERING ===');
      console.log(`📍 Token0 (${token0Symbol}):`, token0Address);
      console.log(`📍 Token1 (${token1Symbol}):`, token1Address);
      console.log(
        `💰 Amount0Desired (${token0Symbol}):`,
        amount0Desired.toString(),
        'wei'
      );
      console.log(
        `💰 Amount1Desired (${token1Symbol}):`,
        amount1Desired.toString(),
        'wei'
      );

      // Get correct tick spacing based on fee tier
      const getTickSpacing = (feeTier: number): number => {
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

      const tickSpacing = getTickSpacing(PYUSD_USDC_POOL.fee);
      const maxTick = 887270; // Maximum tick for Uniswap V3

      // Calculate largest valid ticks (must be divisible by tick spacing)
      const tickLower = -Math.floor(maxTick / tickSpacing) * tickSpacing;
      const tickUpper = Math.floor(maxTick / tickSpacing) * tickSpacing;

      console.log('🎯 === TICK RANGE CALCULATION ===');
      console.log('📍 Fee Tier:', PYUSD_USDC_POOL.fee, '(0.3%)');
      console.log('📍 Required Tick Spacing:', tickSpacing);
      console.log(
        '📍 Tick Lower:',
        tickLower,
        `(${tickLower / tickSpacing} * ${tickSpacing})`
      );
      console.log(
        '📍 Tick Upper:',
        tickUpper,
        `(${tickUpper / tickSpacing} * ${tickSpacing})`
      );
      console.log(
        '✅ Tick Lower divisible by spacing:',
        tickLower % tickSpacing === 0
      );
      console.log(
        '✅ Tick Upper divisible by spacing:',
        tickUpper % tickSpacing === 0
      );

      // Add 5% slippage protection
      const slippageToleranceBps = 500n; // 5%
      const amount0Min =
        (amount0Desired * (10000n - slippageToleranceBps)) / 10000n;
      const amount1Min =
        (amount1Desired * (10000n - slippageToleranceBps)) / 10000n;

      console.log('🛡️ === SLIPPAGE PROTECTION ===');
      console.log(
        `💰 Amount0Min (${token0Symbol}):`,
        amount0Min.toString(),
        'wei (5% slippage)'
      );
      console.log(
        `💰 Amount1Min (${token1Symbol}):`,
        amount1Min.toString(),
        'wei (5% slippage)'
      );

      // Create deadline (20 minutes from now)
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);
      console.log('⏰ Deadline:', deadline.toString());

      // Pre-flight checks for balances and allowances
      console.log('🔍 === PRE-FLIGHT CHECKS ===');

      // Check current balances
      const currentPYUSDBalance = poolData.metaMaskPYUSDBalance;
      const currentUSDCBalance = poolData.metaMaskUSDCBalance;
      const requiredPYUSD =
        Number(pyusdAmountWei) / Math.pow(10, PYUSD_TOKEN.decimals);
      const requiredUSDC =
        Number(usdcAmountWei) / Math.pow(10, USDC_TOKEN.decimals);

      console.log('💰 Balance Check:');
      console.log(
        `  - Current PYUSD: ${currentPYUSDBalance}, Required: ${requiredPYUSD}`
      );
      console.log(
        `  - Current USDC: ${currentUSDCBalance}, Required: ${requiredUSDC}`
      );
      console.log(
        `  - PYUSD Sufficient: ${currentPYUSDBalance >= requiredPYUSD}`
      );
      console.log(`  - USDC Sufficient: ${currentUSDCBalance >= requiredUSDC}`);

      // Check allowances
      const currentPYUSDAllowance = poolData.positionManagerAllowance;
      const currentUSDCAllowance = poolData.positionManagerUSDCAllowance;

      console.log('🔐 Allowance Check:');
      console.log(
        `  - PYUSD Allowance: ${currentPYUSDAllowance}, Required: ${requiredPYUSD}`
      );
      console.log(
        `  - USDC Allowance: ${currentUSDCAllowance}, Required: ${requiredUSDC}`
      );
      console.log(
        `  - PYUSD Allowance Sufficient: ${currentPYUSDAllowance >= requiredPYUSD}`
      );
      console.log(
        `  - USDC Allowance Sufficient: ${currentUSDCAllowance >= requiredUSDC}`
      );

      // Validate all requirements
      if (currentPYUSDBalance < requiredPYUSD) {
        throw new Error(
          `Insufficient PYUSD balance: have ${currentPYUSDBalance}, need ${requiredPYUSD}`
        );
      }
      if (currentUSDCBalance < requiredUSDC) {
        throw new Error(
          `Insufficient USDC balance: have ${currentUSDCBalance}, need ${requiredUSDC}`
        );
      }
      if (currentPYUSDAllowance < requiredPYUSD) {
        throw new Error(
          `Insufficient PYUSD allowance: have ${currentPYUSDAllowance}, need ${requiredPYUSD}`
        );
      }
      if (currentUSDCAllowance < requiredUSDC) {
        throw new Error(
          `Insufficient USDC allowance: have ${currentUSDCAllowance}, need ${requiredUSDC}`
        );
      }

      console.log('✅ All pre-flight checks passed!');

      // Construct mint parameters
      const mintParams = {
        token0: token0Address as `0x${string}`,
        token1: token1Address as `0x${string}`,
        fee: PYUSD_USDC_POOL.fee,
        tickLower,
        tickUpper,
        amount0Desired,
        amount1Desired,
        amount0Min,
        amount1Min,
        recipient: metamaskWallet.address as `0x${string}`,
        deadline,
      };

      console.log('📋 === FINAL MINT PARAMETERS ===');
      console.log('Parameters for Position Manager mint():', {
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

      // Encode the mint call
      const mintCalldata = encodeFunctionData({
        abi: UNISWAP_V3_POSITION_MANAGER_ABI,
        functionName: 'mint',
        args: [mintParams],
      });

      console.log('📞 === TRANSACTION PREPARATION ===');
      console.log(
        '📞 Position Manager Address:',
        UNISWAP_V3_POSITION_MANAGER_ADDRESS
      );
      console.log('📞 Mint Calldata:', mintCalldata);

      // Execute mint transaction with higher gas limit
      console.log('🚀 === EXECUTING LIQUIDITY ADDITION ===');

      // Use higher gas limit for full-range positions (800k gas)
      const gasLimit = '0xC3500'; // 800,000 gas limit for full-range positions
      console.log(
        '📊 Gas limit set to:',
        parseInt(gasLimit, 16).toLocaleString(),
        'gas'
      );

      const mintTx = await provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: metamaskWallet.address,
            to: UNISWAP_V3_POSITION_MANAGER_ADDRESS,
            data: mintCalldata,
            gas: gasLimit,
          },
        ],
      });

      console.log(`✅ Liquidity addition transaction sent: ${mintTx}`);
      setPoolData(prev => ({
        ...prev,
        liquidityStatus: `Liquidity added! Tx: ${mintTx}`,
      }));

      // Refresh balances
      setTimeout(() => {
        checkBalancesAndAllowances();
      }, 5000);
    } catch (error) {
      console.error('❌ === LIQUIDITY ADDITION FAILED ===');
      console.error('❌ Error details:', error);
      console.error(
        '❌ Error name:',
        error instanceof Error ? error.name : 'Unknown'
      );
      console.error(
        '❌ Error message:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      console.error(
        '❌ Error stack:',
        error instanceof Error ? error.stack : 'No stack trace'
      );

      // Try to extract more meaningful error info
      let errorMessage = 'Liquidity addition failed';
      if (error instanceof Error) {
        if (error.message.includes('execution reverted')) {
          errorMessage =
            'Transaction reverted - check token approvals and balances';
        } else if (error.message.includes('insufficient')) {
          errorMessage =
            'Insufficient balance or allowance for one or both tokens';
        } else if (error.message.includes('user denied')) {
          errorMessage = 'Transaction rejected by user';
        } else if (error.message.includes('TRANSFER_FROM_FAILED')) {
          errorMessage =
            'Token transfer failed - check approvals to Position Manager';
        } else if (error.message.includes('T')) {
          errorMessage = 'Tick range or pool configuration issue';
        } else {
          errorMessage = error.message;
        }
      }

      setPoolData(prev => ({
        ...prev,
        liquidityStatus: 'Liquidity addition failed',
        error: errorMessage,
      }));
    }
  };

  if (!ready || !authenticated) {
    return (
      <main className='flex min-h-screen flex-col items-center justify-center bg-privy-light-blue px-4 py-6'>
        <div className='text-center'>
          <h1 className='mb-4 text-2xl font-semibold'>
            Please log in to continue
          </h1>
          <p className='text-gray-600'>
            You need to be authenticated to use the DeFi features.
          </p>
        </div>
      </main>
    );
  }

  if (!metamaskWallet) {
    return (
      <main className='flex min-h-screen flex-col items-center justify-center bg-privy-light-blue px-4 py-6'>
        <div className='text-center'>
          <h1 className='mb-4 text-2xl font-semibold'>MetaMask Required</h1>
          <p className='mb-4 text-gray-600'>
            This demo requires a MetaMask wallet to be connected.
          </p>
          <p className='text-sm text-gray-500'>
            Please connect MetaMask through the login process.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className='flex min-h-screen flex-col bg-privy-light-blue px-4 py-6 sm:px-20 sm:py-10'>
      {ready && authenticated ? (
        <>
          <div className='flex flex-row justify-between'>
            <h1 className='text-2xl font-semibold'>Privy Auth Demo</h1>
            <button
              onClick={logout}
              className='rounded-md bg-violet-200 px-4 py-2 text-sm text-violet-700 hover:text-violet-900'
            >
              Logout
            </button>
          </div>
          <div className='mt-12 flex flex-wrap gap-4'>
            {googleSubject ? (
              <button
                onClick={() => {
                  unlinkGoogle(googleSubject);
                }}
                className='rounded-md border border-violet-600 px-4 py-2 text-sm text-violet-600 hover:border-violet-700 hover:text-violet-700 disabled:border-gray-500 disabled:text-gray-500 hover:disabled:text-gray-500'
                disabled={!canRemoveAccount}
              >
                Unlink Google
              </button>
            ) : (
              <button
                onClick={() => {
                  linkGoogle();
                }}
                className='rounded-md bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-700'
              >
                Link Google
              </button>
            )}

            {twitterSubject ? (
              <button
                onClick={() => {
                  unlinkTwitter(twitterSubject);
                }}
                className='rounded-md border border-violet-600 px-4 py-2 text-sm text-violet-600 hover:border-violet-700 hover:text-violet-700 disabled:border-gray-500 disabled:text-gray-500 hover:disabled:text-gray-500'
                disabled={!canRemoveAccount}
              >
                Unlink Twitter
              </button>
            ) : (
              <button
                className='rounded-md bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-700'
                onClick={() => {
                  linkTwitter();
                }}
              >
                Link Twitter
              </button>
            )}

            {discordSubject ? (
              <button
                onClick={() => {
                  unlinkDiscord(discordSubject);
                }}
                className='rounded-md border border-violet-600 px-4 py-2 text-sm text-violet-600 hover:border-violet-700 hover:text-violet-700 disabled:border-gray-500 disabled:text-gray-500 hover:disabled:text-gray-500'
                disabled={!canRemoveAccount}
              >
                Unlink Discord
              </button>
            ) : (
              <button
                className='rounded-md bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-700'
                onClick={() => {
                  linkDiscord();
                }}
              >
                Link Discord
              </button>
            )}

            {email ? (
              <button
                onClick={() => {
                  unlinkEmail(email.address);
                }}
                className='rounded-md border border-violet-600 px-4 py-2 text-sm text-violet-600 hover:border-violet-700 hover:text-violet-700 disabled:border-gray-500 disabled:text-gray-500 hover:disabled:text-gray-500'
                disabled={!canRemoveAccount}
              >
                Unlink email
              </button>
            ) : (
              <button
                onClick={linkEmail}
                className='rounded-md bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-700'
              >
                Connect email
              </button>
            )}
            {wallet ? (
              <button
                onClick={() => {
                  unlinkWallet(wallet.address);
                }}
                className='rounded-md border border-violet-600 px-4 py-2 text-sm text-violet-600 hover:border-violet-700 hover:text-violet-700 disabled:border-gray-500 disabled:text-gray-500 hover:disabled:text-gray-500'
                disabled={!canRemoveAccount}
              >
                Unlink wallet
              </button>
            ) : (
              <button
                onClick={linkWallet}
                className='rounded-md border-none bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-700'
              >
                Connect wallet
              </button>
            )}
            {phone ? (
              <button
                onClick={() => {
                  unlinkPhone(phone.number);
                }}
                className='rounded-md border border-violet-600 px-4 py-2 text-sm text-violet-600 hover:border-violet-700 hover:text-violet-700 disabled:border-gray-500 disabled:text-gray-500 hover:disabled:text-gray-500'
                disabled={!canRemoveAccount}
              >
                Unlink phone
              </button>
            ) : (
              <button
                onClick={linkPhone}
                className='rounded-md border-none bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-700'
              >
                Connect phone
              </button>
            )}

            <button
              onClick={() => verifyToken().then(setVerifyResult)}
              className='rounded-md border-none bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-700'
            >
              Verify token on server
            </button>

            {Boolean(verifyResult) && (
              <details className='w-full'>
                <summary className='mt-6 text-sm font-bold uppercase text-gray-600'>
                  Server verify result
                </summary>
                <pre className='mt-2 max-w-4xl rounded-md bg-slate-700 p-4 font-mono text-xs text-slate-50 sm:text-sm'>
                  {JSON.stringify(verifyResult, null, 2)}
                </pre>
              </details>
            )}
          </div>

          {/* Smart Wallet Section */}
          {smartWallet && (
            <div className='mt-8 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6'>
              <h2 className='mb-4 text-xl font-bold text-blue-900'>
                Your Smart Wallet
              </h2>
              <div className='space-y-3'>
                <div>
                  <p className='mb-1 text-sm font-medium text-blue-700'>
                    Smart Wallet Address{' '}
                    {smartWallet.smartWalletType
                      ? `(${smartWallet.smartWalletType})`
                      : ''}
                    :
                  </p>
                  <p className='break-all rounded border bg-white p-3 font-mono text-sm text-gray-800'>
                    {smartWallet.address}
                  </p>
                </div>

                {/* Deployment Status */}
                <div className='rounded border bg-white p-3'>
                  <div className='mb-2 flex items-center justify-between'>
                    <p className='text-sm font-medium text-blue-700'>
                      Deployment Status:
                    </p>
                    <button
                      type='button'
                      onClick={checkSmartWalletDeployment}
                      disabled={smartWalletDeploymentStatus.isChecking}
                      className='rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:bg-blue-400'
                    >
                      {smartWalletDeploymentStatus.isChecking
                        ? 'Checking...'
                        : 'Check Status'}
                    </button>
                  </div>
                  <div className='text-sm'>
                    {smartWalletDeploymentStatus.isChecking ? (
                      <p className='text-yellow-600'>
                        🔄 Checking deployment status...
                      </p>
                    ) : smartWalletDeploymentStatus.isDeployed ? (
                      <p className='text-green-600'>
                        ✅ Smart wallet is deployed on-chain
                      </p>
                    ) : (
                      <div className='text-yellow-600'>
                        <p>⏳ Smart wallet not yet deployed</p>
                        <p className='mt-1 text-xs'>
                          Will be deployed on your first transaction
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {client?.chain && (
                  <div className='rounded border bg-white p-3'>
                    <p className='mb-2 text-sm font-medium text-blue-700'>
                      Network Information:
                    </p>
                    <div className='space-y-1 text-sm text-gray-700'>
                      <p>
                        <span className='font-medium'>Chain:</span>{' '}
                        {client.chain.name}
                      </p>
                      <p>
                        <span className='font-medium'>Chain ID:</span>{' '}
                        {client.chain.id}
                      </p>
                      <p>
                        <span className='font-medium'>Native Currency:</span>{' '}
                        {client.chain.nativeCurrency?.symbol || 'ETH'}
                      </p>
                      {client.chain.id === 1 && (
                        <p className='mt-2 text-xs text-blue-600'>
                          🔗{' '}
                          <a
                            href={`https://etherscan.io/address/${smartWallet.address}`}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='underline hover:text-blue-800'
                          >
                            View on Etherscan
                          </a>
                        </p>
                      )}
                      {client.chain.id === 11155111 && (
                        <p className='mt-2 text-xs text-blue-600'>
                          🔗{' '}
                          <a
                            href={`https://sepolia.etherscan.io/address/${smartWallet.address}`}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='underline hover:text-blue-800'
                          >
                            View on Sepolia Etherscan
                          </a>
                        </p>
                      )}
                      {client.chain.id === 8453 && (
                        <p className='mt-2 text-xs text-blue-600'>
                          🔗{' '}
                          <a
                            href={`https://basescan.org/address/${smartWallet.address}`}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='underline hover:text-blue-800'
                          >
                            View on BaseScan
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <div className='text-sm text-blue-600'>
                  <p>✅ Gas sponsorship enabled</p>
                  <p>✅ Batch transactions supported</p>
                  <p>✅ EVM compatible</p>
                </div>
              </div>
            </div>
          )}

          {/* Comprehensive Balance Dashboard */}
          {smartWallet && client?.chain?.id === 11155111 && (
            <div className='mt-6 rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-6'>
              <div className='mb-4 flex items-center justify-between'>
                <h2 className='text-xl font-bold text-green-900'>
                  💰 Balance & AAVE Positions Dashboard
                </h2>
                <button
                  type='button'
                  onClick={checkComprehensiveBalances}
                  disabled={comprehensiveBalances.loading}
                  className='rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:bg-green-400'
                >
                  {comprehensiveBalances.loading
                    ? '🔄 Loading...'
                    : '🔍 Check All Balances'}
                </button>
              </div>

              {comprehensiveBalances.error && (
                <div className='mb-4 rounded border border-red-200 bg-red-50 p-3'>
                  <p className='text-sm text-red-600'>
                    <strong>Error:</strong> {comprehensiveBalances.error}
                  </p>
                </div>
              )}

              {comprehensiveBalances.loading && (
                <div className='mb-4 rounded border border-yellow-200 bg-yellow-50 p-3'>
                  <p className='text-sm text-yellow-700'>
                    🔄 Loading balances and AAVE positions...
                  </p>
                </div>
              )}

              {(comprehensiveBalances.ethBalances ||
                comprehensiveBalances.usdcBalances ||
                comprehensiveBalances.aavePositions) && (
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                  {/* ETH Balances */}
                  {comprehensiveBalances.ethBalances && (
                    <div className='rounded-lg border border-blue-200 bg-white p-4'>
                      <h3 className='mb-3 text-lg font-semibold text-blue-800'>
                        💎 ETH Balances
                      </h3>
                      <div className='space-y-2'>
                        <div className='flex items-center justify-between'>
                          <span className='text-sm font-medium text-gray-600'>
                            EOA Wallet:
                          </span>
                          <span className='font-mono text-sm font-semibold text-blue-600'>
                            {parseFloat(
                              comprehensiveBalances.ethBalances.eoaEth
                            ).toFixed(6)}{' '}
                            ETH
                          </span>
                        </div>
                        <div className='flex items-center justify-between'>
                          <span className='text-sm font-medium text-gray-600'>
                            Smart Wallet:
                          </span>
                          <span className='font-mono text-sm font-semibold text-purple-600'>
                            {parseFloat(
                              comprehensiveBalances.ethBalances.smartWalletEth
                            ).toFixed(6)}{' '}
                            ETH
                          </span>
                        </div>
                        <div className='mt-2 border-t border-gray-200 pt-2'>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm font-medium text-gray-800'>
                              Total:
                            </span>
                            <span className='font-mono text-sm font-bold text-green-600'>
                              {(
                                parseFloat(
                                  comprehensiveBalances.ethBalances.eoaEth
                                ) +
                                parseFloat(
                                  comprehensiveBalances.ethBalances
                                    .smartWalletEth
                                )
                              ).toFixed(6)}{' '}
                              ETH
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* USDC Balances */}
                  {comprehensiveBalances.usdcBalances && (
                    <div className='rounded-lg border border-green-200 bg-white p-4'>
                      <h3 className='mb-3 text-lg font-semibold text-green-800'>
                        💵 USDC Balances
                      </h3>
                      <div className='space-y-2'>
                        <div className='flex items-center justify-between'>
                          <span className='text-sm font-medium text-gray-600'>
                            EOA Wallet:
                          </span>
                          <span className='font-mono text-sm font-semibold text-blue-600'>
                            {comprehensiveBalances.usdcBalances.eoaUsdc} USDC
                          </span>
                        </div>
                        <div className='flex items-center justify-between'>
                          <span className='text-sm font-medium text-gray-600'>
                            Smart Wallet:
                          </span>
                          <span className='font-mono text-sm font-semibold text-purple-600'>
                            {comprehensiveBalances.usdcBalances.smartWalletUsdc}{' '}
                            USDC
                          </span>
                        </div>
                        <div className='mt-2 border-t border-gray-200 pt-2'>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm font-medium text-gray-800'>
                              Total:
                            </span>
                            <span className='font-mono text-sm font-bold text-green-600'>
                              {(
                                parseFloat(
                                  comprehensiveBalances.usdcBalances.eoaUsdc
                                ) +
                                parseFloat(
                                  comprehensiveBalances.usdcBalances
                                    .smartWalletUsdc
                                )
                              ).toFixed(6)}{' '}
                              USDC
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AAVE Positions */}
                  {comprehensiveBalances.aavePositions && (
                    <div className='rounded-lg border border-purple-200 bg-white p-4'>
                      <h3 className='mb-3 text-lg font-semibold text-purple-800'>
                        🏦 AAVE Positions
                      </h3>
                      <div className='space-y-3'>
                        {/* aWETH Positions */}
                        <div>
                          <h4 className='mb-2 text-sm font-medium text-purple-700'>
                            aWETH Holdings:
                          </h4>
                          <div className='space-y-1'>
                            <div className='flex items-center justify-between'>
                              <span className='text-xs text-gray-600'>
                                EOA:
                              </span>
                              <span className='font-mono text-xs font-semibold text-blue-600'>
                                {parseFloat(
                                  comprehensiveBalances.aavePositions.eoaAweth
                                ).toFixed(6)}{' '}
                                aWETH
                              </span>
                            </div>
                            <div className='flex items-center justify-between'>
                              <span className='text-xs text-gray-600'>
                                Smart:
                              </span>
                              <span className='font-mono text-xs font-semibold text-purple-600'>
                                {parseFloat(
                                  comprehensiveBalances.aavePositions
                                    .smartWalletAweth
                                ).toFixed(6)}{' '}
                                aWETH
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* aUSDC Positions */}
                        <div>
                          <h4 className='mb-2 text-sm font-medium text-purple-700'>
                            aUSDC Holdings:
                          </h4>
                          <div className='space-y-1'>
                            <div className='flex items-center justify-between'>
                              <span className='text-xs text-gray-600'>
                                EOA:
                              </span>
                              <span className='font-mono text-xs font-semibold text-blue-600'>
                                {comprehensiveBalances.aavePositions.eoaAusdc}{' '}
                                aUSDC
                              </span>
                            </div>
                            <div className='flex items-center justify-between'>
                              <span className='text-xs text-gray-600'>
                                Smart:
                              </span>
                              <span className='font-mono text-xs font-semibold text-purple-600'>
                                {
                                  comprehensiveBalances.aavePositions
                                    .smartWalletAusdc
                                }{' '}
                                aUSDC
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Total AAVE Value */}
                        <div className='mt-2 border-t border-gray-200 pt-2'>
                          <div className='text-center'>
                            <span className='text-xs font-medium text-gray-700'>
                              Total AAVE Deposits
                            </span>
                            <div className='mt-1 space-y-1'>
                              <div className='text-xs font-semibold text-green-600'>
                                {(
                                  parseFloat(
                                    comprehensiveBalances.aavePositions.eoaAweth
                                  ) +
                                  parseFloat(
                                    comprehensiveBalances.aavePositions
                                      .smartWalletAweth
                                  )
                                ).toFixed(6)}{' '}
                                aWETH
                              </div>
                              <div className='text-xs font-semibold text-green-600'>
                                {(
                                  parseFloat(
                                    comprehensiveBalances.aavePositions.eoaAusdc
                                  ) +
                                  parseFloat(
                                    comprehensiveBalances.aavePositions
                                      .smartWalletAusdc
                                  )
                                ).toFixed(6)}{' '}
                                aUSDC
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Helpful Info */}
              <div className='mt-4 rounded bg-green-100 p-3 text-sm text-green-700'>
                <p className='font-medium'>💡 What this shows:</p>
                <ul className='mt-1 list-inside list-disc space-y-1 text-xs'>
                  <li>
                    <strong>ETH & USDC:</strong> Native balances in both your
                    EOA and Smart Wallet
                  </li>
                  <li>
                    <strong>aTokens:</strong> Your AAVE positions representing
                    deposited assets earning yield
                  </li>
                  <li>
                    <strong>EOA vs Smart:</strong> Compare holdings across both
                    wallet types
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Network Switching Section */}
          {client && (
            <div className='mt-6 rounded-lg border border-gray-200 bg-white p-4'>
              <h3 className='mb-3 text-lg font-semibold text-gray-800'>
                Network Controls
              </h3>
              <div className='space-y-3'>
                <div>
                  <p className='mb-2 text-sm font-medium text-gray-700'>
                    Current Network:{' '}
                    <span className='text-blue-600'>
                      {client.chain?.name || 'Unknown'} (ID: {client.chain?.id})
                    </span>
                  </p>
                </div>
                <div>
                  <p className='mb-2 text-sm font-medium text-gray-700'>
                    Switch Network:
                  </p>
                  <div className='flex flex-wrap gap-2'>
                    {availableNetworks.map(network => (
                      <button
                        key={network.id}
                        type='button'
                        onClick={() => switchNetwork(network.id)}
                        disabled={
                          isNetworkSwitching || client.chain?.id === network.id
                        }
                        className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                          client.chain?.id === network.id
                            ? 'cursor-not-allowed border-blue-300 bg-blue-100 text-blue-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                        } disabled:opacity-50`}
                      >
                        {isNetworkSwitching ? '...' : network.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Smart Wallet Testing Section */}
          {smartWallet && client && (
            <div className='mt-6 rounded-lg border border-gray-200 bg-white p-4'>
              <h3 className='mb-3 text-lg font-semibold text-gray-800'>
                Smart Wallet Testing
              </h3>
              <div className='space-y-4'>
                <div>
                  <button
                    type='button'
                    onClick={testSmartWallet}
                    disabled={testResults.message === 'Testing...'}
                    className='rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-400'
                  >
                    {testResults.message === 'Testing...'
                      ? 'Testing...'
                      : '🧪 Test Smart Wallet (Sign Message)'}
                  </button>
                  <p className='mt-1 text-xs text-gray-500'>
                    This will sign a message using your smart wallet to verify
                    it&apos;s working
                  </p>
                </div>

                {/* Test Results */}
                {(testResults.message || testResults.error) && (
                  <div className='rounded border bg-gray-50 p-3'>
                    <h4 className='mb-2 text-sm font-medium text-gray-700'>
                      Test Results:
                    </h4>

                    {testResults.error ? (
                      <div className='text-sm text-red-600'>
                        <p className='font-medium'>❌ Error:</p>
                        <p className='mt-1'>{testResults.error}</p>
                      </div>
                    ) : testResults.signature ? (
                      <div className='space-y-3 text-sm'>
                        {/* Verification Status */}
                        <div
                          className={`rounded border p-3 ${
                            testResults.isSmartWalletSigner
                              ? 'border-green-200 bg-green-50 text-green-800'
                              : 'border-yellow-200 bg-yellow-50 text-yellow-800'
                          }`}
                        >
                          <p className='font-medium'>
                            {testResults.isSmartWalletSigner
                              ? '✅ Smart Wallet Verified!'
                              : '⚠️ Verification Warning'}
                          </p>
                          <p className='mt-1 text-sm'>
                            {testResults.verificationDetails}
                          </p>
                          {testResults.signerAddress && (
                            <div className='mt-2'>
                              <p className='text-xs font-medium'>
                                Signer Address:
                              </p>
                              <p className='break-all font-mono text-xs'>
                                {testResults.signerAddress}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Message and Signature Details */}
                        <div className='space-y-2'>
                          <div>
                            <p className='font-medium text-gray-700'>
                              Message:
                            </p>
                            <p className='break-all rounded border bg-white p-2 font-mono text-xs'>
                              {testResults.message}
                            </p>
                          </div>
                          <div>
                            <p className='font-medium text-gray-700'>
                              Signature:
                            </p>
                            <p className='break-all rounded border bg-white p-2 font-mono text-xs'>
                              {testResults.signature}
                            </p>
                          </div>
                        </div>

                        {/* Address Comparison */}
                        <div className='rounded border bg-gray-50 p-3'>
                          <p className='mb-2 text-xs font-medium text-gray-700'>
                            Address Comparison:
                          </p>
                          <div className='space-y-1 text-xs'>
                            <div>
                              <span className='font-medium'>Smart Wallet:</span>
                              <span className='ml-2 font-mono'>
                                {smartWallet?.address}
                              </span>
                            </div>
                            {testResults.signerAddress && (
                              <div>
                                <span className='font-medium'>
                                  Signature From:
                                </span>
                                <span className='ml-2 font-mono'>
                                  {testResults.signerAddress}
                                </span>
                                <span
                                  className={`ml-2 ${
                                    testResults.signerAddress.toLowerCase() ===
                                    smartWallet?.address.toLowerCase()
                                      ? 'text-green-600'
                                      : 'text-red-600'
                                  }`}
                                >
                                  {testResults.signerAddress.toLowerCase() ===
                                  smartWallet?.address.toLowerCase()
                                    ? '✅ Match'
                                    : '❌ Different'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : testResults.message === 'Testing...' ? (
                      <div className='text-sm text-yellow-600'>
                        <p>🔄 Testing smart wallet functionality...</p>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PYUSD Token Testing Section */}
          {smartWallet && client?.chain?.id === 11155111 && (
            <div className='mt-6 rounded-lg border border-gray-200 bg-white p-4'>
              <h3 className='mb-3 text-lg font-semibold text-gray-800'>
                🪙 PYUSD Token Testing (Sepolia)
              </h3>

              <div className='space-y-4'>
                {/* Token Info */}
                <div className='rounded bg-gray-50 p-3 text-sm text-gray-600'>
                  <p>
                    <strong>Token:</strong> PYUSD ({PYUSD_TOKEN_CONFIG.address})
                  </p>
                  <p>
                    <strong>Test Flow:</strong> Approve Smart Wallet → Transfer
                    with Smart Wallet
                  </p>
                </div>

                {/* Check Balances */}
                <div>
                  <button
                    type='button'
                    onClick={checkTokenBalances}
                    className='rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700'
                  >
                    Check Token Balances
                  </button>
                </div>

                {/* Balance Display */}
                {tokenTestResults.balances && (
                  <div className='rounded border bg-gray-50 p-4'>
                    <h4 className='mb-2 font-medium text-gray-800'>
                      Current Balances:
                    </h4>
                    <p className='text-gray-700'>
                      MetaMask Wallet:{' '}
                      <span className='font-medium text-green-600'>
                        {tokenTestResults.balances.metamask} PYUSD
                      </span>
                    </p>
                    <p className='text-gray-700'>
                      Smart Wallet:{' '}
                      <span className='font-medium text-blue-600'>
                        {tokenTestResults.balances.smartWallet} PYUSD
                      </span>
                    </p>
                  </div>
                )}

                {/* Step 1: Approve */}
                <div className='border-t border-gray-200 pt-4'>
                  <h4 className='mb-2 font-medium text-gray-800'>
                    Step 1: Approve Smart Wallet
                  </h4>
                  <p className='mb-3 text-sm text-gray-600'>
                    Allow your smart wallet to spend up to 100 PYUSD from your
                    MetaMask wallet
                  </p>
                  <button
                    type='button'
                    onClick={approveSmartWallet}
                    disabled={!client || client.chain?.id !== 11155111}
                    className='rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:bg-gray-400'
                  >
                    Approve Smart Wallet (MetaMask Signs)
                  </button>
                  {tokenTestResults.approveStatus && (
                    <p
                      className={`mt-2 text-sm font-medium ${
                        tokenTestResults.approveStatus.includes('successful')
                          ? 'text-green-600'
                          : tokenTestResults.approveStatus.includes('failed')
                            ? 'text-red-600'
                            : 'text-yellow-600'
                      }`}
                    >
                      {tokenTestResults.approveStatus}
                    </p>
                  )}
                  {tokenTestResults.approveHash && (
                    <div className='mt-2'>
                      <p className='text-xs text-gray-500'>
                        Transaction Hash:
                        <a
                          href={`https://sepolia.etherscan.io/tx/${tokenTestResults.approveHash}`}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='ml-1 font-mono text-blue-600 underline hover:text-blue-800'
                        >
                          {tokenTestResults.approveHash}
                        </a>
                      </p>
                    </div>
                  )}
                </div>

                {/* Step 2: Transfer */}
                <div className='border-t border-gray-200 pt-4'>
                  <h4 className='mb-2 font-medium text-gray-800'>
                    Step 2: Transfer with Smart Wallet
                  </h4>
                  <p className='mb-3 text-sm text-gray-600'>
                    Use your smart wallet to transfer 1 PYUSD from MetaMask to
                    zakhap.eth
                  </p>
                  <button
                    type='button'
                    onClick={transferWithSmartWallet}
                    disabled={!client || client.chain?.id !== 11155111}
                    className='rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:bg-gray-400'
                  >
                    Transfer 1 PYUSD (Smart Wallet Signs)
                  </button>
                  {tokenTestResults.transferStatus && (
                    <p
                      className={`mt-2 text-sm font-medium ${
                        tokenTestResults.transferStatus.includes('successful')
                          ? 'text-green-600'
                          : tokenTestResults.transferStatus.includes('failed')
                            ? 'text-red-600'
                            : 'text-yellow-600'
                      }`}
                    >
                      {tokenTestResults.transferStatus}
                    </p>
                  )}
                  {tokenTestResults.transferHash && (
                    <div className='mt-2'>
                      <p className='text-xs text-gray-500'>
                        Transaction Hash:
                        <a
                          href={`https://sepolia.etherscan.io/tx/${tokenTestResults.transferHash}`}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='ml-1 font-mono text-blue-600 underline hover:text-blue-800'
                        >
                          {tokenTestResults.transferHash}
                        </a>
                      </p>
                    </div>
                  )}
                </div>

                {/* Error Display */}
                {tokenTestResults.error && (
                  <div className='rounded border border-red-200 bg-red-50 p-3'>
                    <p className='text-sm text-red-600'>
                      <strong>Error:</strong> {tokenTestResults.error}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* USDC Token Testing Section */}
          {smartWallet && client?.chain?.id === 11155111 && (
            <div className='mt-6 rounded-lg border border-gray-200 bg-white p-4'>
              <h3 className='mb-3 text-lg font-semibold text-gray-800'>
                🪙 USDC Token Testing (Sepolia)
              </h3>

              <div className='space-y-4'>
                {/* Token Info */}
                <div className='rounded bg-gray-50 p-3 text-sm text-gray-600'>
                  <p>
                    <strong>Token:</strong> USDC ({USDC_TOKEN_CONFIG.address})
                  </p>
                  <p>
                    <strong>Test Flow:</strong> Approve Smart Wallet → Transfer
                    with Smart Wallet → Deposit to AAVE (Smart Wallet OR EOA)
                  </p>
                </div>

                {/* Check Balances */}
                <div className='flex gap-3'>
                  <button
                    type='button'
                    onClick={checkUsdcBalances}
                    className='rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700'
                  >
                    Check USDC Balances
                  </button>
                  <button
                    type='button'
                    onClick={testUsdcContract}
                    className='rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700'
                  >
                    🧪 Test USDC Contract
                  </button>
                </div>

                {/* Balance Display */}
                {usdcTestResults.balances && (
                  <div className='rounded border bg-gray-50 p-4'>
                    <h4 className='mb-2 font-medium text-gray-800'>
                      Current USDC Balances:
                    </h4>
                    <p className='text-gray-700'>
                      MetaMask Wallet:{' '}
                      <span className='font-medium text-green-600'>
                        {usdcTestResults.balances.metamask} USDC
                      </span>
                    </p>
                    <p className='text-gray-700'>
                      Smart Wallet:{' '}
                      <span className='font-medium text-blue-600'>
                        {usdcTestResults.balances.smartWallet} USDC
                      </span>
                    </p>
                  </div>
                )}

                {/* Step 1: Approve */}
                <div className='border-t border-gray-200 pt-4'>
                  <h4 className='mb-2 font-medium text-gray-800'>
                    Step 1: Approve Smart Wallet
                  </h4>
                  <p className='mb-3 text-sm text-gray-600'>
                    Allow your smart wallet to spend up to 100 USDC from your
                    MetaMask wallet
                  </p>
                  <button
                    type='button'
                    onClick={approveSmartWalletUsdc}
                    disabled={!client || client.chain?.id !== 11155111}
                    className='rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:bg-gray-400'
                  >
                    Approve Smart Wallet (MetaMask Signs)
                  </button>
                  {usdcTestResults.approveStatus && (
                    <p
                      className={`mt-2 text-sm font-medium ${
                        usdcTestResults.approveStatus.includes('successful')
                          ? 'text-green-600'
                          : usdcTestResults.approveStatus.includes('failed')
                            ? 'text-red-600'
                            : 'text-yellow-600'
                      }`}
                    >
                      {usdcTestResults.approveStatus}
                    </p>
                  )}
                  {usdcTestResults.approveHash && (
                    <div className='mt-2'>
                      <p className='text-xs text-gray-500'>
                        Transaction Hash:
                        <a
                          href={`https://sepolia.etherscan.io/tx/${usdcTestResults.approveHash}`}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='ml-1 font-mono text-blue-600 underline hover:text-blue-800'
                        >
                          {usdcTestResults.approveHash}
                        </a>
                      </p>
                    </div>
                  )}
                </div>

                {/* Step 2: Transfer */}
                <div className='border-t border-gray-200 pt-4'>
                  <h4 className='mb-2 font-medium text-gray-800'>
                    Step 2: Transfer with Smart Wallet
                  </h4>
                  <p className='mb-3 text-sm text-gray-600'>
                    Use your smart wallet to transfer 1 USDC from MetaMask to
                    freeslugs.eth
                  </p>
                  <button
                    type='button'
                    onClick={transferWithSmartWalletUsdc}
                    disabled={!client || client.chain?.id !== 11155111}
                    className='rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:bg-gray-400'
                  >
                    Transfer 1 USDC (Smart Wallet Signs)
                  </button>
                  {usdcTestResults.transferStatus && (
                    <p
                      className={`mt-2 text-sm font-medium ${
                        usdcTestResults.transferStatus.includes('successful')
                          ? 'text-green-600'
                          : usdcTestResults.transferStatus.includes('failed')
                            ? 'text-red-600'
                            : 'text-yellow-600'
                      }`}
                    >
                      {usdcTestResults.transferStatus}
                    </p>
                  )}
                  {usdcTestResults.transferHash && (
                    <div className='mt-2'>
                      <p className='text-xs text-gray-500'>
                        Transaction Hash:
                        <a
                          href={`https://sepolia.etherscan.io/tx/${usdcTestResults.transferHash}`}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='ml-1 font-mono text-blue-600 underline hover:text-blue-800'
                        >
                          {usdcTestResults.transferHash}
                        </a>
                      </p>
                    </div>
                  )}
                </div>

                {/* Step 3A: Deposit ETH to AAVE with Smart Wallet */}
                <div className='border-t border-gray-200 pt-4'>
                  <h4 className='mb-2 font-medium text-gray-800'>
                    Step 3A: Deposit ETH to AAVE (Smart Wallet)
                  </h4>
                  <p className='mb-3 text-sm text-gray-600'>
                    Use your smart wallet to deposit 0.01 ETH to AAVE v3 via
                    WETH Gateway (no approval needed)
                  </p>
                  <button
                    type='button'
                    onClick={depositEthToAave}
                    disabled={!client || client.chain?.id !== 11155111}
                    className='rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:bg-gray-400'
                  >
                    Deposit 0.01 ETH to AAVE (Smart Wallet Signs)
                  </button>
                </div>

                {/* Step 3B: Deposit ETH to AAVE with EOA */}
                <div className='border-t border-gray-200 pt-4'>
                  <h4 className='mb-2 font-medium text-gray-800'>
                    Step 3B: Deposit ETH to AAVE (EOA/MetaMask)
                  </h4>
                  <p className='mb-3 text-sm text-gray-600'>
                    Use your MetaMask wallet to deposit 0.01 ETH to AAVE v3 via
                    WETH Gateway (no approval needed)
                  </p>
                  <button
                    type='button'
                    onClick={depositEthToAaveEOA}
                    disabled={!client || client.chain?.id !== 11155111}
                    className='rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400'
                  >
                    Deposit 0.01 ETH to AAVE (MetaMask Signs)
                  </button>
                </div>

                {/* Status Display (shared) */}
                <div>
                  {usdcTestResults.aaveDepositStatus && (
                    <p
                      className={`mt-2 text-sm font-medium ${
                        usdcTestResults.aaveDepositStatus.includes('successful')
                          ? 'text-green-600'
                          : usdcTestResults.aaveDepositStatus.includes('failed')
                            ? 'text-red-600'
                            : 'text-yellow-600'
                      }`}
                    >
                      {usdcTestResults.aaveDepositStatus}
                    </p>
                  )}
                  {usdcTestResults.aaveDepositHash && (
                    <div className='mt-2'>
                      <p className='text-xs text-gray-500'>
                        Transaction Hash:
                        <a
                          href={`https://sepolia.etherscan.io/tx/${usdcTestResults.aaveDepositHash}`}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='ml-1 font-mono text-blue-600 underline hover:text-blue-800'
                        >
                          {usdcTestResults.aaveDepositHash}
                        </a>
                      </p>
                    </div>
                  )}
                </div>

                {/* Error Display */}
                {usdcTestResults.error && (
                  <div className='rounded border border-red-200 bg-red-50 p-3'>
                    <p className='text-sm text-red-600'>
                      <strong>Error:</strong> {usdcTestResults.error}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className='mt-6 max-w-4xl space-y-6'>
            <h2 className='text-xl font-bold'>Your Wallets</h2>
            <WalletList />
          </div>
          <p className='mt-6 text-sm font-bold uppercase text-gray-600'>
            User object
          </p>
          <pre className='mt-2 max-w-4xl rounded-md bg-slate-700 p-4 font-mono text-xs text-slate-50 sm:text-sm'>
            {JSON.stringify(user, null, 2)}
          </pre>

          {/* Wallet Info */}
          <div className='mt-8 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6'>
            <h2 className='mb-4 text-xl font-bold text-blue-900'>
              MetaMask Wallet
            </h2>
            <p className='text-sm text-blue-700'>
              Address: {metamaskWallet.address}
            </p>
            <p className='text-sm text-blue-700'>Network: Sepolia Testnet</p>
          </div>

          {/* Balance Information */}
          <div className='mt-8 rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-6'>
            <h2 className='mb-4 text-xl font-bold text-green-900'>
              Token Balances & Approvals
            </h2>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
              <div>
                <h3 className='font-semibold text-green-800'>Balances</h3>
                <p className='text-sm text-green-700'>
                  PYUSD: {poolData.metaMaskPYUSDBalance.toFixed(4)}
                </p>
                <p className='text-sm text-green-700'>
                  USDC: {poolData.metaMaskUSDCBalance.toFixed(4)}
                </p>
                <div className='mt-2 border-t border-green-300 pt-2'>
                  <p className='text-sm text-green-700'>
                    🏊‍♂️ Pool Positions: {poolData.nftPositionCount}
                  </p>
                  <p className='text-sm font-semibold text-green-800'>
                    💰 Pool Value: ${poolData.totalPoolValueUSD.toFixed(2)}
                    {poolData.totalPoolValueUSD > 0 && ' 🎉 Earning fees!'}
                  </p>
                </div>
              </div>
              <div>
                <h3 className='font-semibold text-green-800'>
                  Legacy Approvals
                </h3>
                <p className='text-sm text-green-700'>
                  Router: {poolData.routerAllowance.toFixed(2)} PYUSD
                </p>
                <p className='text-sm text-green-700'>
                  Position Mgr PYUSD:{' '}
                  {poolData.positionManagerAllowance.toFixed(2)}
                </p>
                <p className='text-sm text-green-700'>
                  Position Mgr USDC:{' '}
                  {poolData.positionManagerUSDCAllowance.toFixed(2)}
                </p>
              </div>
              <div>
                <h3 className='font-semibold text-green-800'>
                  🔒 Permit2 Status
                </h3>
                <div className='space-y-2'>
                  <div className='text-sm'>
                    <span className='font-medium'>PYUSD:</span>{' '}
                    {permit2Data.pyusdPermit2 === null ? (
                      <span className='text-gray-500'>Not checked</span>
                    ) : permit2Data.pyusdPermit2.isValid ? (
                      <span className='text-green-600'>✅ Valid</span>
                    ) : permit2Data.pyusdPermit2.isExpired ? (
                      <span className='text-red-600'>❌ Expired</span>
                    ) : (
                      <span className='text-yellow-600'>⚠️ Not approved</span>
                    )}
                  </div>
                  <div className='text-sm'>
                    <span className='font-medium'>USDC:</span>{' '}
                    {permit2Data.usdcPermit2 === null ? (
                      <span className='text-gray-500'>Not checked</span>
                    ) : permit2Data.usdcPermit2.isValid ? (
                      <span className='text-green-600'>✅ Valid</span>
                    ) : permit2Data.usdcPermit2.isExpired ? (
                      <span className='text-red-600'>❌ Expired</span>
                    ) : (
                      <span className='text-yellow-600'>⚠️ Not approved</span>
                    )}
                  </div>
                  {(permit2Data.pyusdPermit2?.expiration ||
                    permit2Data.usdcPermit2?.expiration) && (
                    <div className='mt-2 text-xs text-gray-600'>
                      {permit2Data.pyusdPermit2?.expiration && (
                        <div>
                          PYUSD expires:{' '}
                          {new Date(
                            permit2Data.pyusdPermit2.expiration * 1000
                          ).toLocaleDateString()}
                        </div>
                      )}
                      {permit2Data.usdcPermit2?.expiration && (
                        <div>
                          USDC expires:{' '}
                          {new Date(
                            permit2Data.usdcPermit2.expiration * 1000
                          ).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className='mt-4 flex flex-wrap gap-2'>
              <button
                type='button'
                onClick={checkBalancesAndAllowances}
                className='rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700'
              >
                🔄 Refresh Data
              </button>
              {/* PYUSD Permit2 Approvals */}
              <button
                type='button'
                onClick={() => approveTokenToPermit2(PYUSD_TOKEN.address)}
                className='rounded bg-orange-600 px-3 py-2 text-sm text-white hover:bg-orange-700'
              >
                🔗 Step 1: Approve PYUSD → Permit2
              </button>
              <button
                type='button'
                onClick={() => approveRouterThroughPermit2(PYUSD_TOKEN.address)}
                className='rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700'
              >
                🔒 Step 2: Permit2 → Router (PYUSD)
              </button>
              {/* USDC Permit2 Approvals */}
              <button
                type='button'
                onClick={() => approveTokenToPermit2(USDC_TOKEN.address)}
                className='rounded bg-orange-600 px-3 py-2 text-sm text-white hover:bg-orange-700'
              >
                🔗 Step 1: Approve USDC → Permit2
              </button>
              <button
                type='button'
                onClick={() => approveRouterThroughPermit2(USDC_TOKEN.address)}
                className='rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700'
              >
                🔒 Step 2: Permit2 → Router (USDC)
              </button>
              {/* Combined approvals for convenience */}
              {permit2Data.pyusdPermit2 &&
                !permit2Data.pyusdPermit2.isValid && (
                  <button
                    type='button'
                    onClick={() => approvePermit2(PYUSD_TOKEN.address)}
                    className='rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700'
                  >
                    🔄 Full Permit2 Setup (PYUSD)
                  </button>
                )}
              {permit2Data.usdcPermit2 && !permit2Data.usdcPermit2.isValid && (
                <button
                  type='button'
                  onClick={() => approvePermit2(USDC_TOKEN.address)}
                  className='rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700'
                >
                  🔄 Full Permit2 Setup (USDC)
                </button>
              )}
            </div>
          </div>

          {/* Permit2 Information Section */}
          <div className='mt-8 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6'>
            <h2 className='mb-4 text-xl font-bold text-blue-900'>
              🔒 Understanding Permit2 Approvals
            </h2>
            <div className='space-y-4'>
              <div className='rounded border border-blue-300 bg-blue-100 p-4'>
                <p className='text-sm text-blue-800'>
                  <strong>What is Permit2?</strong>
                </p>
                <ul className='mt-2 list-inside list-disc space-y-1 text-xs text-blue-700'>
                  <li>
                    Permit2 is a token approval contract used by Uniswap for
                    more secure and efficient token transfers
                  </li>
                  <li>
                    Unlike traditional ERC20 approvals, Permit2 approvals have
                    expiration times for better security
                  </li>
                  <li>
                    It requires a 2-step process: 1) Approve Permit2 to spend
                    your tokens, 2) Approve Universal Router through Permit2
                  </li>
                </ul>
              </div>

              <div className='grid gap-3 md:grid-cols-2'>
                <div className='rounded border border-orange-200 bg-orange-50 p-3'>
                  <h4 className='font-semibold text-orange-800'>
                    🔗 Step 1: Token → Permit2
                  </h4>
                  <p className='text-sm text-orange-700'>
                    Approve the Permit2 contract to spend your tokens
                    (PYUSD/USDC). This is a traditional ERC20 approval.
                  </p>
                </div>
                <div className='rounded border border-blue-200 bg-blue-50 p-3'>
                  <h4 className='font-semibold text-blue-800'>
                    🔒 Step 2: Permit2 → Router
                  </h4>
                  <p className='text-sm text-blue-700'>
                    Approve the Universal Router through Permit2 with an
                    expiration time. This enables swaps through Uniswap.
                  </p>
                </div>
              </div>

              {(permit2Data.pyusdPermit2?.isExpired ||
                permit2Data.usdcPermit2?.isExpired) && (
                <div className='rounded border border-red-300 bg-red-100 p-3'>
                  <p className='text-sm text-red-700'>
                    <strong>⚠️ Expired Allowance Detected:</strong> Your Permit2
                    allowance has expired. This is why your swap failed with
                    "AllowanceExpired" error. Use the buttons above to renew.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Approval Section */}
          <div className='mt-8 rounded-lg border border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 p-6'>
            <h2 className='mb-4 text-xl font-bold text-yellow-900'>
              Step 1: Token Approvals
            </h2>
            <p className='mb-4 text-sm text-yellow-700'>
              Approve contracts to spend your tokens before swapping or adding
              liquidity. Both legacy approvals and Permit2 approvals may be
              needed.
            </p>
            <div className='space-x-4'>
              <button
                onClick={approveRouter}
                className='rounded bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700'
                disabled={poolData.routerAllowance > 100}
              >
                {poolData.routerAllowance > 100
                  ? '✅ Router Approved'
                  : '🔓 Approve Router'}
              </button>
              <button
                onClick={approvePositionManager}
                className='rounded bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700'
                disabled={
                  poolData.positionManagerAllowance > 100 &&
                  poolData.positionManagerUSDCAllowance > 100
                }
              >
                {poolData.positionManagerAllowance > 100 &&
                poolData.positionManagerUSDCAllowance > 100
                  ? '✅ Position Mgr Approved (Both Tokens)'
                  : '🔓 Approve Position Manager (Both Tokens)'}
              </button>
            </div>
          </div>

          {/* Swap Section */}
          <div className='mt-8 rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 p-6'>
            <h2 className='mb-4 text-xl font-bold text-purple-900'>
              Step 2: Swap PYUSD → USDC
            </h2>
            <p className='mb-4 text-sm text-purple-700'>
              Test the Uniswap V3 swap functionality by converting PYUSD to
              USDC.
            </p>
            <div className='mb-4'>
              <label className='block text-sm font-medium text-purple-800'>
                Amount to Swap (PYUSD)
              </label>
              <input
                type='number'
                value={swapAmount}
                onChange={e => setSwapAmount(e.target.value)}
                className='mt-1 block w-32 rounded-md border-gray-300 px-3 py-2 text-sm'
                step='0.1'
                min='0'
              />
            </div>
            <button
              onClick={performSwap}
              className='rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700'
              disabled={
                poolData.routerAllowance < 1 ||
                poolData.metaMaskPYUSDBalance < Number(swapAmount)
              }
            >
              🔄 Swap PYUSD → USDC
            </button>
            <p className='mt-2 text-sm text-purple-700'>
              Status: {poolData.swapStatus}
            </p>
          </div>

          {/* Liquidity Section */}
          <div className='mt-8 rounded-lg border border-red-200 bg-gradient-to-r from-red-50 to-pink-50 p-6'>
            <h2 className='mb-4 text-xl font-bold text-red-900'>
              Step 3: Add Liquidity to Pool
            </h2>
            <p className='mb-4 text-sm text-red-700'>
              Add liquidity to the PYUSD/USDC pool and receive LP NFT tokens
              representing your position.
            </p>
            <div className='mb-4'>
              <label className='block text-sm font-medium text-red-800'>
                Amount of Each Token
              </label>
              <input
                type='number'
                value={liquidityAmount}
                onChange={e => setLiquidityAmount(e.target.value)}
                className='mt-1 block w-32 rounded-md border-gray-300 px-3 py-2 text-sm'
                step='0.1'
                min='0'
              />
              <p className='mt-1 text-xs text-red-600'>
                This will add {liquidityAmount} PYUSD + {liquidityAmount} USDC
              </p>
            </div>
            <button
              onClick={addLiquidity}
              className='rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700'
              disabled={
                poolData.positionManagerAllowance < 1 ||
                poolData.positionManagerUSDCAllowance < 1 ||
                poolData.metaMaskPYUSDBalance < Number(liquidityAmount) ||
                poolData.metaMaskUSDCBalance < Number(liquidityAmount)
              }
            >
              🏊 Add Liquidity
            </button>
            <p className='mt-2 text-sm text-red-700'>
              Status: {poolData.liquidityStatus}
            </p>
          </div>

          {/* Error Display */}
          {poolData.error && (
            <div className='mt-8 rounded-lg border border-red-300 bg-red-50 p-4'>
              <h3 className='font-semibold text-red-800'>Error</h3>
              <p className='text-sm text-red-700'>{poolData.error}</p>
            </div>
          )}

          {/* Debug Info */}
          <div className='mt-8 rounded-lg border border-gray-200 bg-gray-50 p-6'>
            <h2 className='mb-4 text-xl font-bold text-gray-900'>
              Debug Information
            </h2>
            <div className='space-y-2 text-sm text-gray-700'>
              <p>
                <strong>PYUSD Token:</strong> {PYUSD_TOKEN?.address}
              </p>
              <p>
                <strong>USDC Token:</strong> {USDC_TOKEN?.address}
              </p>
              <p>
                <strong>Pool Address:</strong> {PYUSD_USDC_POOL?.address}
              </p>
              <p>
                <strong>Pool Fee:</strong> {PYUSD_USDC_POOL?.fee} (0.3%)
              </p>
              <p>
                <strong>Router:</strong> {UNISWAP_V3_ROUTER_ADDRESS}
              </p>
              <p>
                <strong>Position Manager:</strong>{' '}
                {UNISWAP_V3_POSITION_MANAGER_ADDRESS}
              </p>
            </div>
            <p className='mt-4 text-xs text-gray-500'>
              Check browser console for detailed transaction logs and debugging
              information.
            </p>
          </div>
        </>
      ) : null}
    </main>
  );
}
