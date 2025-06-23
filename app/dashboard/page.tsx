'use client';

import { usePrivy } from '@privy-io/react-auth';
import {
  ArrowRight,
  Edit3,
  Globe,
  User,
  Zap
} from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

import { OnboardingFlow } from '@/components/OnboardingFlow';
import { SmartWalletCard } from '@/components/SmartWalletCard';
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
  smartWallet: string;
  metaMask: string;
}

// PYUSD Token Configuration (Sepolia)
const PYUSD_TOKEN_CONFIG = {
  address: '0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9' as const,
  decimals: 6,
  symbol: 'PYUSD',
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
  const [conservativeAmount, setConservativeAmount] = useState('');
  const [growthAmount, setGrowthAmount] = useState('');
  const [balances, setBalances] = useState<WalletBalance>({
    smartWallet: '0',
    metaMask: '0',
  });



  // Onboarding and smart wallet states
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [smartWalletBalance, setSmartWalletBalance] = useState('0');
  const [showSmartWallet, setShowSmartWallet] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [isNetworkMenuOpen, setIsNetworkMenuOpen] = useState(false);
  const [isDepositFlow, setIsDepositFlow] = useState(false);

  // Privy hooks
  const { user, authenticated, ready } = usePrivy();

  // Get smart wallet from user's linked accounts
  const smartWallet = user?.linkedAccounts?.find(
    (account: any) => account.type === 'smart_wallet'
  ) as { address: string } | undefined;

  // Function to fetch PYUSD balance for MetaMask wallet
  const fetchMetaMaskBalance = useCallback(async () => {
    try {
      // Find MetaMask wallet from user's linked accounts
      const metaMaskWallet = user?.linkedAccounts?.find(
        (account: any) =>
          account.type === 'wallet' && account.walletClientType !== 'privy'
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

  // Function to fetch PYUSD balance for smart wallet
  const fetchSmartWalletBalance = async (address: string) => {
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
      if (parseFloat(formattedBalance) > 0) {
        setShowSmartWallet(true);
      }
    } catch (error) {
      console.error('Error fetching smart wallet balance:', error);
      setSmartWalletBalance('0');
    }
  };

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
          (account: any) =>
            account.type === 'wallet' && account.walletClientType !== 'privy'
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
  ]);

  // Calculate total balance
  const totalBalance = () => {
    console.log('=== TOTAL BALANCE CALCULATION ===');
    console.log('Raw balances object:', balances);
    console.log('Smart Wallet balance string:', balances.smartWallet);
    console.log('MetaMask balance string:', balances.metaMask);

    const smartWalletNum =
      parseFloat(balances.smartWallet.replace(/,/g, '')) || 0;
    const metaMaskNum = parseFloat(balances.metaMask.replace(/,/g, '')) || 0;

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

  const handleGrowthSlideComplete = () => {
    // Investment logic would go here
    console.log(`Investing ${growthAmount} in Growth Vault`);
    setGrowthSliding(false);
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
                  PyInvest{' '}
                  <span className='text-sm font-normal text-gray-400'>
                    by Fellow
                  </span>
                </h1>
              </div>
            </div>
            <div className='flex items-center space-x-3'>
              {/* Profile Icon - Direct Link */}
              <a
                href='/profile'
                className='flex items-center space-x-2 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200'
              >
                <User className='h-5 w-5 text-gray-600' />
              </a>

              {/* Network Status Dropdown */}
              <div className='relative'>
                <button
                  onClick={() => setIsNetworkMenuOpen(!isNetworkMenuOpen)}
                  className='relative flex items-center justify-center rounded-full bg-gray-100 p-2 transition-colors hover:bg-gray-200'
                >
                  <Globe className='h-5 w-5 text-gray-600' />
                  {/* Blinking green dot */}
                  <div className='absolute -right-0.5 -top-0.5 h-3 w-3 animate-pulse rounded-full bg-green-500'>
                    <div className='absolute inset-0 h-3 w-3 animate-ping rounded-full bg-green-500 opacity-75'></div>
                  </div>
                </button>

                {/* Network Dropdown Menu */}
                {isNetworkMenuOpen && (
                  <>
                    <div className='absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg'>
                      <div className='py-1'>
                        <div className='border-b border-gray-100 px-4 py-3'>
                          <div className='mb-2 flex items-center space-x-2'>
                            <div className='h-2 w-2 animate-pulse rounded-full bg-green-500'></div>
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
                    />
                  </>
                )}
              </div>
            </div>
          </div>
          <div className='mb-2 mt-2 border-t border-gray-200'></div>
          <p className='text-base leading-relaxed text-gray-600'></p>
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

            {/* Analytics Button */}
            <a
              href='/analytics'
              className='flex w-full items-center justify-center space-x-2 rounded-xl border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50'
            >
              <span>View Potential Returns</span>
            </a>
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
                  <span
                    className={`text-sm font-medium ${growthYieldEnabled ? 'text-blue-600' : 'text-gray-400'}`}
                  >
                    8.5% - 12.3% APY
                  </span>
                </div>
              </div>

              {/* Toggle Section */}
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
                  growthAmount && growthYieldEnabled
                    ? 'bg-blue-600'
                    : 'bg-blue-600/30'
                }`}
              >
                <div
                  className={`absolute inset-0 flex items-center justify-center text-base font-medium transition-all duration-500 ease-in-out ${
                    growthAmount && growthYieldEnabled
                      ? 'text-white'
                      : 'text-white/80'
                  } ${growthSliding ? 'opacity-0' : 'opacity-100'}`}
                >
                  <span>
                    {!growthYieldEnabled
                      ? 'Yield disabled'
                      : growthAmount
                        ? `Invest $${growthAmount}`
                        : 'Select amount to invest'}
                  </span>
                  {growthAmount && growthYieldEnabled && (
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
                {growthAmount && growthYieldEnabled && (
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
