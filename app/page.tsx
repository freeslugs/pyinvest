import { BoltIcon, ChartBarIcon, ClockIcon, CurrencyDollarIcon, ShieldCheckIcon } from '@heroicons/react/24/solid';
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
      <header className="bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div className="flex items-center">
              <Logo fontColor="#000000" />
            </div>
            <div>
              <HeaderButton isAuthenticated={isAuthenticated} />
            </div>
          </div>
        </div>
      </header>

      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
            <div className="text-center">
              <h1 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-gray-900 mb-4 sm:mb-6 leading-tight sm:leading-relaxed ${adelleSans.className} animate-fade-in`}>
                The easiest way to put<br className="hidden sm:block" />
                <span className="sm:hidden"> </span>
                <span className="text-blue-600 inline-flex items-center gap-2 sm:gap-4 flex-wrap justify-center">
                  digital money
                  <Image
                    src="/assets/pyusd_logo.png"
                    alt="PyUSD"
                    width={36}
                    height={36}
                    className="inline-block sm:w-12 sm:h-12"
                    style={{ marginTop: '4px' }}
                  />
                  to work.
                </span><br />
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto font-extralight animate-fade-in-delay px-4 sm:px-0">
                Skip the complexity of traditional investing. Get started with PyInvest and
                watch your digital assets grow with institutional-grade security.
              </p>

              {/* CTA Button with Trust Indicators */}
              <div className="flex flex-col items-center space-y-4 sm:space-y-6">
                <div className="animate-fade-in-delay-2">
                  <HeroCTAButton isAuthenticated={isAuthenticated} />
                </div>

                {/* Trust Indicators */}
                <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 text-gray-500 animate-fade-in-delay-3">
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <span className="text-xs sm:text-sm font-light">Under 3 minutes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ShieldCheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <span className="text-xs sm:text-sm font-light">Bank-grade security</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-12 sm:py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-gray-900 mb-3 sm:mb-4">
                Why PyInvest beats traditional savings
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4 sm:px-0">
                Compare the advantages of digital investing with PyInvest versus
                traditional CDs and high-yield savings accounts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {/* Higher Returns */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="bg-blue-50 p-3 sm:p-4 rounded-2xl w-fit mb-4 sm:mb-6">
                  <ChartBarIcon className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-medium text-gray-900 mb-3 sm:mb-4">Higher Returns</h3>
                <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                  Earn up to 8-12% APY with digital assets compared to 0.5-2% with traditional savings accounts.
                </p>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-500 text-xs sm:text-sm">Traditional CD</span>
                    <span className="text-gray-400 font-medium text-xs sm:text-sm">0.5-2% APY</span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-500 text-xs sm:text-sm">High-yield Savings</span>
                    <span className="text-gray-400 font-medium text-xs sm:text-sm">2-4% APY</span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-blue-900 font-semibold text-xs sm:text-sm">PyInvest</span>
                    <span className="text-blue-600 font-bold text-xs sm:text-sm">8-12% APY</span>
                  </div>
                </div>
              </div>

              {/* Instant Liquidity */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="bg-blue-50 p-3 sm:p-4 rounded-2xl w-fit mb-4 sm:mb-6">
                  <CurrencyDollarIcon className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-medium text-gray-900 mb-3 sm:mb-4">Instant Access</h3>
                <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                  Access your funds anytime without penalties, unlike CDs that lock up your money for months or years.
                </p>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-500 text-xs sm:text-sm">Traditional CD</span>
                    <span className="text-gray-400 font-medium text-xs sm:text-sm">Locked 6mo-5yr</span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-500 text-xs sm:text-sm">Savings Account</span>
                    <span className="text-gray-400 font-medium text-xs sm:text-sm">Limited transfers</span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-blue-900 font-semibold text-xs sm:text-sm">PyInvest</span>
                    <span className="text-blue-600 font-bold text-xs sm:text-sm">Instant access</span>
                  </div>
                </div>
              </div>

              {/* Simple Setup */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="bg-blue-50 p-3 sm:p-4 rounded-2xl w-fit mb-4 sm:mb-6">
                  <BoltIcon className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-medium text-gray-900 mb-3 sm:mb-4">Simple Setup</h3>
                <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                  Get started in under 3 minutes with no minimum deposits, paperwork, or lengthy approval processes.
                </p>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-500 text-xs sm:text-sm">Traditional CD</span>
                    <span className="text-gray-400 font-medium text-xs sm:text-sm">Days to weeks</span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-500 text-xs sm:text-sm">Bank Account</span>
                    <span className="text-gray-400 font-medium text-xs sm:text-sm">1-3 days</span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-blue-900 font-semibold text-xs sm:text-sm">PyInvest</span>
                    <span className="text-blue-600 font-bold text-xs sm:text-sm">Under 3 minutes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-700 py-12 sm:py-16 lg:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-white mb-4 sm:mb-6">
              Ready to put your money to work?
            </h2>
            <p className="text-lg sm:text-xl text-blue-100 mb-6 sm:mb-8 px-4 sm:px-0">
              Join thousands of users who have already started earning more with PyInvest.
            </p>
            <FinalCTAButton isAuthenticated={isAuthenticated} />
          </div>
        </section>
      </main>
    </>
  );
}
