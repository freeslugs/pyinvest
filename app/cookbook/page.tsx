'use client';

import { getAccessToken, usePrivy, useWallets } from '@privy-io/react-auth';
import { useSmartWallets } from '@privy-io/react-auth/smart-wallets';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import WalletList from '../../components/WalletList';

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
    MULTICALL3: '0xcA11bde05977b3631167028862bE2a173976CA11' as const,
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
        </>
      ) : null}
    </main>
  );
}
