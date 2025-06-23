'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface YieldProjectionProps {
  initialDeposit: number;
  apy: number;
  symbol?: string;
  title?: string;
  className?: string;
}

interface DataPoint {
  month: number;
  year: string;
  principal: number;
  interest: number;
  total: number;
  displayMonth: string;
}

const YieldProjectionChart: React.FC<YieldProjectionProps> = ({
  initialDeposit,
  apy,
  symbol = 'PYUSD',
  title = 'Yield Projection',
  className = '',
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'1Y' | '2Y' | '3Y'>(
    '3Y'
  );

  // Calculate compound interest data
  const calculateYieldData = (years: number): DataPoint[] => {
    const monthlyRate = apy / 100 / 12;
    const data: DataPoint[] = [];
    const totalMonths = years * 12;

    for (let month = 0; month <= totalMonths; month++) {
      const compound = initialDeposit * Math.pow(1 + monthlyRate, month);
      const interest = compound - initialDeposit;

      data.push({
        month,
        year:
          month === 0 ? 'Start' : `${Math.floor(month / 12)}Y ${month % 12}M`,
        principal: initialDeposit,
        interest: interest,
        total: compound,
        displayMonth:
          month === 0
            ? 'Start'
            : month % 12 === 0
              ? `Year ${month / 12}`
              : `${Math.floor(month / 12)}Y ${month % 12}M`,
      });
    }

    return data;
  };

  const getCurrentData = () => {
    const years = selectedPeriod === '1Y' ? 1 : selectedPeriod === '2Y' ? 2 : 3;
    return calculateYieldData(years);
  };

  const data = getCurrentData();
  const finalValue = data[data.length - 1] || {
    total: initialDeposit,
    interest: 0,
    principal: initialDeposit,
  };

  // Animation variants
  const chartVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
        when: 'beforeChildren',
        staggerChildren: 0.1,
      },
    },
  };

  const statVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className='rounded-lg border border-gray-200 bg-white p-4 shadow-lg'
        >
          <p className='font-medium text-gray-900'>{data.displayMonth}</p>
          <p className='text-sm text-gray-600'>
            Principal:{' '}
            <span className='font-medium text-gray-900'>
              ${data.principal.toLocaleString()}
            </span>
          </p>
          <p className='text-sm text-gray-600'>
            Interest:{' '}
            <span className='font-medium text-green-600'>
              +${data.interest.toLocaleString()}
            </span>
          </p>
          <p className='text-sm font-medium text-gray-900'>
            Total:{' '}
            <span className='text-blue-600'>
              ${data.total.toLocaleString()}
            </span>
          </p>
        </motion.div>
      );
    }
    return null;
  };

  return (
    <motion.div
      variants={chartVariants}
      initial='hidden'
      animate='visible'
      className={`bg-white p-6 ${className}`}
    >
      {/* Header */}
      <div className='mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between'>
        <motion.div variants={statVariants}>
          <h3 className='mb-1 text-xl font-medium text-gray-900'>{title}</h3>
          <p className='text-base text-gray-600'>
            {initialDeposit.toLocaleString()} {symbol} @ {apy}% APY
          </p>
        </motion.div>

        {/* Period Selector */}
        <motion.div variants={statVariants} className='mt-4 flex gap-2 sm:mt-0'>
          {(['1Y', '2Y', '3Y'] as const).map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`flex cursor-pointer justify-center rounded-md border px-3 py-2 text-center text-sm font-normal leading-normal transition-colors hover:bg-gray-50 ${
                selectedPeriod === period
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-gray-200 text-gray-500'
              }`}
            >
              {period}
            </button>
          ))}
        </motion.div>
      </div>

      {/* Key Stats */}
      <div className='mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3'>
        <motion.div
          variants={statVariants}
          className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm'
        >
          <p className='mb-1 text-base font-medium text-gray-600'>
            Final Value
          </p>
          <p className='text-xl font-medium text-gray-900'>
            ${finalValue.total.toLocaleString()}
          </p>
        </motion.div>

        <motion.div
          variants={statVariants}
          className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm'
        >
          <p className='mb-1 text-base font-medium text-gray-600'>
            Total Interest
          </p>
          <p className='text-xl font-medium text-green-600'>
            +${finalValue.interest.toLocaleString()}
          </p>
        </motion.div>

        <motion.div
          variants={statVariants}
          className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm'
        >
          <p className='mb-1 text-base font-medium text-gray-600'>Growth</p>
          <p className='text-xl font-medium text-blue-600'>
            +{((finalValue.interest / initialDeposit) * 100).toFixed(1)}%
          </p>
        </motion.div>
      </div>

      {/* Chart */}
      <motion.div variants={statVariants} className='h-80 w-full'>
        <ResponsiveContainer width='100%' height='100%'>
          <ComposedChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <defs>
              <linearGradient id='totalGradient' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='#2563eb' stopOpacity={0.3} />
                <stop offset='95%' stopColor='#2563eb' stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id='interestGradient' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='#10B981' stopOpacity={0.3} />
                <stop offset='95%' stopColor='#10B981' stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
            <XAxis
              dataKey='displayMonth'
              tick={{ fontSize: 12 }}
              stroke='#6b7280'
              interval='preserveStartEnd'
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke='#6b7280'
              tickFormatter={value => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Interest Area */}
            <Area
              type='monotone'
              dataKey='interest'
              stackId='1'
              stroke='#10B981'
              fill='url(#interestGradient)'
              strokeWidth={2}
            />

            {/* Total Line */}
            <Line
              type='monotone'
              dataKey='total'
              stroke='#2563eb'
              strokeWidth={3}
              dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
              activeDot={{
                r: 6,
                stroke: '#2563eb',
                strokeWidth: 2,
                fill: '#fff',
              }}
              animationDuration={2000}
              animationBegin={0}
            />

            {/* Principal Line */}
            <Line
              type='monotone'
              dataKey='principal'
              stroke='#6b7280'
              strokeWidth={2}
              strokeDasharray='5 5'
              dot={false}
              activeDot={{
                r: 4,
                stroke: '#6b7280',
                strokeWidth: 2,
                fill: '#fff',
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Legend */}
      <motion.div
        variants={statVariants}
        className='mt-4 flex flex-wrap justify-center gap-6 text-sm'
      >
        <div className='flex items-center gap-2'>
          <div className='h-0.5 w-4 bg-blue-600'></div>
          <span className='text-gray-600'>Total Value</span>
        </div>
        <div className='flex items-center gap-2'>
          <div className='h-0.5 w-4 bg-green-500'></div>
          <span className='text-gray-600'>Interest Earned</span>
        </div>
        <div className='flex items-center gap-2'>
          <div className='h-0.5 w-4 border-t border-dashed bg-gray-400'></div>
          <span className='text-gray-600'>Principal</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default YieldProjectionChart;
