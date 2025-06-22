'use client';

import { ArrowRight, Shield, TrendingUp, Zap } from 'lucide-react';
import Image from 'next/image';

export default function PyUSDYieldSelector() {
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
              <span className='text-4xl font-light text-gray-300'>$</span>
              <p className='text-4xl font-medium text-gray-800'>12,450.00</p>
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

        {/* Investment Options */}
        <div className='space-y-4'>
          <h2 className='px-2 text-xl font-semibold text-gray-900'>
            Earn Strategies
          </h2>

          {/* Conservative Vault */}
          <div className='group cursor-pointer rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-lg'>
            <div className='p-6'>
              <div className='mb-6 flex items-start justify-between'>
                <div className='flex items-center space-x-4'>
                  <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-green-100'>
                    <Shield className='h-6 w-6 text-green-600' />
                  </div>
                  <div>
                    <h3 className='mb-1 text-lg font-semibold text-gray-900'>
                      Conservative Vault
                    </h3>
                    <p className='text-sm text-gray-500'>
                      Low risk, stable returns
                    </p>
                  </div>
                </div>
                <div className='inline-flex items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700'>
                  Stable
                </div>
              </div>

              <div className='mb-6 space-y-4'>
                <div className='flex items-center justify-between py-2'>
                  <span className='text-sm font-medium text-gray-600'>
                    Expected APY
                  </span>
                  <span className='text-lg font-semibold text-green-600'>
                    4.2% - 5.8%
                  </span>
                </div>
                <div className='flex items-center justify-between py-2'>
                  <span className='text-sm font-medium text-gray-600'>
                    Risk level
                  </span>
                  <span className='text-sm font-medium text-gray-900'>Low</span>
                </div>
              </div>

              <button className='inline-flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md group-hover:bg-blue-700'>
                <span>1-click invest</span>
                <ArrowRight className='ml-2 h-4 w-4 transition-transform group-hover:translate-x-1' />
              </button>
            </div>
          </div>

          {/* Growth Vault */}
          <div className='group cursor-pointer rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-lg'>
            <div className='p-6'>
              <div className='mb-6 flex items-start justify-between'>
                <div className='flex items-center space-x-4'>
                  <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100'>
                    <TrendingUp className='h-6 w-6 text-blue-600' />
                  </div>
                  <div>
                    <h3 className='mb-1 text-lg font-semibold text-gray-900'>
                      Growth Vault
                    </h3>
                    <p className='text-sm text-gray-500'>
                      Higher potential returns
                    </p>
                  </div>
                </div>
                <div className='inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700'>
                  Growth
                </div>
              </div>

              <div className='mb-6 space-y-4'>
                <div className='flex items-center justify-between py-2'>
                  <span className='text-sm font-medium text-gray-600'>
                    Expected APY
                  </span>
                  <span className='text-lg font-semibold text-blue-600'>
                    8.5% - 12.3%
                  </span>
                </div>
                <div className='flex items-center justify-between py-2'>
                  <span className='text-sm font-medium text-gray-600'>
                    Risk level
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    Medium
                  </span>
                </div>
              </div>

              <button className='inline-flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md group-hover:bg-blue-700'>
                <span>1-click invest</span>
                <ArrowRight className='ml-2 h-4 w-4 transition-transform group-hover:translate-x-1' />
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
