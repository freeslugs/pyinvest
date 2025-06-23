import {
  BoltIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/solid';
import { PrivyClient } from '@privy-io/server-auth';
import { cookies } from 'next/headers';
import Image from 'next/image';

import {
  FinalCTAButton,
  HeaderButton,
  HeroCTAButton,
} from '../components/homepage-client';
import { Logo } from '../components/logo';
import { adelleSans } from '../lib/fonts';

async function checkAuth() {
  const cookieStore = await cookies();
  const cookieAuthToken = cookieStore.get('privy-token')?.value;

  // If no cookie is found, skip any further checks
  if (!cookieAuthToken) return false;

  const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;

  if (!PRIVY_APP_ID || !PRIVY_APP_SECRET) {
    console.error('Missing Privy environment variables');
    return false;
  }

  const client = new PrivyClient(PRIVY_APP_ID, PRIVY_APP_SECRET);

  try {
    await client.verifyAuthToken(cookieAuthToken);
    return true;
  } catch (error) {
    return false;
  }
}

export const metadata = {
  title: 'PyInvest - Easily & securely put digital money to work',
  description: 'Easily & securely put digital money to work in 1 click',
};

export default async function HomePage() {
  const isAuthenticated = await checkAuth();

  return (
    <>
      {/* Header */}
      <header className='bg-transparent'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between py-4 sm:py-6'>
            <div className='flex items-center'>
              <Logo fontColor='#000000' />
            </div>
            <div>
              <HeaderButton isAuthenticated={isAuthenticated} />
            </div>
          </div>
        </div>
      </header>

      <main className='min-h-screen bg-white'>
        {/* Hero Section */}
        <section className='bg-white'>
          <div className='mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20'>
            <div className='text-center'>
              <h1
                className={`mb-4 text-3xl font-semibold leading-tight text-gray-900 sm:mb-6 sm:text-4xl sm:leading-relaxed md:text-5xl lg:text-6xl ${adelleSans.className} animate-fade-in`}
              >
                The easiest way to put
                <br className='hidden sm:block' />
                <span className='sm:hidden'> </span>
                <span className='inline-flex flex-wrap items-center justify-center gap-2 text-blue-600 sm:gap-4'>
                  digital money
                  <Image
                    src='/assets/pyusd_logo.png'
                    alt='PyUSD'
                    width={36}
                    height={36}
                    className='inline-block sm:h-12 sm:w-12'
                    style={{ marginTop: '4px' }}
                  />
                  to work.
                </span>
                <br />
              </h1>
              <p className='animate-fade-in-delay mx-auto mb-6 max-w-2xl px-4 text-lg font-extralight text-gray-600 sm:mb-8 sm:px-0 sm:text-xl'>
                Skip the complexity of traditional investing. Get started with
                PyInvest and watch your digital assets grow with
                institutional-grade security.
              </p>

              {/* CTA Button with Trust Indicators */}
              <div className='flex flex-col items-center space-y-4 sm:space-y-6'>
                <div className='animate-fade-in-delay-2'>
                  <HeroCTAButton isAuthenticated={isAuthenticated} />
                </div>

                {/* Trust Indicators */}
                <div className='animate-fade-in-delay-3 flex flex-col items-center space-y-2 text-gray-500 sm:flex-row sm:space-x-6 sm:space-y-0'>
                  <div className='flex items-center space-x-2'>
                    <ClockIcon className='h-4 w-4 text-gray-400 sm:h-5 sm:w-5' />
                    <span className='text-xs font-light sm:text-sm'>
                      Under 3 minutes
                    </span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <ShieldCheckIcon className='h-4 w-4 text-gray-400 sm:h-5 sm:w-5' />
                    <span className='text-xs font-light sm:text-sm'>
                      Bank-grade security
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className='py-12 sm:py-16 lg:py-20'>
          <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
            <div className='mb-8 text-center sm:mb-12 lg:mb-16'>
              <h2 className='mb-3 text-2xl font-medium text-gray-900 sm:mb-4 sm:text-3xl lg:text-4xl'>
                Why PyInvest beats traditional savings
              </h2>
              <p className='mx-auto max-w-3xl px-4 text-lg text-gray-600 sm:px-0 sm:text-xl'>
                Compare the advantages of digital investing with PyInvest versus
                traditional CDs and high-yield savings accounts.
              </p>
            </div>

            <div className='grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3'>
              {/* Higher Returns */}
              <div className='rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:p-8'>
                <div className='mb-4 w-fit rounded-2xl bg-blue-50 p-3 sm:mb-6 sm:p-4'>
                  <ChartBarIcon className='h-8 w-8 text-blue-600 sm:h-10 sm:w-10' />
                </div>
                <h3 className='mb-3 text-xl font-medium text-gray-900 sm:mb-4 sm:text-2xl'>
                  Higher Returns
                </h3>
                <p className='mb-4 text-sm text-gray-600 sm:mb-6 sm:text-base'>
                  Earn up to 8-12% APY with digital assets compared to 0.5-2%
                  with traditional savings accounts.
                </p>
                <div className='space-y-2 sm:space-y-3'>
                  <div className='flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2'>
                    <span className='text-xs text-gray-500 sm:text-sm'>
                      Traditional CD
                    </span>
                    <span className='text-xs font-medium text-gray-400 sm:text-sm'>
                      0.5-2% APY
                    </span>
                  </div>
                  <div className='flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2'>
                    <span className='text-xs text-gray-500 sm:text-sm'>
                      High-yield Savings
                    </span>
                    <span className='text-xs font-medium text-gray-400 sm:text-sm'>
                      2-4% APY
                    </span>
                  </div>
                  <div className='flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2'>
                    <span className='text-xs font-semibold text-blue-900 sm:text-sm'>
                      PyInvest
                    </span>
                    <span className='text-xs font-bold text-blue-600 sm:text-sm'>
                      8-12% APY
                    </span>
                  </div>
                </div>
              </div>

              {/* Instant Liquidity */}
              <div className='rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:p-8'>
                <div className='mb-4 w-fit rounded-2xl bg-blue-50 p-3 sm:mb-6 sm:p-4'>
                  <CurrencyDollarIcon className='h-8 w-8 text-blue-600 sm:h-10 sm:w-10' />
                </div>
                <h3 className='mb-3 text-xl font-medium text-gray-900 sm:mb-4 sm:text-2xl'>
                  Instant Access
                </h3>
                <p className='mb-4 text-sm text-gray-600 sm:mb-6 sm:text-base'>
                  Access your funds anytime without penalties, unlike CDs that
                  lock up your money for months or years.
                </p>
                <div className='space-y-2 sm:space-y-3'>
                  <div className='flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2'>
                    <span className='text-xs text-gray-500 sm:text-sm'>
                      Traditional CD
                    </span>
                    <span className='text-xs font-medium text-gray-400 sm:text-sm'>
                      Locked 6mo-5yr
                    </span>
                  </div>
                  <div className='flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2'>
                    <span className='text-xs text-gray-500 sm:text-sm'>
                      Savings Account
                    </span>
                    <span className='text-xs font-medium text-gray-400 sm:text-sm'>
                      Limited transfers
                    </span>
                  </div>
                  <div className='flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2'>
                    <span className='text-xs font-semibold text-blue-900 sm:text-sm'>
                      PyInvest
                    </span>
                    <span className='text-xs font-bold text-blue-600 sm:text-sm'>
                      Instant access
                    </span>
                  </div>
                </div>
              </div>

              {/* Simple Setup */}
              <div className='rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:p-8'>
                <div className='mb-4 w-fit rounded-2xl bg-blue-50 p-3 sm:mb-6 sm:p-4'>
                  <BoltIcon className='h-8 w-8 text-blue-600 sm:h-10 sm:w-10' />
                </div>
                <h3 className='mb-3 text-xl font-medium text-gray-900 sm:mb-4 sm:text-2xl'>
                  Simple Setup
                </h3>
                <p className='mb-4 text-sm text-gray-600 sm:mb-6 sm:text-base'>
                  Get started in under 3 minutes with no minimum deposits,
                  paperwork, or lengthy approval processes.
                </p>
                <div className='space-y-2 sm:space-y-3'>
                  <div className='flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2'>
                    <span className='text-xs text-gray-500 sm:text-sm'>
                      Traditional CD
                    </span>
                    <span className='text-xs font-medium text-gray-400 sm:text-sm'>
                      Days to weeks
                    </span>
                  </div>
                  <div className='flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2'>
                    <span className='text-xs text-gray-500 sm:text-sm'>
                      Bank Account
                    </span>
                    <span className='text-xs font-medium text-gray-400 sm:text-sm'>
                      1-3 days
                    </span>
                  </div>
                  <div className='flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2'>
                    <span className='text-xs font-semibold text-blue-900 sm:text-sm'>
                      PyInvest
                    </span>
                    <span className='text-xs font-bold text-blue-600 sm:text-sm'>
                      Under 3 minutes
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className='bg-gradient-to-r from-blue-600 to-blue-700 py-12 sm:py-16 lg:py-20'>
          <div className='mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8'>
            <h2 className='mb-4 text-2xl font-medium text-white sm:mb-6 sm:text-3xl lg:text-4xl'>
              Ready to put your money to work?
            </h2>
            <p className='mb-6 px-4 text-lg text-blue-100 sm:mb-8 sm:px-0 sm:text-xl'>
              Join thousands of users who have already started earning more with
              PyInvest.
            </p>
            <FinalCTAButton isAuthenticated={isAuthenticated} />
          </div>
        </section>
      </main>
    </>
  );
}
