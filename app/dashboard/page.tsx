'use client';

import { ArrowRight, CheckCircle, Copy, Edit3, Shield, TrendingUp, Zap } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import { Modal } from '@/components/ui/modal';

interface WalletBalance {
  venmo: string;
  coinbase: string;
}

export default function PyUSDYieldSelector() {
  const [conservativeAmount, setConservativeAmount] = useState('250');
  const [growthAmount, setGrowthAmount] = useState('250');
  const [isVenmoModalOpen, setIsVenmoModalOpen] = useState(false);
  const [venmoAddress, setVenmoAddress] = useState('');
  const [venmoInputValue, setVenmoInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [balances, setBalances] = useState<WalletBalance>({
    venmo: '0',
    coinbase: '4,200.00' // Hardcoded for now
  });

  // Load Venmo address from localStorage on component mount
  useEffect(() => {
    const savedVenmoAddress = localStorage.getItem('venmoWalletAddress');
    if (savedVenmoAddress) {
      setVenmoAddress(savedVenmoAddress);
      // Fetch balance for the saved address
      fetchVenmoBalance(savedVenmoAddress);
    }
  }, []);

  // Mock function to fetch PYUSD balance for Venmo wallet
  const fetchVenmoBalance = async (address: string) => {
    try {
      setIsLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock balance - in real implementation, you'd call the actual API with the address
      // For now, we'll return a mock balance regardless of the address
      const mockBalance = '8,250.00';
      console.log('Fetching balance for address:', address);

      setBalances(prev => ({
        ...prev,
        venmo: mockBalance
      }));
    } catch (error) {
      console.error('Error fetching Venmo balance:', error);
      setBalances(prev => ({
        ...prev,
        venmo: '0'
      }));
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
      maximumFractionDigits: 2
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

  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='mx-auto max-w-md space-y-6'>
        {/* Header */}
        <div className='pb-4 pt-8'>
          <div className='mb-4 flex items-center'>
            <div className='mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600'>
              <span className='text-lg font-bold text-white'>py</span>
            </div>
            <div>
              <h1 className='text-2xl font-semibold text-gray-900'>PyInvest</h1>
              <p className='text-sm text-gray-600'>
                Easily securely put digital money to work in 1 click
              </p>
            </div>
          </div>
        </div>

        {/* Balance Display */}
        <div className='rounded-lg border border-gray-200 bg-white text-gray-950 shadow-sm'>
          <div className='p-6'>
            <p className='mb-2 text-sm text-gray-500'>Amount</p>
            <div className='mb-1 flex items-center space-x-2'>
              <span className='text-4xl font-light text-gray-300 font-adelle'>$</span>
              <p className='text-4xl font-medium text-gray-800 font-adelle'>{totalBalance()}</p>
              <Image
                src='/assets/pyusd_logo.png'
                alt='pyUSD logo'
                width={24}
                height={24}
                className='ml-1 h-6 w-6'
              />
            </div>

            <div className='mt-4 border-t border-gray-100 pt-4'>
              <p className='mb-2 text-xs text-gray-400'>Balance sources</p>
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
                    <span className='text-sm text-gray-500'>Venmo</span>
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
                    <span className='text-sm text-gray-500'>Coinbase</span>
                  </div>
                  <span className='text-sm text-gray-500'>${balances.coinbase}</span>
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
          title="Configure Venmo Wallet"
        >
          {showSuccess ? (
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Success!
              </h3>
              <p className="text-gray-600">
                Your Venmo wallet has been configured successfully.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  How to get your Venmo ETH address:
                </h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-start space-x-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-semibold mt-0.5">1</span>
                    <p>Open your Venmo app and go to the Crypto section</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-semibold mt-0.5">2</span>
                    <p>Tap on &ldquo;Receive&rdquo; or &ldquo;Deposit&rdquo; for Ethereum</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-semibold mt-0.5">3</span>
                    <p>Copy your Ethereum wallet address (starts with 0x)</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-semibold mt-0.5">4</span>
                    <p>Paste the address below</p>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="venmo-address" className="block text-sm font-medium text-gray-700 mb-2">
                  Venmo ETH Address
                </label>
                <div className="relative">
                  <input
                    id="venmo-address"
                    type="text"
                    value={venmoInputValue}
                    onChange={(e) => setVenmoInputValue(e.target.value)}
                    placeholder="0x..."
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  {venmoInputValue && (
                    <button
                      onClick={() => copyToClipboard(venmoInputValue)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setIsVenmoModalOpen(false);
                    setVenmoInputValue('');
                  }}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVenmoSubmit}
                  disabled={isLoading || !venmoInputValue.trim()}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Investment Options */}
        <div className='space-y-4'>
          <h2 className='px-2 text-xl font-semibold text-gray-900'>
            Earn Strategies
          </h2>

          {/* Conservative Vault */}
          <div className='group cursor-pointer rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md'>
            <div className='p-5'>
              <div className='mb-4 flex items-center justify-between'>
                <div className='flex items-center space-x-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-green-50'>
                    <Shield className='h-5 w-5 text-green-600' />
                  </div>
                  <div>
                    <h3 className='text-base font-semibold text-gray-900'>
                      Conservative Vault
                    </h3>
                    <p className='text-sm text-gray-500'>
                      Low risk, stable returns
                    </p>
                  </div>
                </div>
                <div className='rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700'>
                  Stable
                </div>
              </div>

              <div className='mb-4 space-y-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium text-gray-600'>
                    Expected APY
                  </span>
                  <span className='text-base font-semibold text-green-600'>
                    4.2% - 5.8%
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium text-gray-600'>
                    Risk level
                  </span>
                  <span className='text-sm font-medium text-gray-900'>Low</span>
                </div>
              </div>

              {/* Amount Selection */}
              <div className='mb-4 space-y-3'>
                <div className='text-sm font-medium text-gray-900'>Select amount to invest</div>
                <div className='flex w-full gap-2'>
                  <div role="radiogroup" className='flex w-full gap-2'>
                    {['25', '50', '100', '250'].map((amount) => (
                      <label
                        key={amount}
                        className={`flex w-full cursor-pointer justify-center rounded-[10px] border-[1.5px] py-2 text-center text-sm leading-normal transition-colors hover:bg-gray-50 ${
                          conservativeAmount === amount
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 text-gray-600'
                        }`}
                      >
                        <input
                          type="radio"
                          value={amount}
                          checked={conservativeAmount === amount}
                          onChange={(e) => setConservativeAmount(e.target.value)}
                          className="sr-only"
                        />
                        ${amount}
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="flex min-w-[42px] items-center justify-center rounded-[10px] border-[1.5px] border-gray-300 py-2 text-gray-600 hover:bg-gray-50"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <button
                type='button'
                className='inline-flex h-11 w-full items-center justify-center rounded-md bg-blue-600 px-8 text-sm font-medium text-white transition-colors hover:bg-blue-700 group-hover:bg-blue-700'
              >
                <span>Invest ${conservativeAmount}</span>
                <ArrowRight className='ml-2 h-4 w-4' />
              </button>
            </div>
          </div>

          {/* Growth Vault */}
          <div className='group cursor-pointer rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md'>
            <div className='p-5'>
              <div className='mb-4 flex items-center justify-between'>
                <div className='flex items-center space-x-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50'>
                    <TrendingUp className='h-5 w-5 text-blue-600' />
                  </div>
                  <div>
                    <h3 className='text-base font-semibold text-gray-900'>
                      Growth Vault
                    </h3>
                    <p className='text-sm text-gray-500'>
                      Higher potential returns
                    </p>
                  </div>
                </div>
                <div className='rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700'>
                  Growth
                </div>
              </div>

              <div className='mb-4 space-y-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium text-gray-600'>
                    Expected APY
                  </span>
                  <span className='text-base font-semibold text-blue-600'>
                    8.5% - 12.3%
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium text-gray-600'>
                    Risk level
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    Medium
                  </span>
                </div>
              </div>

              {/* Amount Selection */}
              <div className='mb-4 space-y-3'>
                <div className='text-sm font-medium text-gray-900'>Select amount to invest</div>
                <div className='flex w-full gap-2'>
                  <div role="radiogroup" className='flex w-full gap-2'>
                    {['25', '50', '100', '250'].map((amount) => (
                      <label
                        key={amount}
                        className={`flex w-full cursor-pointer justify-center rounded-[10px] border-[1.5px] py-2 text-center text-sm leading-normal transition-colors hover:bg-gray-50 ${
                          growthAmount === amount
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 text-gray-600'
                        }`}
                      >
                        <input
                          type="radio"
                          value={amount}
                          checked={growthAmount === amount}
                          onChange={(e) => setGrowthAmount(e.target.value)}
                          className="sr-only"
                        />
                        ${amount}
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="flex min-w-[42px] items-center justify-center rounded-[10px] border-[1.5px] border-gray-300 py-2 text-gray-600 hover:bg-gray-50"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <button
                type='button'
                className='inline-flex h-11 w-full items-center justify-center rounded-md bg-blue-600 px-8 text-sm font-medium text-white transition-colors hover:bg-blue-700 group-hover:bg-blue-700'
              >
                <span>Invest ${growthAmount}</span>
                <ArrowRight className='ml-2 h-4 w-4' />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className='rounded-lg border-0 bg-gradient-to-r from-blue-600 to-blue-700'>
          <div className='p-6 text-white'>
            <div className='mb-3 flex items-center space-x-2'>
              <Zap className='h-5 w-5' />
              <h3 className='font-semibold'>Instant Deployment</h3>
            </div>
            <p className='mb-4 text-sm text-blue-100'>
              Your pyUSD starts earning yield immediately after investment
            </p>
            <div className='grid grid-cols-2 gap-4 text-center'>
              <div>
                <p className='text-2xl font-bold'>$2.4M+</p>
                <p className='text-xs text-blue-100'>Total Value Locked</p>
              </div>
              <div>
                <p className='text-2xl font-bold'>1,200+</p>
                <p className='text-xs text-blue-100'>Active Investors</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='pb-8 text-center text-xs text-gray-500'>
          <p>Powered by institutional-grade DeFi protocols</p>
          <p className='mt-1'>Your funds are secured by smart contracts</p>
        </div>
      </div>
    </div>
  );
}
