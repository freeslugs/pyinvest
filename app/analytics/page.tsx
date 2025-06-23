'use client';

import { usePrivy } from '@privy-io/react-auth';
import { motion } from 'framer-motion';
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
    id: 'stable',
    name: 'Stable Yield Vault',
    apy: 4.2,
    risk: 'Low',
    symbol: 'PYUSD',
    description: 'Conservative stablecoin strategy with consistent returns',
    color: 'from-blue-50 to-blue-100',
  },
  {
    id: 'balanced',
    name: 'Balanced Growth Vault',
    apy: 7.8,
    risk: 'Medium',
    symbol: 'PYUSD',
    description: 'Diversified DeFi strategies for moderate growth',
    color: 'from-green-50 to-green-100',
  },
  {
    id: 'aggressive',
    name: 'High Yield Vault',
    apy: 12.5,
    risk: 'High',
    symbol: 'PYUSD',
    description: 'Advanced strategies targeting maximum returns',
    color: 'from-purple-50 to-purple-100',
  },
];

export default function AnalyticsPage() {
  const [selectedVault, setSelectedVault] = useState<VaultOption>(vaultOptions[0] || {
    id: 'stable',
    name: 'Stable Yield Vault',
    apy: 4.2,
    risk: 'Low' as const,
    symbol: 'PYUSD',
    description: 'Conservative stablecoin strategy with consistent returns',
    color: 'from-blue-50 to-blue-100',
  });
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-privy-navy"></div>
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
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gradient-to-br from-privy-light-blue via-white to-privy-blueish"
    >
      <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <a
              href="/dashboard"
              className="flex items-center text-gray-600 hover:text-privy-navy transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </a>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-privy-navy mb-4">
              Investment Analytics
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Visualize your potential returns with our interactive yield projection tool.
              Adjust your deposit amount and vault selection to see how your investment could grow over time.
            </p>
          </div>
        </motion.div>

        {/* Controls Section */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Investment Parameters</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Deposit Amount Controls */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Initial Deposit Amount
              </label>

              {/* Quick Amount Buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => {
                      setDepositAmount(amount);
                      setCustomAmount(amount.toString());
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      depositAmount === amount
                        ? 'bg-privy-navy text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    ${amount.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Custom Amount Input */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                  $
                </span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="Enter custom amount"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-privy-navy focus:border-transparent"
                  min="0"
                  step="100"
                />
              </div>
            </div>

            {/* Vault Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Vault Strategy
              </label>

              <div className="space-y-3">
                {vaultOptions.map((vault) => (
                  <div
                    key={vault.id}
                    onClick={() => setSelectedVault(vault)}
                    className={`cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 ${
                      selectedVault.id === vault.id
                        ? 'border-privy-navy bg-privy-light-blue'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{vault.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          vault.risk === 'Low' ? 'bg-green-100 text-green-800' :
                          vault.risk === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {vault.risk} Risk
                        </span>
                        <span className="text-xl font-bold text-privy-navy">
                          {vault.apy}% APY
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{vault.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Yield Projection Chart */}
        <motion.div variants={itemVariants}>
          <YieldProjectionChart
            initialDeposit={depositAmount}
            apy={selectedVault.apy}
            symbol={selectedVault.symbol}
            title={`${selectedVault.name} - Yield Projection`}
            className="mb-8"
          />
        </motion.div>

        {/* Summary Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 5].map((years) => {
            const monthlyRate = selectedVault.apy / 100 / 12;
            const totalMonths = years * 12;
            const finalAmount = depositAmount * Math.pow(1 + monthlyRate, totalMonths);
            const totalInterest = finalAmount - depositAmount;

            return (
              <div
                key={years}
                className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-privy-navy"
              >
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {years} Year{years > 1 ? 's' : ''}
                  </h3>
                  <p className="text-3xl font-bold text-privy-navy mb-1">
                    ${Math.round(finalAmount).toLocaleString()}
                  </p>
                  <p className="text-sm text-green-600 font-medium">
                    +${Math.round(totalInterest).toLocaleString()} earned
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {((totalInterest / depositAmount) * 100).toFixed(1)}% growth
                  </p>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Disclaimer */}
        <motion.div variants={itemVariants} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Disclaimer:</strong> These projections are estimates based on current APY rates and assume compound growth.
            Actual returns may vary due to market conditions, vault performance, and other factors.
            Past performance does not guarantee future results. Please consider your risk tolerance before investing.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
