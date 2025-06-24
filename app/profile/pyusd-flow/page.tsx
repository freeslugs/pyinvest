'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react';
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
    <div className='min-h-screen bg-gray-50 py-4'>
      <div className='mx-auto max-w-md px-4'>
        {/* Header */}
        <div className='mb-4 flex items-center justify-between'>
          <button
            onClick={() => router.push('/profile')}
            className='flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm transition-colors hover:bg-gray-50'
          >
            <ArrowLeft className='h-4 w-4 text-gray-600' />
          </button>
          <h1 className='text-lg font-semibold text-gray-900'>
            PYUSD on Flow
          </h1>
          <div></div>
        </div>

        {/* Balance Card */}
        <div className='rounded-lg border border-gray-200 bg-white p-4 shadow-sm'>
          <div className='text-center'>
            {/* PYUSD Logo */}
            <div className='mb-3 flex justify-center'>
              <img
                src='/assets/pyusd_logo.png'
                alt='PYUSD'
                className='h-12 w-12 rounded-full'
              />
            </div>

            {/* Balance Display */}
            <div className='mb-4'>
              <div className='flex items-baseline justify-center space-x-1'>
                <span className='text-2xl font-bold text-gray-900'>
                  {pyusdBalance}
                </span>
                <span className='text-sm font-medium text-gray-500'>
                  PYUSD
                </span>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={checkPyusdBalance}
              disabled={isLoading || !walletAddress}
              className='mb-4 inline-flex items-center space-x-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            {/* Contract Link */}
            <div className='border-t border-gray-100 pt-3'>
              <a
                href={contractUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center space-x-1 text-xs text-blue-600 transition-colors hover:text-blue-800'
              >
                <ExternalLink className='h-3 w-3' />
                <span>View Contract</span>
              </a>
            </div>
          </div>
        </div>

        {/* Compact Info */}
        <div className='mt-3 rounded-lg bg-white p-3 text-xs text-gray-500'>
          <div className='flex justify-between'>
            <span>Network:</span>
            <span className='font-medium'>Flow Testnet</span>
          </div>
          <div className='mt-1 flex justify-between'>
            <span>Chain ID:</span>
            <span className='font-medium'>{FLOW_TESTNET_CONFIG.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
