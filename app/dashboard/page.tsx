'use client';

import { ArrowRight, Edit3, Shield, TrendingUp, Zap } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

export default function PyUSDYieldSelector() {
  const [conservativeAmount, setConservativeAmount] = useState('');
  const [growthAmount, setGrowthAmount] = useState('');

  // Custom input states
  const [showConservativeCustom, setShowConservativeCustom] = useState(false);
  const [showGrowthCustom, setShowGrowthCustom] = useState(false);
  const [conservativeCustomValue, setConservativeCustomValue] = useState('');
  const [growthCustomValue, setGrowthCustomValue] = useState('');

  // Slide to confirm states
  const [conservativeSliding, setConservativeSliding] = useState(false);
  const [growthSliding, setGrowthSliding] = useState(false);

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

  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='mx-auto max-w-md space-y-6'>
        {/* Header */}
        <div className='pb-4 pt-8'>
          <div className='mb-4 flex items-center'>
            <div className='mr-3 flex h-10 w-10 items-center justify-center'>
              <Image
                src='/assets/PyInvest-logomark.png'
                alt='PyInvest logo'
                width={40}
                height={40}
                className='h-10 w-10'
              />
            </div>
            <div>
              <h1 className='text-2xl font-medium text-gray-900'>PyInvest</h1>
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

        {/* Investment Options */}
        <div className='space-y-4'>
          <h2 className='px-2 text-xl font-medium text-gray-900'>
            Earn Strategies
          </h2>

          {/* Conservative Vault */}
          <div className='group cursor-pointer rounded-xl border border-gray-200 bg-white transition-all duration-200'>
            <div className='p-5'>
              <div className='mb-4 flex items-center justify-between'>
                <div className='flex items-center space-x-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-green-50'>
                    <Shield className='h-5 w-5 text-green-600' />
                  </div>
                  <div>
                    <h3 className='text-base font-medium text-gray-900'>
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
                  <span className='text-base font-medium text-green-600'>
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
                   <div className="relative w-full overflow-hidden">
                     <div className={`flex w-full gap-2 transition-all duration-250 ease-in-out ${
                       showConservativeCustom ? 'transform -translate-x-full opacity-0' : 'transform translate-x-0 opacity-100'
                     }`}>
                       <div role="radiogroup" className='flex w-full gap-2'>
                         {['25', '50', '100', '250'].map((amount) => (
                           <button
                             key={amount}
                             type="button"
                             onClick={() => {
                               if (conservativeAmount === amount) {
                                 setConservativeAmount('');
                               } else {
                                 setConservativeAmount(amount);
                               }
                             }}
                             className={`flex w-full cursor-pointer justify-center rounded-md border-[1.5px] py-2 text-center text-sm leading-normal transition-colors hover:bg-gray-50 ${
                               conservativeAmount === amount
                                 ? 'border-blue-600 bg-blue-50 text-blue-700'
                                 : 'border-gray-300 text-gray-600'
                             }`}
                           >
                             ${amount}
                           </button>
                         ))}
                       </div>
                       <button
                         type="button"
                         onClick={() => setShowConservativeCustom(true)}
                         className="flex min-w-[42px] items-center justify-center rounded-md border-[1.5px] border-gray-300 py-2 text-gray-600 hover:bg-gray-50 transition-colors"
                       >
                         <Edit3 className="h-4 w-4" />
                       </button>
                     </div>
                     <div className={`absolute inset-0 flex w-full gap-2 transition-all duration-250 ease-in-out ${
                       showConservativeCustom ? 'transform translate-x-0 opacity-100' : 'transform translate-x-full opacity-0'
                     }`}>
                       <input
                         type="number"
                         value={conservativeCustomValue}
                         onChange={(e) => setConservativeCustomValue(e.target.value)}
                         onKeyDown={(e) => {
                           if (e.key === 'Enter') {
                             handleConservativeCustomSubmit();
                           } else if (e.key === 'Escape') {
                             handleConservativeCustomCancel();
                           }
                         }}
                         placeholder="Enter amount"
                         className="flex-1 rounded-md border-[1.5px] border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                         autoFocus={showConservativeCustom}
                       />
                       <button
                         type="button"
                         onClick={handleConservativeCustomSubmit}
                         className="flex min-w-[42px] items-center justify-center rounded-md border-[1.5px] border-green-500 bg-green-50 py-2 text-green-600 hover:bg-green-100 transition-colors font-bold"
                       >
                         ✓
                       </button>
                       <button
                         type="button"
                         onClick={handleConservativeCustomCancel}
                         className="flex min-w-[42px] items-center justify-center rounded-md border-[1.5px] border-gray-300 py-2 text-gray-600 hover:bg-gray-50 transition-colors font-bold"
                       >
                         ✕
                       </button>
                     </div>
                   </div>
                 </div>
              </div>

                                          {/* Press to Confirm Button */}
              <div className={`relative h-11 w-full overflow-hidden rounded-md transition-all duration-500 ease-in-out ${
                conservativeAmount ? 'bg-blue-600' : 'bg-blue-600/30'
              }`}>
                <div
                  className={`absolute inset-0 flex items-center justify-center text-sm font-medium transition-all duration-500 ease-in-out ${
                    conservativeAmount ? 'text-white' : 'text-white/80'
                  } ${conservativeSliding ? 'opacity-0' : 'opacity-100'}`}
                >
                  <span>{conservativeAmount ? `Invest $${conservativeAmount}` : 'Select amount to invest'}</span>
                  {conservativeAmount && <ArrowRight className='ml-2 h-4 w-4' />}
                </div>
                                {/* Explosion animation */}
                <div
                  className={`absolute top-1/2 left-1/2 rounded-full flex items-center justify-center text-sm font-medium text-white transition-all duration-200 ease-out ${
                    conservativeSliding
                      ? 'w-[120%] h-[120%] -translate-x-1/2 -translate-y-1/2 opacity-100'
                      : 'w-0 h-0 -translate-x-1/2 -translate-y-1/2 opacity-0'
                  }`}
                  style={{ backgroundColor: '#10B981' }}
                >
                  <span className={conservativeSliding ? 'opacity-100' : 'opacity-0'}>✓ Confirmed!</span>
                </div>
                {conservativeAmount && (
                  <button
                    type="button"
                    onMouseDown={() => setConservativeSliding(true)}
                    onMouseUp={() => {
                      if (conservativeSliding) {
                        setTimeout(() => handleConservativeSlideComplete(), 1200);
                      }
                    }}
                    onMouseLeave={() => setConservativeSliding(false)}
                    onTouchStart={() => setConservativeSliding(true)}
                    onTouchEnd={() => {
                      if (conservativeSliding) {
                        setTimeout(() => handleConservativeSlideComplete(), 1200);
                      }
                    }}
                    className="absolute inset-0 w-full h-full bg-transparent cursor-pointer"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Growth Vault */}
          <div className='group cursor-pointer rounded-xl border border-gray-200 bg-white transition-all duration-200'>
            <div className='p-5'>
              <div className='mb-4 flex items-center justify-between'>
                <div className='flex items-center space-x-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50'>
                    <TrendingUp className='h-5 w-5 text-blue-600' />
                  </div>
                  <div>
                    <h3 className='text-base font-medium text-gray-900'>
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
                  <span className='text-base font-medium text-blue-600'>
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
                   <div className="relative w-full overflow-hidden">
                     <div className={`flex w-full gap-2 transition-all duration-250 ease-in-out ${
                       showGrowthCustom ? 'transform -translate-x-full opacity-0' : 'transform translate-x-0 opacity-100'
                     }`}>
                       <div role="radiogroup" className='flex w-full gap-2'>
                         {['25', '50', '100', '250'].map((amount) => (
                           <button
                             key={amount}
                             type="button"
                             onClick={() => {
                               if (growthAmount === amount) {
                                 setGrowthAmount('');
                               } else {
                                 setGrowthAmount(amount);
                               }
                             }}
                             className={`flex w-full cursor-pointer justify-center rounded-md border-[1.5px] py-2 text-center text-sm leading-normal transition-colors hover:bg-gray-50 ${
                               growthAmount === amount
                                 ? 'border-blue-600 bg-blue-50 text-blue-700'
                                 : 'border-gray-300 text-gray-600'
                             }`}
                           >
                             ${amount}
                           </button>
                         ))}
                       </div>
                       <button
                         type="button"
                         onClick={() => setShowGrowthCustom(true)}
                         className="flex min-w-[42px] items-center justify-center rounded-md border-[1.5px] border-gray-300 py-2 text-gray-600 hover:bg-gray-50 transition-colors"
                       >
                         <Edit3 className="h-4 w-4" />
                       </button>
                     </div>
                     <div className={`absolute inset-0 flex w-full gap-2 transition-all duration-250 ease-in-out ${
                       showGrowthCustom ? 'transform translate-x-0 opacity-100' : 'transform translate-x-full opacity-0'
                     }`}>
                       <input
                         type="number"
                         value={growthCustomValue}
                         onChange={(e) => setGrowthCustomValue(e.target.value)}
                         onKeyDown={(e) => {
                           if (e.key === 'Enter') {
                             handleGrowthCustomSubmit();
                           } else if (e.key === 'Escape') {
                             handleGrowthCustomCancel();
                           }
                         }}
                         placeholder="Enter amount"
                         className="flex-1 rounded-md border-[1.5px] border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                         autoFocus={showGrowthCustom}
                       />
                       <button
                         type="button"
                         onClick={handleGrowthCustomSubmit}
                         className="flex min-w-[42px] items-center justify-center rounded-md border-[1.5px] border-green-500 bg-green-50 py-2 text-green-600 hover:bg-green-100 transition-colors font-bold"
                       >
                         ✓
                       </button>
                       <button
                         type="button"
                         onClick={handleGrowthCustomCancel}
                         className="flex min-w-[42px] items-center justify-center rounded-md border-[1.5px] border-gray-300 py-2 text-gray-600 hover:bg-gray-50 transition-colors font-bold"
                       >
                         ✕
                       </button>
                     </div>
                   </div>
                 </div>
              </div>

                                          {/* Press to Confirm Button */}
              <div className={`relative h-11 w-full overflow-hidden rounded-md transition-all duration-500 ease-in-out ${
                growthAmount ? 'bg-blue-600' : 'bg-blue-600/30'
              }`}>
                <div
                  className={`absolute inset-0 flex items-center justify-center text-sm font-medium transition-all duration-500 ease-in-out ${
                    growthAmount ? 'text-white' : 'text-white/80'
                  } ${growthSliding ? 'opacity-0' : 'opacity-100'}`}
                >
                  <span>{growthAmount ? `Invest $${growthAmount}` : 'Select amount to invest'}</span>
                  {growthAmount && <ArrowRight className='ml-2 h-4 w-4' />}
                </div>
                                {/* Explosion animation */}
                <div
                  className={`absolute top-1/2 left-1/2 rounded-full flex items-center justify-center text-sm font-medium text-white transition-all duration-200 ease-out ${
                    growthSliding
                      ? 'w-[120%] h-[120%] -translate-x-1/2 -translate-y-1/2 opacity-100'
                      : 'w-0 h-0 -translate-x-1/2 -translate-y-1/2 opacity-0'
                  }`}
                  style={{ backgroundColor: '#10B981' }}
                >
                  <span className={growthSliding ? 'opacity-100' : 'opacity-0'}>✓ Confirmed!</span>
                </div>
                {growthAmount && (
                  <button
                    type="button"
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
                    className="absolute inset-0 w-full h-full bg-transparent cursor-pointer"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className='rounded-lg border-0 bg-gradient-to-r from-blue-600 to-blue-700'>
          <div className='p-6 text-white'>
            <div className='mb-3 flex items-center space-x-2'>
              <Zap className='h-5 w-5' />
              <h3 className='font-medium'>Instant Deployment</h3>
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
