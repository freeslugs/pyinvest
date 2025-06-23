'use client';

import { usePrivy } from '@privy-io/react-auth';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import YieldProjectionChart from '../../components/YieldProjectionChart';

interface VaultOption {
  id: string;
  name: string;
  apy: number;
  risk: 'Low' | 'Medium' | 'High';
  symbol: string;
  description: string;
  color: string;
}

const vaultOptions: VaultOption[] = [
  {
    id: 'conservative',
    name: 'Conservative Vault',
    apy: 4.2,
    risk: 'Low',
    symbol: 'PYUSD',
    description: 'Conservative stablecoin strategy with consistent returns',
    color: 'from-blue-50 to-blue-100',
  },
  {
    id: 'growth',
    name: 'Growth Vault',
    apy: 8.5,
    risk: 'Medium',
    symbol: 'PYUSD',
    description: 'Diversified DeFi strategies for moderate growth',
    color: 'from-green-50 to-green-100',
  },
];

export default function AnalyticsPage() {
  const [selectedVault, setSelectedVault] = useState<VaultOption>(
    vaultOptions[0] || {
      id: 'conservative',
      name: 'Conservative Vault',
      apy: 4.2,
      risk: 'Low' as const,
      symbol: 'PYUSD',
      description: 'Conservative stablecoin strategy with consistent returns',
      color: 'from-blue-50 to-blue-100',
    }
  );
  const [depositAmount, setDepositAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('1000');
  const router = useRouter();
  const { ready, authenticated } = usePrivy();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-white'>
        <div className='h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
      </div>
    );
  }

  const handleAmountChange = (value: string) => {
    setCustomAmount(value);
    const numValue = parseFloat(value) || 0;
    setDepositAmount(numValue);
  };

  const quickAmounts = [500, 1000, 5000, 10000, 25000];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial='hidden'
      animate='visible'
      className='min-h-screen bg-white p-4'
    >
      <div className='mx-auto max-w-md space-y-8'>
        {/* Header */}
        <motion.div variants={itemVariants} className='px-2 pb-4 pt-12'>
          <div className='mb-6 flex items-center'>
            <a
              href='/dashboard'
              className='flex items-center text-gray-600 transition-colors hover:text-gray-900'
            >
              <ArrowLeft className='mr-2 h-5 w-5' />
              <span className='text-base font-medium'>Back to Dashboard</span>
            </a>
          </div>
          <div>
            <h1 className='mb-2 text-3xl font-medium leading-tight tracking-tight text-gray-900'>
              Investment Analytics
            </h1>
            <p className='text-base leading-relaxed text-gray-600'>
              Visualize your potential returns with interactive yield
              projections.
            </p>
          </div>
        </motion.div>

        {/* Amount Selection */}
        <motion.div
          variants={itemVariants}
          className='rounded-xl border border-gray-200 bg-white shadow-sm'
        >
          <div className='p-6'>
            <h2 className='mb-5 text-xl font-medium text-gray-900'>
              Initial Deposit Amount
            </h2>

            {/* Quick Amount Buttons */}
            <div className='mb-4 space-y-3'>
              <div className='text-base font-medium text-gray-900'>
                Select amount
              </div>
              <div className='flex flex-wrap gap-2'>
                {quickAmounts.map(amount => (
                  <button
                    key={amount}
                    onClick={() => {
                      setDepositAmount(amount);
                      setCustomAmount(amount.toString());
                    }}
                    className={`flex cursor-pointer justify-center rounded-md border px-3 py-2 text-center text-sm font-normal leading-normal transition-colors hover:bg-gray-50 ${
                      depositAmount === amount
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    ${amount.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div className='space-y-3'>
              <div className='text-base font-medium text-gray-900'>
                Custom amount
              </div>
              <div className='relative'>
                <span className='absolute left-3 top-1/2 -translate-y-1/2 transform font-medium text-gray-500'>
                  $
                </span>
                <input
                  type='number'
                  value={customAmount}
                  onChange={e => handleAmountChange(e.target.value)}
                  placeholder='Enter custom amount'
                  className='w-full rounded-lg border border-gray-300 py-3 pl-8 pr-4 text-base text-gray-700 placeholder-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600'
                  min='0'
                  step='100'
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Vault Selection */}
        <motion.div variants={itemVariants} className='space-y-4'>
          <h2 className='px-2 text-2xl font-medium text-gray-900'>
            Select Vault Strategy
          </h2>

          {vaultOptions.map(vault => (
            <div
              key={vault.id}
              onClick={() => setSelectedVault(vault)}
              className={`cursor-pointer rounded-2xl border transition-all duration-200 ${
                selectedVault.id === vault.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className='p-6'>
                {/* Header Bar */}
                <div className='mb-5 flex items-center justify-between border-b border-gray-100 pb-4'>
                  <div className='flex items-center space-x-2'>
                    <Globe className='h-4 w-4 text-gray-400' />
                    <span className='text-base font-medium text-gray-700'>
                      {vault.name}
                    </span>
                  </div>
                  <div className='flex items-center space-x-1'>
                    <CheckCircle className='h-4 w-4 text-blue-500' />
                    <span className='text-sm font-medium text-blue-600'>
                      {vault.apy}% APY
                    </span>
                  </div>
                </div>

                {/* Risk and Description */}
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <span className='text-base font-medium text-gray-600'>
                      Risk level
                    </span>
                    <span className='text-base font-medium text-gray-900'>
                      {vault.risk}
                    </span>
                  </div>
                  <p className='text-base text-gray-600'>{vault.description}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Yield Projection Chart */}
        <motion.div variants={itemVariants}>
          <YieldProjectionChart
            initialDeposit={depositAmount}
            apy={selectedVault.apy}
            symbol={selectedVault.symbol}
            title={`${selectedVault.name} - Yield Projection`}
            className='rounded-xl border border-gray-200 bg-white shadow-sm'
          />
        </motion.div>

        {/* Summary Cards */}
        <motion.div variants={itemVariants} className='space-y-4'>
          <h2 className='px-2 text-2xl font-medium text-gray-900'>
            Projected Returns
          </h2>

          <div className='grid grid-cols-2 gap-4'>
            {[1, 2, 3, 5].map(years => {
              const monthlyRate = selectedVault.apy / 100 / 12;
              const totalMonths = years * 12;
              const finalAmount =
                depositAmount * Math.pow(1 + monthlyRate, totalMonths);
              const totalInterest = finalAmount - depositAmount;

              return (
                <div
                  key={years}
                  className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm'
                >
                  <div className='space-y-2 text-center'>
                    <h3 className='text-base font-medium text-gray-900'>
                      {years} Year{years > 1 ? 's' : ''}
                    </h3>
                    <p className='text-xl font-medium text-gray-900'>
                      ${Math.round(finalAmount).toLocaleString()}
                    </p>
                    <p className='text-sm font-medium text-green-600'>
                      +${Math.round(totalInterest).toLocaleString()}
                    </p>
                    <p className='text-sm text-gray-500'>
                      {((totalInterest / depositAmount) * 100).toFixed(1)}%
                      growth
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Disclaimer */}
        <motion.div
          variants={itemVariants}
          className='rounded-xl border border-gray-200 bg-gray-50 p-4'
        >
          <p className='text-sm leading-relaxed text-gray-600'>
            <span className='font-medium'>Disclaimer:</span> These projections
            are estimates based on current APY rates and assume compound growth.
            Actual returns may vary due to market conditions and other factors.
          </p>
        </motion.div>

        {/* Footer spacing */}
        <div className='pb-8'></div>
      </div>
    </motion.div>
  );
}
