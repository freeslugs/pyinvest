'use client';

import { getAccessToken, usePrivy, useWallets } from '@privy-io/react-auth';
import { useSmartWallets } from '@privy-io/react-auth/smart-wallets';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import WalletList from '../../components/WalletList';
import {
  ERC20_ABI,
  NETWORKS,
  UNISWAP_V3_POOL_ABI,
  UNISWAP_V3_POSITION_MANAGER_ABI,
  UNISWAP_V3_POSITION_MANAGER_ADDRESS,
  UNISWAP_V3_ROUTER_ABI,
  UNISWAP_V3_ROUTER_ADDRESS,
  getPoolsForNetwork,
  getTokensForNetwork
} from '../../lib/constants';

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
  const [poolData, setPoolData] = useState<{
    userBalances?: {
      metamaskPYUSD: string;
      smartWalletPYUSD: string;
      metamaskUSDC: string;
      smartWalletUSDC: string;
      poolTokens: string;
    };
    approvals?: {
      pyusdApproved: boolean;
      usdcApproved: boolean;
      smartWalletApproved: boolean;
    };
    depositAmount: string;
    depositStatus?: string;
    depositHash?: string;
    error?: string;
    isLoading: boolean;
  }>({
    depositAmount: '5',
    isLoading: false,
  });
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

  // Available networks for switching (using constants)
  const availableNetworks = Object.values(NETWORKS).map(network => ({
    id: network.id,
    name: network.name,
    rpcUrl: network.rpcUrl,
  }));

  // Get current network tokens and pools
  const currentNetworkTokens = getTokensForNetwork(client?.chain?.id || 0);
  const currentNetworkPools = getPoolsForNetwork(client?.chain?.id || 0);
  const PYUSD_TOKEN_CONFIG = currentNetworkTokens.PYUSD || {
    address: '0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9' as const,
    decimals: 6,
    symbol: 'PYUSD',
    name: 'PayPal USD',
  };
  const USDC_TOKEN_CONFIG = currentNetworkTokens.USDC;
  const PYUSD_USDC_POOL = (currentNetworkPools as any)?.PYUSD_USDC;

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
    if (
      !client?.chain ||
      client.chain.id !== NETWORKS.SEPOLIA.id ||
      !smartWallet ||
      !PYUSD_TOKEN_CONFIG
    ) {
      console.log(
        'Must be on Sepolia network with smart wallet and PYUSD token available'
      );
      setTokenTestResults({
        error:
          'Must be on Sepolia network with smart wallet and PYUSD token available',
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
    if (
      !client?.chain ||
      client.chain.id !== NETWORKS.SEPOLIA.id ||
      !smartWallet ||
      !PYUSD_TOKEN_CONFIG
    ) {
      setTokenTestResults({
        error:
          'Must be on Sepolia network with smart wallet and PYUSD token available',
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
    if (
      !client?.chain ||
      client.chain.id !== NETWORKS.SEPOLIA.id ||
      !smartWallet ||
      !PYUSD_TOKEN_CONFIG
    ) {
      setTokenTestResults({
        error:
          'Must be on Sepolia network with smart wallet and PYUSD token available',
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

  // Function to check pool-related balances and approvals
  const checkPoolData = async () => {
    if (
      !client?.chain ||
      client.chain.id !== NETWORKS.SEPOLIA.id ||
      !smartWallet ||
      !PYUSD_TOKEN_CONFIG
    ) {
      setPoolData(prev => ({
        ...prev,
        error:
          'Must be on Sepolia network with smart wallet and PYUSD token available',
      }));
      return;
    }

    if (!PYUSD_USDC_POOL) {
      setPoolData(prev => ({
        ...prev,
        error:
          'PYUSD/USDC pool not available. The pool address needs to be configured in constants.ts',
      }));
      return;
    }

    setPoolData(prev => ({ ...prev, isLoading: true, error: '' }));

    try {
      const { createPublicClient, http } = await import('viem');
      const { sepolia } = await import('viem/chains');

      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http('https://ethereum-sepolia-rpc.publicnode.com'),
      });

      // Get MetaMask wallet address
      const metamaskWallet = user?.linkedAccounts?.find(
        account =>
          account.type === 'wallet' && account.walletClientType !== 'privy'
      ) as { address: string } | undefined;

      if (!metamaskWallet) {
        setPoolData(prev => ({
          ...prev,
          error: 'MetaMask wallet not found',
          isLoading: false,
        }));
        return;
      }

      console.log('🔍 Starting pool data checks...');
      console.log('📍 Pool address:', PYUSD_USDC_POOL.address);
      console.log('🏦 MetaMask address:', metamaskWallet.address);
      console.log('🤖 Smart wallet address:', smartWallet.address);

      // Check balances for both tokens and both wallets
      // Note: V3 pools don't have balanceOf for LP tokens - positions are NFTs
      const [
        metamaskPYUSD,
        smartWalletPYUSD,
        metamaskUSDC,
        smartWalletUSDC,
        pyusdAllowance,
        usdcAllowance,
      ] = await Promise.all([
        publicClient.readContract({
          address: PYUSD_TOKEN_CONFIG.address,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [metamaskWallet.address as `0x${string}`],
        }),
        publicClient.readContract({
          address: PYUSD_TOKEN_CONFIG.address,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [smartWallet.address as `0x${string}`],
        }),
        USDC_TOKEN_CONFIG
          ? publicClient.readContract({
              address: USDC_TOKEN_CONFIG.address,
              abi: ERC20_ABI,
              functionName: 'balanceOf',
              args: [metamaskWallet.address as `0x${string}`],
            })
          : Promise.resolve(0n),
        USDC_TOKEN_CONFIG
          ? publicClient.readContract({
              address: USDC_TOKEN_CONFIG.address,
              abi: ERC20_ABI,
              functionName: 'balanceOf',
              args: [smartWallet.address as `0x${string}`],
            })
          : Promise.resolve(0n),
        publicClient.readContract({
          address: PYUSD_TOKEN_CONFIG.address,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [
            metamaskWallet.address as `0x${string}`,
            smartWallet.address as `0x${string}`, // Check approval to smart wallet, not router
          ],
        }),
        USDC_TOKEN_CONFIG
          ? publicClient.readContract({
              address: USDC_TOKEN_CONFIG.address,
              abi: ERC20_ABI,
              functionName: 'allowance',
              args: [
                metamaskWallet.address as `0x${string}`,
                smartWallet.address as `0x${string}`, // Check approval to smart wallet, not router
              ],
            })
          : Promise.resolve(0n),
      ]);

      console.log('💰 Token balances fetched:');
      console.log('  MetaMask PYUSD:', (metamaskPYUSD as bigint).toString());
      console.log('  Smart Wallet PYUSD:', (smartWalletPYUSD as bigint).toString());
      console.log('  MetaMask USDC:', (metamaskUSDC as bigint).toString());
      console.log('  Smart Wallet USDC:', (smartWalletUSDC as bigint).toString());
      console.log('✅ Allowances fetched:');
      console.log('  PYUSD allowance:', (pyusdAllowance as bigint).toString());
      console.log('  USDC allowance:', (usdcAllowance as bigint).toString());

      const formatBalance = (balance: bigint, decimals: number) => {
        return (Number(balance) / 10 ** decimals).toFixed(2);
      };

      // Check for NFT positions
      let nftPositions = 0;
      try {
        const nftBalance = await publicClient.readContract({
          address: UNISWAP_V3_POSITION_MANAGER_ADDRESS,
          abi: UNISWAP_V3_POSITION_MANAGER_ABI,
          functionName: 'balanceOf',
          args: [smartWallet.address as `0x${string}`],
        });
        nftPositions = Number(nftBalance);
        console.log('🎯 NFT Positions found:', nftPositions);
      } catch (nftError) {
        console.log('No NFT positions found or error checking:', nftError);
      }

      setPoolData(prev => ({
        ...prev,
        userBalances: {
          metamaskPYUSD: formatBalance(
            metamaskPYUSD as bigint,
            PYUSD_TOKEN_CONFIG.decimals
          ),
          smartWalletPYUSD: formatBalance(
            smartWalletPYUSD as bigint,
            PYUSD_TOKEN_CONFIG.decimals
          ),
          metamaskUSDC: USDC_TOKEN_CONFIG
            ? formatBalance(metamaskUSDC as bigint, USDC_TOKEN_CONFIG.decimals)
            : '0',
          smartWalletUSDC: USDC_TOKEN_CONFIG
            ? formatBalance(
                smartWalletUSDC as bigint,
                USDC_TOKEN_CONFIG.decimals
              )
            : '0',
          poolTokens: nftPositions.toString(), // Number of NFT positions
        },
                  approvals: {
            pyusdApproved: (pyusdAllowance as bigint) > 0n,
            usdcApproved: (usdcAllowance as bigint) > 0n,
            smartWalletApproved: (pyusdAllowance as bigint) > 0n, // MetaMask → Smart Wallet approval
          },
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error checking pool data:', error);
      setPoolData(prev => ({
        ...prev,
        error: `Error checking pool data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isLoading: false,
      }));
    }
  };

  // Function to approve PYUSD tokens to smart wallet
  const approvePYUSDToSmartWallet = async () => {
    if (
      !client?.chain ||
      client.chain.id !== NETWORKS.SEPOLIA.id ||
      !PYUSD_TOKEN_CONFIG
    ) {
      setPoolData(prev => ({
        ...prev,
        error: 'Must be on Sepolia network with PYUSD token available',
      }));
      return;
    }

    if (!PYUSD_USDC_POOL) {
      setPoolData(prev => ({
        ...prev,
        error: 'PYUSD/USDC pool not available. The pool address needs to be configured.',
      }));
      return;
    }

    setPoolData(prev => ({
      ...prev,
      depositStatus: 'Approving tokens...',
      error: '',
    }));

    try {
      // Get MetaMask wallet
      const metamaskWallet = user?.linkedAccounts?.find(
        account =>
          account.type === 'wallet' && account.walletClientType !== 'privy'
      ) as { address: string } | undefined;

      if (!metamaskWallet) {
        setPoolData(prev => ({ ...prev, error: 'MetaMask wallet not found' }));
        return;
      }

      const metamaskWalletInList = wallets.find(
        w =>
          w.address.toLowerCase() === metamaskWallet.address.toLowerCase() &&
          w.walletClientType !== 'privy'
      );

      if (!metamaskWalletInList) {
        setPoolData(prev => ({
          ...prev,
          error: 'MetaMask wallet not found in wallet list',
        }));
        return;
      }

      const metamaskProvider = await metamaskWalletInList.getEthereumProvider();
      const { encodeFunctionData } = await import('viem');

      // Approve 100 PYUSD to smart wallet (with 6 decimals)
      const approveAmount = BigInt(100 * 10 ** PYUSD_TOKEN_CONFIG.decimals);

      // Approve PYUSD to smart wallet
      const pyusdData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [smartWallet!.address as `0x${string}`, approveAmount], // Approve to smart wallet
      });

      await metamaskProvider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: metamaskWallet.address,
            to: PYUSD_TOKEN_CONFIG.address,
            data: pyusdData,
          },
        ],
      });

              setPoolData(prev => ({
          ...prev,
          depositStatus: 'PYUSD approved to smart wallet successfully!',
        }));

      // Refresh pool data after approval
      setTimeout(() => checkPoolData(), 3000);
    } catch (error) {
      console.error('Error approving tokens:', error);
      setPoolData(prev => ({
        ...prev,
        depositStatus: 'Approval failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  };

    // Function to deposit into pool using real Uniswap V3 liquidity provision
  const depositIntoPool = async () => {
    if (
      !client?.chain ||
      client.chain.id !== NETWORKS.SEPOLIA.id ||
      !PYUSD_TOKEN_CONFIG ||
      !USDC_TOKEN_CONFIG ||
      !smartWallet
    ) {
      setPoolData(prev => ({
        ...prev,
        error: 'Must be on Sepolia network with smart wallet and both tokens available',
      }));
      return;
    }

    if (!PYUSD_USDC_POOL) {
      setPoolData(prev => ({
        ...prev,
        error: 'PYUSD/USDC pool not available. The pool address needs to be configured.',
      }));
      return;
    }

    const depositAmount = parseFloat(poolData.depositAmount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      setPoolData(prev => ({
        ...prev,
        error: 'Please enter a valid deposit amount',
      }));
      return;
    }

    setPoolData(prev => ({
      ...prev,
      depositStatus: 'Starting Uniswap V3 liquidity provision...',
      error: '',
    }));

    try {
      // Get MetaMask wallet
      const metamaskWallet = user?.linkedAccounts?.find(
        account =>
          account.type === 'wallet' && account.walletClientType !== 'privy'
      ) as { address: string } | undefined;

      if (!metamaskWallet) {
        setPoolData(prev => ({ ...prev, error: 'MetaMask wallet not found' }));
        return;
      }

      const { encodeFunctionData } = await import('viem');

      // Step 1: Transfer PYUSD from MetaMask to Smart Wallet
      const totalDepositAmount = BigInt(
        depositAmount * 10 ** PYUSD_TOKEN_CONFIG.decimals
      );

      setPoolData(prev => ({ ...prev, depositStatus: 'Step 1/5: Transferring PYUSD to smart wallet...' }));

      const transferFromData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'transferFrom',
        args: [
          metamaskWallet.address as `0x${string}`,
          smartWallet!.address as `0x${string}`,
          totalDepositAmount,
        ],
      });

      const transferTxHash = await client.sendTransaction({
        to: PYUSD_TOKEN_CONFIG.address,
        data: transferFromData,
      });

      console.log('✅ Step 1 completed - Transfer to smart wallet:', transferTxHash);

      // Step 2: Swap half PYUSD → USDC using Uniswap V3 Router
      const swapAmount = totalDepositAmount / 2n; // Half for swap
      let remainingPYUSD = totalDepositAmount - swapAmount; // Half to keep as PYUSD
      let swapSuccessful = false;

      setPoolData(prev => ({ ...prev, depositStatus: 'Step 2/5: Approving router to spend PYUSD...' }));

      // First approve router to spend PYUSD
      const approveRouterData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [UNISWAP_V3_ROUTER_ADDRESS, swapAmount],
      });

      const approveRouterTxHash = await client.sendTransaction({
        to: PYUSD_TOKEN_CONFIG.address,
        data: approveRouterData,
      });

      console.log('✅ Step 2a completed - Router approval:', approveRouterTxHash);

      // Wait a bit for the approval to be processed
      setPoolData(prev => ({ ...prev, depositStatus: 'Step 2/5: Verifying pool and performing swap...' }));
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds

      // Verify the pool exists and get basic info
      try {
        const { createPublicClient, http } = await import('viem');
        const { sepolia } = await import('viem/chains');

        const publicClient = createPublicClient({
          chain: sepolia,
          transport: http('https://ethereum-sepolia-rpc.publicnode.com'),
        });

        const poolContract = {
          address: PYUSD_USDC_POOL.address,
          abi: UNISWAP_V3_POOL_ABI,
        };

        const [token0Address, token1Address, poolFee] = await Promise.all([
          publicClient.readContract({
            ...poolContract,
            functionName: 'token0',
          }),
          publicClient.readContract({
            ...poolContract,
            functionName: 'token1',
          }),
          publicClient.readContract({
            ...poolContract,
            functionName: 'fee',
          }),
        ]);

        console.log('Pool verification:', {
          token0: token0Address,
          token1: token1Address,
          fee: poolFee,
          expectedFee: PYUSD_USDC_POOL.fee,
        });

        // Verify fee matches
        if (poolFee !== PYUSD_USDC_POOL.fee) {
          throw new Error(`Pool fee mismatch: expected ${PYUSD_USDC_POOL.fee}, got ${poolFee}`);
        }

      } catch (poolError) {
        console.error('Pool verification failed:', poolError);
        throw new Error(`Pool verification failed: ${poolError instanceof Error ? poolError.message : 'Unknown error'}`);
      }

      // Perform swap: PYUSD → USDC
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800); // 30 minutes from now

      // Log swap parameters for debugging
      const swapParams = {
        tokenIn: PYUSD_TOKEN_CONFIG.address,
        tokenOut: USDC_TOKEN_CONFIG.address,
        fee: PYUSD_USDC_POOL.fee,
        recipient: smartWallet!.address as `0x${string}`,
        deadline,
        amountIn: swapAmount,
        amountOutMinimum: 0n, // Accept any amount of USDC (in production, calculate proper slippage)
        sqrtPriceLimitX96: 0n,
      };

      console.log('Swap parameters:', {
        ...swapParams,
        amountIn: swapAmount.toString(),
        deadline: deadline.toString(),
        router: UNISWAP_V3_ROUTER_ADDRESS,
      });

      const swapData = encodeFunctionData({
        abi: UNISWAP_V3_ROUTER_ABI,
        functionName: 'exactInputSingle',
        args: [swapParams],
      });

      console.log('Swap call data:', swapData);

      try {
        const swapTxHash = await client.sendTransaction({
          to: UNISWAP_V3_ROUTER_ADDRESS,
          data: swapData,
          // Add gas limit for complex transactions
          gas: 500000n,
        });

                 console.log('✅ Step 2b completed - PYUSD → USDC swap:', swapTxHash);
         swapSuccessful = true;
       } catch (swapError) {
         console.error('Swap failed:', swapError);

         // If swap fails, we'll continue with just PYUSD (no swap)
         setPoolData(prev => ({
           ...prev,
           depositStatus: '⚠️ Swap failed - continuing with PYUSD only. This might be due to insufficient pool liquidity on Sepolia testnet.'
         }));

         // Set remaining PYUSD to the full amount since swap failed
         remainingPYUSD = totalDepositAmount;
         swapSuccessful = false;

         // Continue to step 3 with just PYUSD
         console.log('Continuing with PYUSD only due to swap failure');
       }

      // Step 3: Approve Position Manager to spend both tokens
      setPoolData(prev => ({ ...prev, depositStatus: 'Step 3/5: Approving tokens for Position Manager...' }));

      // Approve PYUSD
      const approvePYUSDData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [UNISWAP_V3_POSITION_MANAGER_ADDRESS, remainingPYUSD],
      });

      await client.sendTransaction({
        to: PYUSD_TOKEN_CONFIG.address,
        data: approvePYUSDData,
      });

      // Set up USDC amount for position creation
      let largeUSDCAmount = 0n;
      if (swapSuccessful && USDC_TOKEN_CONFIG) {
        largeUSDCAmount = BigInt(depositAmount * 10 ** USDC_TOKEN_CONFIG.decimals);
        const approveUSDCData = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [UNISWAP_V3_POSITION_MANAGER_ADDRESS, largeUSDCAmount],
        });

        await client.sendTransaction({
          to: USDC_TOKEN_CONFIG.address,
          data: approveUSDCData,
        });
      }

      console.log('✅ Step 3 completed - Tokens approved for Position Manager');

      // Step 4: Create liquidity position using Position Manager
      if (!swapSuccessful) {
        setPoolData(prev => ({
          ...prev,
          depositStatus: '⚠️ Skipping Uniswap V3 position creation due to swap failure. PYUSD remains in smart wallet.',
          depositHash: '',
        }));

        // Refresh balances and exit
        setTimeout(() => {
          checkPoolData();
          checkTokenBalances();
        }, 2000);
        return;
      }

      setPoolData(prev => ({ ...prev, depositStatus: 'Step 4/5: Creating Uniswap V3 liquidity position...' }));

      // Use full range for simplicity (in production, you'd let user choose price ranges)
      const tickLower = -887270; // Full range lower tick
      const tickUpper = 887270;  // Full range upper tick

      // Determine token order (Uniswap requires token0 < token1 by address)
      const token0 = PYUSD_TOKEN_CONFIG.address.toLowerCase() < USDC_TOKEN_CONFIG!.address.toLowerCase()
        ? PYUSD_TOKEN_CONFIG.address : USDC_TOKEN_CONFIG!.address;
      const token1 = PYUSD_TOKEN_CONFIG.address.toLowerCase() < USDC_TOKEN_CONFIG!.address.toLowerCase()
        ? USDC_TOKEN_CONFIG!.address : PYUSD_TOKEN_CONFIG.address;

      const amount0Desired = token0 === PYUSD_TOKEN_CONFIG.address ? remainingPYUSD : largeUSDCAmount;
      const amount1Desired = token1 === PYUSD_TOKEN_CONFIG.address ? remainingPYUSD : largeUSDCAmount;

      const mintData = encodeFunctionData({
        abi: UNISWAP_V3_POSITION_MANAGER_ABI,
        functionName: 'mint',
        args: [
          {
            token0: token0 as `0x${string}`,
            token1: token1 as `0x${string}`,
            fee: PYUSD_USDC_POOL.fee,
            tickLower,
            tickUpper,
            amount0Desired,
            amount1Desired,
            amount0Min: 0n, // Accept any amount (in production, calculate proper slippage)
            amount1Min: 0n,
            recipient: smartWallet!.address as `0x${string}`,
            deadline,
          },
        ],
      });

      const mintTxHash = await client.sendTransaction({
        to: UNISWAP_V3_POSITION_MANAGER_ADDRESS,
        data: mintData,
      });

      console.log('✅ Step 4 completed - Liquidity position created:', mintTxHash);

      setPoolData(prev => ({
        ...prev,
        depositStatus: '🎉 Success! Uniswap V3 liquidity position created. You now have an NFT representing your position!',
        depositHash: mintTxHash,
      }));

      // Refresh balances after deposit
      setTimeout(() => {
        checkPoolData();
        checkTokenBalances();
      }, 5000);

    } catch (error) {
      console.error('Error in Uniswap V3 liquidity provision:', error);
      setPoolData(prev => ({
        ...prev,
        depositStatus: 'Liquidity provision failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
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
          {smartWallet &&
            client?.chain?.id === NETWORKS.SEPOLIA.id &&
            PYUSD_TOKEN_CONFIG && (
              <div className='mt-6 rounded-lg border border-gray-200 bg-white p-4'>
                <h3 className='mb-3 text-lg font-semibold text-gray-800'>
                  🪙 PYUSD Token Testing (Sepolia)
                </h3>

                <div className='space-y-4'>
                  {/* Token Info */}
                  <div className='rounded bg-gray-50 p-3 text-sm text-gray-600'>
                    <p>
                      <strong>Token:</strong> PYUSD (
                      {PYUSD_TOKEN_CONFIG?.address ||
                        'Not available on this network'}
                      )
                    </p>
                    <p>
                      <strong>Test Flow:</strong> Approve Smart Wallet →
                      Transfer with Smart Wallet
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



          {/* Pool Deposit Section */}
          {smartWallet &&
            client?.chain?.id === NETWORKS.SEPOLIA.id &&
            PYUSD_USDC_POOL && (
              <div className='mt-6 rounded-lg border border-gray-200 bg-white p-4'>
                <h3 className='mb-3 text-lg font-semibold text-gray-800'>
                  🏊 PYUSD/USDC Pool Deposit (Sepolia)
                </h3>

                <div className='space-y-4'>
                  {/* Pool Info */}
                  <div className='rounded bg-gray-50 p-3 text-sm text-gray-600'>
                    <p>
                      <strong>Pool:</strong> {PYUSD_USDC_POOL.name} (
                      {PYUSD_USDC_POOL.address})
                    </p>
                    <p>
                      <strong>Fee Tier:</strong> {PYUSD_USDC_POOL.fee / 100}%
                    </p>
                  </div>

                  {/* Real Uniswap V3 Implementation */}
                  <div className='rounded border border-green-200 bg-green-50 p-4'>
                    <h4 className='mb-2 font-medium text-green-800'>
                      🎉 Real Uniswap V3 Liquidity Provision
                    </h4>
                    <div className='space-y-2 text-sm text-green-700'>
                      <p>
                        <strong>Full Implementation:</strong> This creates actual Uniswap V3 liquidity positions!
                      </p>
                      <p>
                        <strong>What Happens:</strong>
                      </p>
                      <ul className='ml-4 list-disc space-y-1'>
                        <li>✅ Transfers PYUSD from MetaMask → Smart Wallet</li>
                        <li>✅ Swaps half PYUSD → USDC via Uniswap V3 Router</li>
                        <li>✅ Creates liquidity position using Position Manager</li>
                        <li>✅ Mints NFT representing your liquidity position</li>
                        <li>✅ Start earning fees on your liquidity!</li>
                      </ul>
                      <p>
                        <strong>Result:</strong> You&apos;ll receive an NFT token representing your liquidity position and start earning trading fees.
                      </p>
                    </div>
                  </div>

                  {/* Check Pool Data */}
                  <div>
                    <button
                      type='button'
                      onClick={checkPoolData}
                      disabled={poolData.isLoading}
                      className='rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-400'
                    >
                      {poolData.isLoading ? 'Loading...' : 'Check Pool Data'}
                    </button>
                  </div>

                  {/* User Balances */}
                  {poolData.userBalances && (
                    <div className='rounded border bg-gray-50 p-4'>
                      <h4 className='mb-3 font-medium text-gray-800'>
                        💰 Your Balances:
                      </h4>
                      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                        <div className='space-y-1'>
                          <p className='text-sm font-medium text-gray-700'>
                            MetaMask Wallet:
                          </p>
                          <p className='text-sm text-gray-600'>
                            PYUSD:{' '}
                            <span className='font-medium text-green-600'>
                              {poolData.userBalances.metamaskPYUSD}
                            </span>
                          </p>
                          <p className='text-sm text-gray-600'>
                            USDC:{' '}
                            <span className='font-medium text-blue-600'>
                              {poolData.userBalances.metamaskUSDC}
                            </span>
                          </p>
                        </div>
                        <div className='space-y-1'>
                          <p className='text-sm font-medium text-gray-700'>
                            Smart Wallet:
                          </p>
                          <p className='text-sm text-gray-600'>
                            PYUSD:{' '}
                            <span className='font-medium text-green-600'>
                              {poolData.userBalances.smartWalletPYUSD}
                            </span>
                          </p>
                          <p className='text-sm text-gray-600'>
                            USDC:{' '}
                            <span className='font-medium text-blue-600'>
                              {poolData.userBalances.smartWalletUSDC}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className='mt-3 border-t pt-3'>
                        <p className='text-sm text-gray-700'>
                          Uniswap V3 NFT Positions:{' '}
                          <span className='font-medium text-purple-600'>
                            {poolData.userBalances.poolTokens} {poolData.userBalances.poolTokens === '1' ? 'position' : 'positions'}
                          </span>
                          {poolData.userBalances.poolTokens !== '0' && (
                            <span className='ml-2 text-xs text-green-600'>🎉 Earning fees!</span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Approval Status */}
                  {poolData.approvals && (
                    <div className='rounded border bg-gray-50 p-4'>
                      <h4 className='mb-3 font-medium text-gray-800'>
                        ✅ Approval Status:
                      </h4>
                      <div className='space-y-2 text-sm'>
                        <p className='flex items-center'>
                          <span
                            className={`mr-2 ${poolData.approvals.smartWalletApproved ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {poolData.approvals.smartWalletApproved ? '✅' : '❌'}
                          </span>
                          MetaMask → Smart Wallet PYUSD approval
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Approve PYUSD to Smart Wallet */}
                  {poolData.approvals && !poolData.approvals.smartWalletApproved && (
                    <div className='border-t border-gray-200 pt-4'>
                      <h4 className='mb-2 font-medium text-gray-800'>
                        Step 1: Approve PYUSD to Smart Wallet
                      </h4>
                      <p className='mb-3 text-sm text-gray-600'>
                        Allow your smart wallet to spend PYUSD tokens from your MetaMask wallet for pool deposits
                      </p>
                      <button
                        type='button'
                        onClick={approvePYUSDToSmartWallet}
                        disabled={
                          !client || client.chain?.id !== NETWORKS.SEPOLIA.id
                        }
                        className='rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:bg-gray-400'
                      >
                        Approve PYUSD tokens to smart wallet
                      </button>
                    </div>
                  )}

                  {/* Deposit Section */}
                  {poolData.approvals?.smartWalletApproved && (
                    <div className='border-t border-gray-200 pt-4'>
                      <h4 className='mb-2 font-medium text-gray-800'>
                        Step 2: Provide Liquidity to Uniswap V3 Pool
                      </h4>
                      <div className='mb-3 rounded border border-blue-200 bg-blue-50 p-3'>
                        <p className='text-sm text-blue-800'>
                          <strong>🚀 Real Implementation:</strong> This will create an actual Uniswap V3 liquidity position.
                          You&apos;ll receive an NFT representing your position and start earning trading fees.
                        </p>
                      </div>
                      <p className='mb-3 text-sm text-gray-600'>
                        Enter the amount of PYUSD to provide as liquidity. Half will be swapped to USDC, then both tokens will be deposited into the Uniswap V3 pool.
                      </p>

                      <div className='mb-4 flex items-center space-x-3'>
                        <input
                          type='number'
                          value={poolData.depositAmount}
                          onChange={e =>
                            setPoolData(prev => ({
                              ...prev,
                              depositAmount: e.target.value,
                            }))
                          }
                          placeholder='Enter amount (e.g., 5)'
                          className='rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none'
                          min='0'
                          step='0.01'
                        />
                        <span className='text-sm text-gray-600'>PYUSD</span>
                      </div>

                                              <button
                          type='button'
                          onClick={depositIntoPool}
                          disabled={
                            !client ||
                            client.chain?.id !== NETWORKS.SEPOLIA.id ||
                            !poolData.depositAmount ||
                            parseFloat(poolData.depositAmount) <= 0
                          }
                          className='rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:bg-gray-400'
                        >
                          🚀 Create Uniswap V3 Position
                        </button>
                    </div>
                  )}

                  {/* Status Messages */}
                  {poolData.depositStatus && (
                    <div className='rounded border bg-gray-50 p-3'>
                      <p
                        className={`text-sm font-medium ${
                          poolData.depositStatus.includes('successful')
                            ? 'text-green-600'
                            : poolData.depositStatus.includes('failed')
                              ? 'text-red-600'
                              : 'text-yellow-600'
                        }`}
                      >
                        {poolData.depositStatus}
                      </p>
                      {poolData.depositHash && (
                        <div className='mt-2'>
                          <p className='text-xs text-gray-500'>
                            Transaction Hash:
                            <a
                              href={`https://sepolia.etherscan.io/tx/${poolData.depositHash}`}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='ml-1 font-mono text-blue-600 underline hover:text-blue-800'
                            >
                              {poolData.depositHash}
                            </a>
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error Display */}
                  {poolData.error && (
                    <div className='rounded border border-red-200 bg-red-50 p-3'>
                      <p className='text-sm text-red-600'>
                        <strong>Error:</strong> {poolData.error}
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
