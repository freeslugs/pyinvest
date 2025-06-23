'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { SmartWalletsProvider } from '@privy-io/react-auth/smart-wallets';
import { bscTestnet, flowTestnet, sepolia } from 'viem/chains';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      config={{
        embeddedWallets: {
          createOnLogin: 'all-users',
        },
        defaultChain: sepolia,
        supportedChains: [sepolia, flowTestnet, bscTestnet],
        appearance: {
          theme: 'light',
        },
        loginMethods: ['wallet', 'email'],
        walletConnectCloudProjectId: undefined, // Disable WalletConnect to avoid errors
      }}
    >
      <SmartWalletsProvider>{children}</SmartWalletsProvider>
    </PrivyProvider>
  );
}
