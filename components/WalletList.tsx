import {
  useCreateWallet,
  useSolanaWallets,
  useUser,
  type WalletWithMetadata,
} from '@privy-io/react-auth';
import { useSmartWallets } from '@privy-io/react-auth/smart-wallets';
import { useCallback, useMemo, useState } from 'react';

import WalletCard from './WalletCard';

// Smart wallet type definition based on Privy's actual type
interface SmartWallet {
  type: 'smart_wallet';
  address: string;
  smartWalletType?: string;
}

export default function WalletList() {
  const { user } = useUser();
  const { client } = useSmartWallets();
  const { createWallet: createEthereumWallet } = useCreateWallet();
  const { createWallet: createSolanaWallet } = useSolanaWallets();
  const [isCreating, setIsCreating] = useState(false);

  const ethereumEmbeddedWallets = useMemo<WalletWithMetadata[]>(
    () =>
      (user?.linkedAccounts.filter(
        account =>
          account.type === 'wallet' &&
          account.walletClientType === 'privy' &&
          account.chainType === 'ethereum'
      ) as WalletWithMetadata[]) ?? [],
    [user]
  );

  const solanaEmbeddedWallets = useMemo<WalletWithMetadata[]>(
    () =>
      (user?.linkedAccounts.filter(
        account =>
          account.type === 'wallet' &&
          account.walletClientType === 'privy' &&
          account.chainType === 'solana'
      ) as WalletWithMetadata[]) ?? [],
    [user]
  );

  const smartWallets = useMemo<SmartWallet[]>(
    () =>
      (user?.linkedAccounts.filter(
        account => account.type === 'smart_wallet'
      ) as SmartWallet[]) ?? [],
    [user]
  );

  // Get chain information for smart wallet
  const smartWalletChainInfo = useMemo(() => {
    if (client?.chain) {
      return {
        name: client.chain.name,
        id: client.chain.id,
        nativeCurrency: client.chain.nativeCurrency,
      };
    }
    return null;
  }, [client]);

  const handleCreateWallet = useCallback(
    async (type: 'ethereum' | 'solana') => {
      setIsCreating(true);
      try {
        if (type === 'ethereum') {
          await createEthereumWallet();
        } else if (type === 'solana') {
          await createSolanaWallet();
        }
      } catch (error) {
        console.error('Error creating wallet:', error);
      } finally {
        setIsCreating(false);
      }
    },
    [createEthereumWallet, createSolanaWallet]
  );

  return (
    <div className='space-y-6'>
      {/* Smart Wallets Section */}
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold text-gray-800'>Smart Wallets</h3>
        {smartWallets.length === 0 ? (
          <div className='rounded-lg border border-gray-200 bg-blue-50 p-4 text-center'>
            <p className='mb-2 text-gray-600'>
              No smart wallets found. Smart wallets will be automatically
              created when you have an embedded wallet.
            </p>
            <p className='text-sm text-gray-500'>
              Make sure smart wallets are configured in your Privy Dashboard.
            </p>
          </div>
        ) : (
          <div className='space-y-3'>
            {smartWallets.map(wallet => (
              <div
                key={wallet.address}
                className='rounded-lg border border-blue-200 bg-blue-50 p-4'
              >
                <div className='flex flex-col space-y-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-semibold text-blue-800'>
                      Smart Wallet{' '}
                      {wallet.smartWalletType
                        ? `(${wallet.smartWalletType})`
                        : ''}
                    </span>
                    <div className='flex gap-2'>
                      {smartWalletChainInfo && (
                        <span className='rounded bg-blue-100 px-2 py-1 text-xs text-blue-600'>
                          {smartWalletChainInfo.name} (ID:{' '}
                          {smartWalletChainInfo.id})
                        </span>
                      )}
                      <span className='rounded bg-green-100 px-2 py-1 text-xs text-green-600'>
                        EVM Compatible
                      </span>
                    </div>
                  </div>
                  <div className='break-all font-mono text-sm text-gray-700'>
                    {wallet.address}
                  </div>
                  {smartWalletChainInfo && (
                    <div className='text-xs text-gray-600'>
                      Native Currency:{' '}
                      {smartWalletChainInfo.nativeCurrency?.symbol || 'ETH'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ethereum Embedded Wallets Section */}
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold text-gray-800'>
          Ethereum Embedded Wallets
        </h3>
        {ethereumEmbeddedWallets.length === 0 ? (
          <div className='rounded-lg border border-gray-200 p-4 text-center'>
            <p className='mb-4 text-gray-600'>
              No Ethereum embedded wallets found.
            </p>
            <button
              type='button'
              onClick={() => handleCreateWallet('ethereum')}
              disabled={isCreating}
              className='rounded-md bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-400'
            >
              {isCreating ? 'Creating...' : 'Create Ethereum Embedded Wallet'}
            </button>
          </div>
        ) : (
          <div className='space-y-4'>
            {ethereumEmbeddedWallets.map(wallet => (
              <WalletCard key={wallet.address} wallet={wallet} />
            ))}
          </div>
        )}
      </div>

      {/* Solana Embedded Wallets Section */}
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold text-gray-800'>
          Solana Embedded Wallets
        </h3>
        {solanaEmbeddedWallets.length === 0 ? (
          <div className='rounded-lg border border-gray-200 p-4 text-center'>
            <p className='mb-4 text-gray-600'>
              No Solana embedded wallets found.
            </p>
            <button
              type='button'
              onClick={() => handleCreateWallet('solana')}
              disabled={isCreating}
              className='rounded-md bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-400'
            >
              {isCreating ? 'Creating...' : 'Create Solana Embedded Wallet'}
            </button>
          </div>
        ) : (
          <div className='space-y-4'>
            {solanaEmbeddedWallets.map(wallet => (
              <WalletCard key={wallet.address} wallet={wallet} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
