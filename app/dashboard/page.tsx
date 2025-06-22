"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAccessToken, usePrivy, useWallets } from "@privy-io/react-auth";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import WalletList from "../../components/WalletList";

async function verifyToken() {
  const url = "/api/verify";
  const accessToken = await getAccessToken();
  const result = await fetch(url, {
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined),
    },
  });

  return await result.json();
}

export default function DashboardPage() {
  const [verifyResult, setVerifyResult] = useState();
  const [smartWalletDeploymentStatus, setSmartWalletDeploymentStatus] = useState<{ isDeployed: boolean; isChecking: boolean }>({ isDeployed: false, isChecking: false });
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
    balances?: { metamask: string; smartWallet: string; };
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
      router.push("/");
    }
  }, [ready, authenticated, router]);

  const numAccounts = user?.linkedAccounts?.length || 0;
  const canRemoveAccount = numAccounts > 1;

  const email = user?.email;
  const phone = user?.phone;
  const wallet = user?.wallet;

  // Find smart wallet from linked accounts
  const smartWallet = user?.linkedAccounts?.find(
    (account) => account.type === 'smart_wallet'
  ) as { type: 'smart_wallet'; address: string; smartWalletType?: string } | undefined;

  const googleSubject = user?.google?.subject || null;
  const twitterSubject = user?.twitter?.subject || null;
  const discordSubject = user?.discord?.subject || null;

  // Available networks for switching
  const availableNetworks = [
    { id: 1, name: 'Ethereum Mainnet', rpcUrl: 'https://cloudflare-eth.com' },
    { id: 11155111, name: 'Sepolia Testnet', rpcUrl: 'https://rpc.sepolia.org' },
    { id: 8453, name: 'Base', rpcUrl: 'https://mainnet.base.org' },
    { id: 84532, name: 'Base Sepolia', rpcUrl: 'https://sepolia.base.org' }
  ];

  // PYUSD Token Configuration (Sepolia)
  const PYUSD_TOKEN_CONFIG = {
    address: '0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9' as const,
    decimals: 6,
    symbol: 'PYUSD'
  };

  // ERC20 ABI for approve and transfer functions
  const ERC20_ABI = [
    {
      constant: true,
      inputs: [{ name: '_owner', type: 'address' }],
      name: 'balanceOf',
      outputs: [{ name: 'balance', type: 'uint256' }],
      type: 'function'
    },
    {
      constant: false,
      inputs: [
        { name: '_spender', type: 'address' },
        { name: '_value', type: 'uint256' }
      ],
      name: 'approve',
      outputs: [{ name: '', type: 'bool' }],
      type: 'function'
    },
    {
      constant: false,
      inputs: [
        { name: '_to', type: 'address' },
        { name: '_value', type: 'uint256' }
      ],
      name: 'transfer',
      outputs: [{ name: '', type: 'bool' }],
      type: 'function'
    },
    {
      constant: false,
      inputs: [
        { name: '_from', type: 'address' },
        { name: '_to', type: 'address' },
        { name: '_value', type: 'uint256' }
      ],
      name: 'transferFrom',
      outputs: [{ name: '', type: 'bool' }],
      type: 'function'
    },
    {
      constant: true,
      inputs: [
        { name: '_owner', type: 'address' },
        { name: '_spender', type: 'address' }
      ],
      name: 'allowance',
      outputs: [{ name: '', type: 'uint256' }],
      type: 'function'
    }
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
        transport: http()
      });
      
      // Check if there's code at the smart wallet address
      const code = await publicClient.getBytecode({ 
        address: smartWallet.address as `0x${string}` 
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
        message
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
          signature: signature as `0x${string}`
        });
        
        if (isSmartWalletSigner) {
          verificationDetails = '✅ Signature verified against smart wallet address';
        } else {
          // If direct verification fails, try to recover the address
          recoveredAddress = await recoverMessageAddress({
            message,
            signature: signature as `0x${string}`
          });
          
          if (recoveredAddress.toLowerCase() === smartWallet.address.toLowerCase()) {
            isSmartWalletSigner = true;
            verificationDetails = '✅ Recovered address matches smart wallet';
          } else {
            verificationDetails = `⚠️ Signature from different address: ${recoveredAddress}`;
            
            // Check if it's the embedded wallet
            const embeddedWallet = user?.linkedAccounts?.find(
              (account) => account.type === 'wallet' && account.walletClientType === 'privy'
            ) as { address: string } | undefined;
            
            if (embeddedWallet && recoveredAddress.toLowerCase() === embeddedWallet.address.toLowerCase()) {
              verificationDetails += ' (This is your embedded wallet - not the smart wallet!)';
            }
          }
        }
      } catch (verifyError) {
        // Fallback: just recover the address
        try {
          recoveredAddress = await recoverMessageAddress({
            message,
            signature: signature as `0x${string}`
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
        verificationDetails
      });
    } catch (error) {
      console.error('Error testing smart wallet:', error);
      setTestResults({ 
        message: '', 
        signature: '', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };

  // Function to check token balances
  const checkTokenBalances = async () => {
    if (!client?.chain || client.chain.id !== 11155111 || !smartWallet) {
      console.log('Must be on Sepolia network with smart wallet');
      setTokenTestResults({ error: 'Must be on Sepolia network with smart wallet' });
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
        'https://rpc2.sepolia.org'
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
              retryCount: 2
            })
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
        (account) => account.type === 'wallet' && account.walletClientType !== 'privy'
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
          address: PYUSD_TOKEN_CONFIG.address
        });
        
        if (!contractCode || contractCode === '0x') {
          throw new Error(`Token contract not found at ${PYUSD_TOKEN_CONFIG.address} on Sepolia`);
        }
        console.log('Contract verified - bytecode found');
      } catch (contractError) {
        console.error('Contract verification failed:', contractError);
        setTokenTestResults({ 
          error: `Token contract verification failed: ${contractError instanceof Error ? contractError.message : 'Unknown error'}` 
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
          args: [metamaskWallet.address as `0x${string}`]
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
          args: [smartWallet.address as `0x${string}`]
        });
        console.log('Smart Wallet balance:', smartWalletBalance);
      } catch (swError) {
        console.error('Smart Wallet balance check failed:', swError);
        smartWalletBalance = 0n;
      }

      const formatBalance = (balance: bigint) => {
        return (Number(balance) / (10 ** PYUSD_TOKEN_CONFIG.decimals)).toFixed(2);
      };

      setTokenTestResults(prev => ({
        ...prev,
        balances: {
          metamask: formatBalance(metamaskBalance as bigint),
          smartWallet: formatBalance(smartWalletBalance as bigint)
        }
      }));
      
      console.log('Balance check completed successfully');
    } catch (error) {
      console.error('Error checking balances:', error);
      setTokenTestResults({ 
        error: `Error checking balances: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  // Function to approve smart wallet to spend PYUSD from MetaMask
  const approveSmartWallet = async () => {
    if (!client?.chain || client.chain.id !== 11155111 || !smartWallet) {
      setTokenTestResults({ error: 'Must be on Sepolia network with smart wallet' });
      return;
    }

    setTokenTestResults({ approveStatus: 'Requesting approval...', error: '' });

    try {
      // Get MetaMask wallet address to ensure we're approving from the right wallet
      const metamaskWallet = user?.linkedAccounts?.find(
        (account) => account.type === 'wallet' && account.walletClientType !== 'privy'
      ) as { address: string } | undefined;

      if (!metamaskWallet) {
        setTokenTestResults({ error: 'MetaMask wallet not found' });
        return;
      }

      console.log('Approving from MetaMask wallet:', metamaskWallet.address);
      console.log('Approving smart wallet to spend:', smartWallet.address);

      // Switch to the MetaMask wallet first, then send the approval transaction
      const metamaskWalletInList = wallets.find(w => 
        w.address.toLowerCase() === metamaskWallet.address.toLowerCase() &&
        w.walletClientType !== 'privy'
      );

      if (!metamaskWalletInList) {
        setTokenTestResults({ error: 'MetaMask wallet not found in wallet list' });
        return;
      }

      // Get the MetaMask wallet's provider directly
      const metamaskProvider = await metamaskWalletInList.getEthereumProvider();
      
      // Check if MetaMask is on Sepolia network (chainId 11155111 = 0xaa36a7 in hex)
      const currentChainId = await metamaskProvider.request({ method: 'eth_chainId' });
      const sepoliaChainId = '0xaa36a7'; // 11155111 in hex
      
      if (currentChainId !== sepoliaChainId) {
        setTokenTestResults({ approveStatus: 'Switching MetaMask to Sepolia...', error: '' });
        
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
                params: [{
                  chainId: sepoliaChainId,
                  chainName: 'Sepolia Testnet',
                  nativeCurrency: {
                    name: 'Sepolia ETH',
                    symbol: 'SEP',
                    decimals: 18,
                  },
                  rpcUrls: ['https://rpc.sepolia.org'],
                  blockExplorerUrls: ['https://sepolia.etherscan.io'],
                }],
              });
            } catch (addError) {
              setTokenTestResults({ error: 'Failed to add Sepolia network to MetaMask' });
              return;
            }
          } else {
            setTokenTestResults({ error: 'Failed to switch MetaMask to Sepolia network' });
            return;
          }
        }
      }
      
      setTokenTestResults({ approveStatus: 'Preparing approval transaction...', error: '' });
      
      const { encodeFunctionData } = await import('viem');

      // Approve 100 PYUSD (with 6 decimals)
      const approveAmount = BigInt(100 * (10 ** PYUSD_TOKEN_CONFIG.decimals));
      
      const data = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [smartWallet.address as `0x${string}`, approveAmount]
      });

      // Send transaction directly through MetaMask provider
      const txHash = await metamaskProvider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: metamaskWallet.address,
          to: PYUSD_TOKEN_CONFIG.address,
          data,
        }]
      });

      setTokenTestResults({
        approveStatus: 'Approval successful!',
        approveHash: txHash,
        error: ''
      });

      // Refresh balances after approval
      setTimeout(() => {
        checkTokenBalances();
      }, 2000);
    } catch (error) {
      console.error('Error approving:', error);
      setTokenTestResults({ 
        approveStatus: 'Approval failed',
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };

  // Function to transfer PYUSD using smart wallet
  const transferWithSmartWallet = async () => {
    if (!client?.chain || client.chain.id !== 11155111 || !smartWallet) {
      setTokenTestResults({ error: 'Must be on Sepolia network with smart wallet' });
      return;
    }

    setTokenTestResults({ ...tokenTestResults, transferStatus: 'Preparing transfer...', error: '' });

    try {
      const { encodeFunctionData } = await import('viem');

      // zakhap.eth resolved address
      const recipientAddress = '0x92811c982c63d3aff70c6c7546a3f6bde1d6d861';
      
      // Get MetaMask wallet address
      const metamaskWallet = user?.linkedAccounts?.find(
        (account) => account.type === 'wallet' && account.walletClientType !== 'privy'
      ) as { address: string } | undefined;

      if (!metamaskWallet) {
        setTokenTestResults({ error: 'MetaMask wallet not found' });
        return;
      }

      // Transfer 1 PYUSD (with 6 decimals)
      const transferAmount = BigInt(1 * (10 ** PYUSD_TOKEN_CONFIG.decimals));
      
      const data = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'transferFrom',
        args: [
          metamaskWallet.address as `0x${string}`,
          recipientAddress as `0x${string}`,
          transferAmount
        ]
      });

      setTokenTestResults({ ...tokenTestResults, transferStatus: 'Executing transfer with smart wallet...', error: '' });

      // This will be signed by the smart wallet
      const txHash = await client.sendTransaction({
        to: PYUSD_TOKEN_CONFIG.address,
        data,
        value: 0n
      });

      setTokenTestResults({
        ...tokenTestResults,
        transferStatus: 'Transfer successful!',
        transferHash: txHash,
        error: ''
      });

      // Refresh balances after transfer
      setTimeout(() => checkTokenBalances(), 2000);
    } catch (error) {
      console.error('Error transferring:', error);
      setTokenTestResults({ 
        ...tokenTestResults,
        transferStatus: 'Transfer failed',
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };

  return (
    <main className="flex flex-col min-h-screen px-4 sm:px-20 py-6 sm:py-10 bg-privy-light-blue">
      {ready && authenticated ? (
        <>
          <div className="flex flex-row justify-between">
            <h1 className="text-2xl font-semibold">Privy Auth Demo</h1>
            <button
              onClick={logout}
              className="text-sm bg-violet-200 hover:text-violet-900 py-2 px-4 rounded-md text-violet-700"
            >
              Logout
            </button>
          </div>
          <div className="mt-12 flex gap-4 flex-wrap">
            {googleSubject ? (
              <button
                onClick={() => {
                  unlinkGoogle(googleSubject);
                }}
                className="text-sm border border-violet-600 hover:border-violet-700 py-2 px-4 rounded-md text-violet-600 hover:text-violet-700 disabled:border-gray-500 disabled:text-gray-500 hover:disabled:text-gray-500"
                disabled={!canRemoveAccount}
              >
                Unlink Google
              </button>
            ) : (
              <button
                onClick={() => {
                  linkGoogle();
                }}
                className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white"
              >
                Link Google
              </button>
            )}

            {twitterSubject ? (
              <button
                onClick={() => {
                  unlinkTwitter(twitterSubject);
                }}
                className="text-sm border border-violet-600 hover:border-violet-700 py-2 px-4 rounded-md text-violet-600 hover:text-violet-700 disabled:border-gray-500 disabled:text-gray-500 hover:disabled:text-gray-500"
                disabled={!canRemoveAccount}
              >
                Unlink Twitter
              </button>
            ) : (
              <button
                className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white"
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
                className="text-sm border border-violet-600 hover:border-violet-700 py-2 px-4 rounded-md text-violet-600 hover:text-violet-700 disabled:border-gray-500 disabled:text-gray-500 hover:disabled:text-gray-500"
                disabled={!canRemoveAccount}
              >
                Unlink Discord
              </button>
            ) : (
              <button
                className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white"
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
                className="text-sm border border-violet-600 hover:border-violet-700 py-2 px-4 rounded-md text-violet-600 hover:text-violet-700 disabled:border-gray-500 disabled:text-gray-500 hover:disabled:text-gray-500"
                disabled={!canRemoveAccount}
              >
                Unlink email
              </button>
            ) : (
              <button
                onClick={linkEmail}
                className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white"
              >
                Connect email
              </button>
            )}
            {wallet ? (
              <button
                onClick={() => {
                  unlinkWallet(wallet.address);
                }}
                className="text-sm border border-violet-600 hover:border-violet-700 py-2 px-4 rounded-md text-violet-600 hover:text-violet-700 disabled:border-gray-500 disabled:text-gray-500 hover:disabled:text-gray-500"
                disabled={!canRemoveAccount}
              >
                Unlink wallet
              </button>
            ) : (
              <button
                onClick={linkWallet}
                className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
              >
                Connect wallet
              </button>
            )}
            {phone ? (
              <button
                onClick={() => {
                  unlinkPhone(phone.number);
                }}
                className="text-sm border border-violet-600 hover:border-violet-700 py-2 px-4 rounded-md text-violet-600 hover:text-violet-700 disabled:border-gray-500 disabled:text-gray-500 hover:disabled:text-gray-500"
                disabled={!canRemoveAccount}
              >
                Unlink phone
              </button>
            ) : (
              <button
                onClick={linkPhone}
                className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
              >
                Connect phone
              </button>
            )}

            <button
              onClick={() => verifyToken().then(setVerifyResult)}
              className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
            >
              Verify token on server
            </button>

            {Boolean(verifyResult) && (
              <details className="w-full">
                <summary className="mt-6 font-bold uppercase text-sm text-gray-600">
                  Server verify result
                </summary>
                <pre className="max-w-4xl bg-slate-700 text-slate-50 font-mono p-4 text-xs sm:text-sm rounded-md mt-2">
                  {JSON.stringify(verifyResult, null, 2)}
                </pre>
              </details>
            )}
          </div>

          {/* Smart Wallet Section */}
          {smartWallet && (
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <h2 className="text-xl font-bold text-blue-900 mb-4">Your Smart Wallet</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-blue-700 mb-1">
                    Smart Wallet Address {smartWallet.smartWalletType ? `(${smartWallet.smartWalletType})` : ''}:
                  </p>
                  <p className="font-mono text-sm bg-white p-3 rounded border text-gray-800 break-all">
                    {smartWallet.address}
                  </p>
                </div>

                {/* Deployment Status */}
                <div className="bg-white p-3 rounded border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-blue-700">Deployment Status:</p>
                    <button
                      type="button"
                      onClick={checkSmartWalletDeployment}
                      disabled={smartWalletDeploymentStatus.isChecking}
                      className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-white disabled:bg-blue-400"
                    >
                      {smartWalletDeploymentStatus.isChecking ? 'Checking...' : 'Check Status'}
                    </button>
                  </div>
                  <div className="text-sm">
                    {smartWalletDeploymentStatus.isChecking ? (
                      <p className="text-yellow-600">🔄 Checking deployment status...</p>
                    ) : smartWalletDeploymentStatus.isDeployed ? (
                      <p className="text-green-600">✅ Smart wallet is deployed on-chain</p>
                    ) : (
                      <div className="text-yellow-600">
                        <p>⏳ Smart wallet not yet deployed</p>
                        <p className="text-xs mt-1">Will be deployed on your first transaction</p>
                      </div>
                    )}
                  </div>
                </div>

                {client?.chain && (
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm font-medium text-blue-700 mb-2">Network Information:</p>
                    <div className="space-y-1 text-sm text-gray-700">
                      <p><span className="font-medium">Chain:</span> {client.chain.name}</p>
                      <p><span className="font-medium">Chain ID:</span> {client.chain.id}</p>
                      <p><span className="font-medium">Native Currency:</span> {client.chain.nativeCurrency?.symbol || 'ETH'}</p>
                      {client.chain.id === 1 && (
                        <p className="text-xs text-blue-600 mt-2">
                          🔗 <a 
                            href={`https://etherscan.io/address/${smartWallet.address}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="underline hover:text-blue-800"
                          >
                            View on Etherscan
                          </a>
                        </p>
                      )}
                      {client.chain.id === 11155111 && (
                        <p className="text-xs text-blue-600 mt-2">
                          🔗 <a 
                            href={`https://sepolia.etherscan.io/address/${smartWallet.address}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="underline hover:text-blue-800"
                          >
                            View on Sepolia Etherscan
                          </a>
                        </p>
                      )}
                      {client.chain.id === 8453 && (
                        <p className="text-xs text-blue-600 mt-2">
                          🔗 <a 
                            href={`https://basescan.org/address/${smartWallet.address}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="underline hover:text-blue-800"
                          >
                            View on BaseScan
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <div className="text-sm text-blue-600">
                  <p>✅ Gas sponsorship enabled</p>
                  <p>✅ Batch transactions supported</p>
                  <p>✅ EVM compatible</p>
                </div>
              </div>
            </div>
          )}

          {/* Network Switching Section */}
          {client && (
            <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Network Controls</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Current Network: <span className="text-blue-600">{client.chain?.name || 'Unknown'} (ID: {client.chain?.id})</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Switch Network:</p>
                  <div className="flex flex-wrap gap-2">
                    {availableNetworks.map((network) => (
                      <button
                        key={network.id}
                        type="button"
                        onClick={() => switchNetwork(network.id)}
                        disabled={isNetworkSwitching || client.chain?.id === network.id}
                        className={`text-sm px-3 py-2 rounded-md border transition-colors ${
                          client.chain?.id === network.id
                            ? 'bg-blue-100 border-blue-300 text-blue-700 cursor-not-allowed'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
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
            <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Smart Wallet Testing</h3>
              <div className="space-y-4">
                <div>
                  <button
                    type="button"
                    onClick={testSmartWallet}
                    disabled={testResults.message === 'Testing...'}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:bg-green-400 disabled:cursor-not-allowed"
                  >
                    {testResults.message === 'Testing...' ? 'Testing...' : '🧪 Test Smart Wallet (Sign Message)'}
                  </button>
                  <p className="text-xs text-gray-500 mt-1">
                    This will sign a message using your smart wallet to verify it's working
                  </p>
                </div>

                {/* Test Results */}
                {(testResults.message || testResults.error) && (
                  <div className="bg-gray-50 p-3 rounded border">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Test Results:</h4>
                    
                    {testResults.error ? (
                      <div className="text-red-600 text-sm">
                        <p className="font-medium">❌ Error:</p>
                        <p className="mt-1">{testResults.error}</p>
                      </div>
                    ) : testResults.signature ? (
                      <div className="text-sm space-y-3">
                        {/* Verification Status */}
                        <div className={`p-3 rounded border ${
                          testResults.isSmartWalletSigner 
                            ? 'bg-green-50 border-green-200 text-green-800' 
                            : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                        }`}>
                          <p className="font-medium">
                            {testResults.isSmartWalletSigner ? '✅ Smart Wallet Verified!' : '⚠️ Verification Warning'}
                          </p>
                          <p className="text-sm mt-1">{testResults.verificationDetails}</p>
                          {testResults.signerAddress && (
                            <div className="mt-2">
                              <p className="text-xs font-medium">Signer Address:</p>
                              <p className="font-mono text-xs break-all">{testResults.signerAddress}</p>
                            </div>
                          )}
                        </div>

                        {/* Message and Signature Details */}
                        <div className="space-y-2">
                          <div>
                            <p className="font-medium text-gray-700">Message:</p>
                            <p className="font-mono text-xs bg-white p-2 rounded border break-all">{testResults.message}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Signature:</p>
                            <p className="font-mono text-xs bg-white p-2 rounded border break-all">{testResults.signature}</p>
                          </div>
                        </div>

                        {/* Address Comparison */}
                        <div className="bg-gray-50 p-3 rounded border">
                          <p className="font-medium text-gray-700 text-xs mb-2">Address Comparison:</p>
                          <div className="space-y-1 text-xs">
                            <div>
                              <span className="font-medium">Smart Wallet:</span>
                              <span className="font-mono ml-2">{smartWallet?.address}</span>
                            </div>
                            {testResults.signerAddress && (
                              <div>
                                <span className="font-medium">Signature From:</span>
                                <span className="font-mono ml-2">{testResults.signerAddress}</span>
                                <span className={`ml-2 ${
                                  testResults.signerAddress.toLowerCase() === smartWallet?.address.toLowerCase() 
                                    ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {testResults.signerAddress.toLowerCase() === smartWallet?.address.toLowerCase() ? '✅ Match' : '❌ Different'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : testResults.message === 'Testing...' ? (
                      <div className="text-yellow-600 text-sm">
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
            <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">🪙 PYUSD Token Testing (Sepolia)</h3>
              
              <div className="space-y-4">
                {/* Token Info */}
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  <p><strong>Token:</strong> PYUSD ({PYUSD_TOKEN_CONFIG.address})</p>
                  <p><strong>Test Flow:</strong> Approve Smart Wallet → Transfer with Smart Wallet</p>
                </div>

                {/* Check Balances */}
                <div>
                  <button
                    type="button"
                    onClick={checkTokenBalances}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Check Token Balances
                  </button>
                </div>

                {/* Balance Display */}
                {tokenTestResults.balances && (
                  <div className="bg-gray-50 p-4 rounded border">
                    <h4 className="text-gray-800 font-medium mb-2">Current Balances:</h4>
                    <p className="text-gray-700">MetaMask Wallet: <span className="text-green-600 font-medium">{tokenTestResults.balances.metamask} PYUSD</span></p>
                    <p className="text-gray-700">Smart Wallet: <span className="text-blue-600 font-medium">{tokenTestResults.balances.smartWallet} PYUSD</span></p>
                  </div>
                )}

                {/* Step 1: Approve */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-gray-800 font-medium mb-2">Step 1: Approve Smart Wallet</h4>
                  <p className="text-gray-600 text-sm mb-3">
                    Allow your smart wallet to spend up to 100 PYUSD from your MetaMask wallet
                  </p>
                  <button
                    type="button"
                    onClick={approveSmartWallet}
                    disabled={!client || client.chain?.id !== 11155111}
                    className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Approve Smart Wallet (MetaMask Signs)
                  </button>
                  {tokenTestResults.approveStatus && (
                    <p className={`text-sm mt-2 font-medium ${
                      tokenTestResults.approveStatus.includes('successful') 
                        ? 'text-green-600' 
                        : tokenTestResults.approveStatus.includes('failed')
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    }`}>
                      {tokenTestResults.approveStatus}
                    </p>
                  )}
                  {tokenTestResults.approveHash && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">
                        Transaction Hash: 
                        <a 
                          href={`https://sepolia.etherscan.io/tx/${tokenTestResults.approveHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1 text-blue-600 hover:text-blue-800 underline font-mono"
                        >
                          {tokenTestResults.approveHash}
                        </a>
                      </p>
                    </div>
                  )}
                </div>

                {/* Step 2: Transfer */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-gray-800 font-medium mb-2">Step 2: Transfer with Smart Wallet</h4>
                  <p className="text-gray-600 text-sm mb-3">
                    Use your smart wallet to transfer 1 PYUSD from MetaMask to zakhap.eth
                  </p>
                  <button
                    type="button"
                    onClick={transferWithSmartWallet}
                    disabled={!client || client.chain?.id !== 11155111}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Transfer 1 PYUSD (Smart Wallet Signs)
                  </button>
                  {tokenTestResults.transferStatus && (
                    <p className={`text-sm mt-2 font-medium ${
                      tokenTestResults.transferStatus.includes('successful') 
                        ? 'text-green-600' 
                        : tokenTestResults.transferStatus.includes('failed')
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    }`}>
                      {tokenTestResults.transferStatus}
                    </p>
                  )}
                  {tokenTestResults.transferHash && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">
                        Transaction Hash: 
                        <a 
                          href={`https://sepolia.etherscan.io/tx/${tokenTestResults.transferHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1 text-blue-600 hover:text-blue-800 underline font-mono"
                        >
                          {tokenTestResults.transferHash}
                        </a>
                      </p>
                    </div>
                  )}
                </div>

                {/* Error Display */}
                {tokenTestResults.error && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-red-600 text-sm">
                      <strong>Error:</strong> {tokenTestResults.error}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-6 max-w-4xl mt-6">
            <h2 className="text-xl font-bold">Your Wallets</h2>
            <WalletList />
          </div>
          <p className="mt-6 font-bold uppercase text-sm text-gray-600">
            User object
          </p>
          <pre className="max-w-4xl bg-slate-700 text-slate-50 font-mono p-4 text-xs sm:text-sm rounded-md mt-2">
            {JSON.stringify(user, null, 2)}
          </pre>
        </>
      ) : null}
    </main>
  );
}