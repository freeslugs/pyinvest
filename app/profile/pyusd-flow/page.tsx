'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ArrowLeft, ExternalLink, RefreshCw, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPublicClient, http, parseAbi } from 'viem';

export default function PyusdFlowBalancePage() {
  const router = useRouter();
  const { wallets } = useWallets();
  const { ready, authenticated, user } = usePrivy();

  const [pyusdBalance, setPyusdBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);

  // PYUSD on Flow Testnet configuration
  const PYUSD_FLOW_CONFIG = {
    address: '0x4e344D902eb63c14B894083E409C9c6e06e8ed14' as const,
    decimals: 6, // PYUSD typically has 6 decimals
    symbol: 'PYUSD',
  };

  // Flow EVM Testnet configuration
  const FLOW_TESTNET_CONFIG = {
    id: 545,
    name: 'Flow EVM Testnet',
    rpcUrl: 'https://testnet.evm.nodes.onflow.org',
    explorerUrl: 'https://evm-testnet.flowscan.io',
  };

  const publicClient = createPublicClient({
    chain: {
      id: FLOW_TESTNET_CONFIG.id,
      name: FLOW_TESTNET_CONFIG.name,
      rpcUrls: {
        default: { http: [FLOW_TESTNET_CONFIG.rpcUrl] },
        public: { http: [FLOW_TESTNET_CONFIG.rpcUrl] },
      },
      nativeCurrency: {
        name: 'FLOW',
        symbol: 'FLOW',
        decimals: 18,
      },
    },
    transport: http(FLOW_TESTNET_CONFIG.rpcUrl),
  });

  const ERC20_ABI = parseAbi([
    'function balanceOf(address owner) view returns (uint256)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
  ]);

  // Helper function to get the embedded wallet address
  const getEmbeddedWalletAddress = () => {
    const embeddedWallet = wallets.find(
      wallet => wallet.walletClientType === 'privy'
    );
    return embeddedWallet?.address;
  };

  // Function to check PYUSD balance on Flow
  const checkPyusdBalance = async () => {
    const walletAddress = getEmbeddedWalletAddress();
    if (!walletAddress) return;

    setIsLoading(true);
    try {
      console.log('Checking PYUSD balance on Flow for address:', walletAddress);

      const balance = await publicClient.readContract({
        address: PYUSD_FLOW_CONFIG.address,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [walletAddress as `0x${string}`],
      });

      const formattedBalance = Number(balance) / 10 ** PYUSD_FLOW_CONFIG.decimals;
      setPyusdBalance(formattedBalance.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      }));

      console.log('PYUSD Balance on Flow:', formattedBalance);
    } catch (error) {
      console.error('Error checking PYUSD balance on Flow:', error);
      setPyusdBalance('0.00');
    } finally {
      setIsLoading(false);
    }
  };

  // Check balance on component mount
  useEffect(() => {
    if (wallets.length > 0 && getEmbeddedWalletAddress()) {
      checkPyusdBalance();
    }
  }, [wallets]);

  // Redirect if not authenticated
  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  if (!ready || !authenticated || !user) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-white'>
        <div className='text-center'>
          <div className='animate-pulse text-gray-400'>Loading...</div>
        </div>
      </div>
    );
  }

  const walletAddress = getEmbeddedWalletAddress();
  const contractUrl = `${FLOW_TESTNET_CONFIG.explorerUrl}/address/${PYUSD_FLOW_CONFIG.address}`;

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='mx-auto max-w-2xl px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8 rounded-lg border border-gray-200 bg-white shadow-sm'>
          <div className='px-6 py-8'>
            <div className='flex items-center space-x-4'>
              <button
                onClick={() => router.push('/profile')}
                className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200'
              >
                <ArrowLeft className='h-5 w-5 text-gray-600' />
              </button>
              <div className='flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600'>
                <Wallet className='h-8 w-8 text-white' />
              </div>
              <div>
                <h1 className='text-2xl font-bold text-gray-900'>
                  PYUSD on Flow Balance
                </h1>
                <p className='text-gray-600'>Flow EVM Testnet</p>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div className='rounded-lg border border-gray-200 bg-white shadow-sm'>
          <div className='px-6 py-8'>
            <div className='text-center'>
              {/* PYUSD Logo */}
              <div className='mb-6 flex justify-center'>
                <img
                  src='/assets/pyusd_logo.png'
                  alt='PYUSD'
                  className='h-16 w-16 rounded-full border-2 border-gray-100'
                />
              </div>

              {/* Balance Display */}
              <div className='mb-6'>
                <p className='mb-2 text-sm font-medium text-gray-500'>
                  Your Balance
                </p>
                <div className='flex items-center justify-center space-x-2'>
                  <span className='text-4xl font-bold text-gray-900'>
                    {pyusdBalance}
                  </span>
                  <span className='text-xl font-medium text-gray-500'>
                    PYUSD
                  </span>
                </div>
              </div>

              {/* Refresh Button */}
              <div className='mb-8'>
                <button
                  onClick={checkPyusdBalance}
                  disabled={isLoading || !walletAddress}
                  className='inline-flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'Refreshing...' : 'Refresh Balance'}</span>
                </button>
              </div>

              {/* Contract Info */}
              <div className='space-y-4 border-t border-gray-100 pt-6'>
                <div>
                  <p className='mb-2 text-sm font-medium text-gray-500'>
                    Contract Address
                  </p>
                  <p className='font-mono text-sm text-gray-700'>
                    {PYUSD_FLOW_CONFIG.address}
                  </p>
                </div>

                <div>
                  <p className='mb-2 text-sm font-medium text-gray-500'>
                    Your Wallet Address
                  </p>
                  <p className='font-mono text-sm text-gray-700'>
                    {walletAddress || 'Not available'}
                  </p>
                </div>

                {/* Link to Contract Explorer */}
                <div className='pt-4'>
                  <a
                    href={contractUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex items-center space-x-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50'
                  >
                    <ExternalLink className='h-4 w-4' />
                    <span>View Contract on Flow Scanner</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Network Info */}
        <div className='mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm'>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-gray-500'>Network:</span>
            <span className='font-medium text-gray-900'>
              {FLOW_TESTNET_CONFIG.name}
            </span>
          </div>
          <div className='mt-2 flex items-center justify-between text-sm'>
            <span className='text-gray-500'>Chain ID:</span>
            <span className='font-medium text-gray-900'>
              {FLOW_TESTNET_CONFIG.id}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
