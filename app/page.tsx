import { PrivyClient } from '@privy-io/server-auth';
import { cookies } from 'next/headers';

import {
  FinalCTAButton,
  HeaderButton,
  HeroCTAButton,
} from '../components/homepage-client';
import { Logo } from '../components/logo';

async function checkAuth() {
  const cookieStore = await cookies();
  const cookieAuthToken = cookieStore.get('privy-token')?.value;

  // If no cookie is found, skip any further checks
  if (!cookieAuthToken) return false;

  const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;
  const client = new PrivyClient(PRIVY_APP_ID!, PRIVY_APP_SECRET!);

  try {
    const claims = await client.verifyAuthToken(cookieAuthToken);
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
      <header className='border-b border-gray-100 bg-white'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between py-6'>
            <div className='flex items-center'>
              <Logo fontColor='#1E40AF' width='140' height='40' />
            </div>
            <div>
              <HeaderButton isAuthenticated={isAuthenticated} />
            </div>
          </div>
        </div>
      </header>

      <main className='min-h-screen bg-white'>
        {/* Hero Section */}
        <section className='bg-gradient-to-b from-blue-50 to-white'>
          <div className='mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8'>
            <div className='text-center'>
              <h1 className='mb-6 text-5xl font-bold leading-tight text-gray-900 md:text-6xl'>
                Easily & securely put
                <br />
                <span className='text-blue-600'>digital money to work</span>
                <br />
                in 1 click
              </h1>
              <p className='mx-auto mb-8 max-w-2xl text-xl text-gray-600'>
                Skip the complexity of traditional investing. Get started with
                PyInvest and watch your digital assets grow with
                institutional-grade security.
              </p>

              {/* CTA Button with Trust Indicators */}
              <div className='flex flex-col items-center space-y-6'>
                <HeroCTAButton isAuthenticated={isAuthenticated} />

                {/* Trust Indicators */}
                <div className='flex items-center space-x-6 text-gray-500'>
                  <div className='flex items-center space-x-2'>
                    <span className='font-bold text-blue-600'>⏱️</span>
                    <span className='text-sm font-medium'>Under 3 minutes</span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <span className='font-bold text-blue-600'>🔒</span>
                    <span className='text-sm font-medium'>
                      Bank-grade security
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
            <div className='mb-16 text-center'>
              <h2 className='mb-4 text-4xl font-bold text-gray-900'>
                Why PyInvest beats traditional savings
              </h2>
              <p className='mx-auto max-w-3xl text-xl text-gray-600'>
                Compare the advantages of digital investing with PyInvest versus
                traditional CDs and high-yield savings accounts.
              </p>
            </div>

            <div className='grid gap-8 md:grid-cols-3'>
              {/* Higher Returns */}
              <div className='rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md'>
                <div className='mb-6 w-fit rounded-2xl bg-blue-50 p-4'>
                  <span className='text-4xl'>📈</span>
                </div>
                <h3 className='mb-4 text-2xl font-semibold text-gray-900'>
                  Higher Returns
                </h3>
                <p className='mb-6 text-gray-600'>
                  Earn up to 8-12% APY with digital assets compared to 0.5-2%
                  with traditional savings accounts.
                </p>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <span className='text-gray-500'>Traditional CD</span>
                    <span className='font-semibold text-red-500'>
                      0.5-2% APY
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-gray-500'>High-yield Savings</span>
                    <span className='font-semibold text-orange-500'>
                      2-4% APY
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='font-medium text-gray-900'>PyInvest</span>
                    <span className='font-bold text-green-600'>8-12% APY</span>
                  </div>
                </div>
              </div>

              {/* Instant Liquidity */}
              <div className='rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md'>
                <div className='mb-6 w-fit rounded-2xl bg-green-50 p-4'>
                  <span className='text-4xl'>💰</span>
                </div>
                <h3 className='mb-4 text-2xl font-semibold text-gray-900'>
                  Instant Access
                </h3>
                <p className='mb-6 text-gray-600'>
                  Access your funds anytime without penalties, unlike CDs that
                  lock up your money for months or years.
                </p>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <span className='text-gray-500'>Traditional CD</span>
                    <span className='font-semibold text-red-500'>
                      Locked 6mo-5yr
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-gray-500'>Savings Account</span>
                    <span className='font-semibold text-orange-500'>
                      Limited transfers
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='font-medium text-gray-900'>PyInvest</span>
                    <span className='font-bold text-green-600'>
                      Instant access
                    </span>
                  </div>
                </div>
              </div>

              {/* Simple Setup */}
              <div className='rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md'>
                <div className='mb-6 w-fit rounded-2xl bg-purple-50 p-4'>
                  <span className='text-4xl'>⚡</span>
                </div>
                <h3 className='mb-4 text-2xl font-semibold text-gray-900'>
                  Simple Setup
                </h3>
                <p className='mb-6 text-gray-600'>
                  Get started in under 3 minutes with no minimum deposits,
                  paperwork, or lengthy approval processes.
                </p>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <span className='text-gray-500'>Traditional CD</span>
                    <span className='font-semibold text-red-500'>
                      Days to weeks
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-gray-500'>Bank Account</span>
                    <span className='font-semibold text-orange-500'>
                      1-3 days
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='font-medium text-gray-900'>PyInvest</span>
                    <span className='font-bold text-green-600'>
                      Under 3 minutes
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className='bg-gradient-to-r from-blue-600 to-blue-700 py-20'>
          <div className='mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8'>
            <h2 className='mb-6 text-4xl font-bold text-white'>
              Ready to put your money to work?
            </h2>
            <p className='mb-8 text-xl text-blue-100'>
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
