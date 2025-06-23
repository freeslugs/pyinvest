'use client';

import { ArrowRight, Backspace, Shield, TrendingUp, Zap } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

const PRESET_AMOUNTS = [500, 1000, 2500, 5000];

export default function PyUSDYieldSelector() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [showCustomAmount, setShowCustomAmount] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  const handlePresetAmount = (amount: number) => {
    setSelectedAmount(amount);
    setShowCustomAmount(false);
    setCustomAmount('');
  };

  const handleCustomAmount = () => {
    setShowCustomAmount(true);
    setSelectedAmount(null);
  };

  const handlePinpadInput = (value: string) => {
    if (value === 'backspace') {
      setCustomAmount(prev => prev.slice(0, -1));
    } else if (value === 'clear') {
      setCustomAmount('');
    } else {
      // Prevent invalid input and limit to reasonable amount
      const newAmount = customAmount + value;
      if (newAmount.length <= 8 && /^\d*\.?\d*$/.test(newAmount)) {
        setCustomAmount(newAmount);
      }
    }
  };

  const handleConfirmCustomAmount = () => {
    const amount = parseFloat(customAmount);
    if (amount > 0) {
      setSelectedAmount(amount);
    }
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
              <p className='text-4xl font-medium text-gray-800 font-adelle'>12,450.00</p>
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
                  <span className='text-sm text-gray-500'>$8,250.00</span>
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
                  <span className='text-sm text-gray-500'>$4,200.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Amount Selection */}
        <div className='rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden'>
          <div className='p-4'>
            <h3 className='mb-4 text-lg font-semibold text-gray-900'>
              Select Amount to Invest
            </h3>

            {/* Amount Selection Menu */}
            <div
              className={`transition-all duration-300 ease-in-out ${
                showCustomAmount ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'
              }`}
            >
              <div className='grid grid-cols-3 gap-3'>
                {PRESET_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handlePresetAmount(amount)}
                    className={`rounded-lg border-2 p-3 text-center font-semibold transition-all duration-200 ${
                      selectedAmount === amount
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    ${amount.toLocaleString()}
                  </button>
                ))}

                {/* Custom Amount Button */}
                <button
                  onClick={handleCustomAmount}
                  className={`rounded-lg border-2 p-3 text-center font-semibold transition-all duration-200 ${
                    showCustomAmount
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>

            {/* Custom Amount Entry Area */}
            <div
              className={`transition-all duration-300 ease-in-out ${
                showCustomAmount
                  ? 'opacity-100 translate-y-0 max-h-96'
                  : 'opacity-0 -translate-y-4 max-h-0 overflow-hidden'
              }`}
            >
              {showCustomAmount && (
                <div className='mt-4 space-y-4'>
                  {/* Amount Display */}
                  <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
                    <div className='flex items-center justify-center'>
                      <span className='text-2xl font-light text-gray-400 mr-1'>$</span>
                      <span className='text-3xl font-semibold text-gray-800 min-w-0'>
                        {customAmount || '0'}
                      </span>
                    </div>
                  </div>

                  {/* Pinpad */}
                  <div className='grid grid-cols-3 gap-3'>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        onClick={() => handlePinpadInput(num.toString())}
                        className='aspect-square rounded-lg border border-gray-200 bg-white text-xl font-semibold text-gray-800 transition-all duration-150 hover:bg-gray-50 active:scale-95'
                      >
                        {num}
                      </button>
                    ))}

                    {/* Decimal Point */}
                    <button
                      onClick={() => handlePinpadInput('.')}
                      className='aspect-square rounded-lg border border-gray-200 bg-white text-xl font-semibold text-gray-800 transition-all duration-150 hover:bg-gray-50 active:scale-95'
                      disabled={customAmount.includes('.')}
                    >
                      .
                    </button>

                    {/* Zero */}
                    <button
                      onClick={() => handlePinpadInput('0')}
                      className='aspect-square rounded-lg border border-gray-200 bg-white text-xl font-semibold text-gray-800 transition-all duration-150 hover:bg-gray-50 active:scale-95'
                    >
                      0
                    </button>

                    {/* Backspace */}
                    <button
                      onClick={() => handlePinpadInput('backspace')}
                      className='aspect-square rounded-lg border border-gray-200 bg-white text-xl font-semibold text-gray-800 transition-all duration-150 hover:bg-gray-50 active:scale-95 flex items-center justify-center'
                    >
                      <Backspace className='h-5 w-5' />
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className='flex gap-3'>
                    <button
                      onClick={() => setShowCustomAmount(false)}
                      className='flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50'
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmCustomAmount}
                      disabled={!customAmount || parseFloat(customAmount) <= 0}
                      className='flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300'
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Selected Amount Display */}
            {selectedAmount && !showCustomAmount && (
              <div className='mt-4 rounded-lg bg-blue-50 p-3'>
                <p className='text-center text-lg font-semibold text-blue-700'>
                  Selected: ${selectedAmount.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>

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

              <button
                className={`inline-flex h-11 w-full items-center justify-center rounded-md px-4 text-sm font-semibold transition-all duration-200 ${
                  selectedAmount
                    ? 'bg-blue-600 text-white hover:bg-blue-700 group-hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!selectedAmount}
              >
                <span>
                  {selectedAmount ? `Invest $${selectedAmount.toLocaleString()}` : 'Select amount to invest'}
                </span>
                {selectedAmount && <ArrowRight className='ml-2 h-4 w-4 transition-transform group-hover:translate-x-1' />}
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

              <button
                className={`inline-flex h-11 w-full items-center justify-center rounded-md px-4 text-sm font-semibold transition-all duration-200 ${
                  selectedAmount
                    ? 'bg-blue-600 text-white hover:bg-blue-700 group-hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!selectedAmount}
              >
                <span>
                  {selectedAmount ? `Invest $${selectedAmount.toLocaleString()}` : 'Select amount to invest'}
                </span>
                {selectedAmount && <ArrowRight className='ml-2 h-4 w-4 transition-transform group-hover:translate-x-1' />}
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
