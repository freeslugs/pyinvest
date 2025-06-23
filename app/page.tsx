import { PrivyClient } from '@privy-io/server-auth';
import { cookies } from 'next/headers';

import { Logo } from '../components/logo';
import { Button } from '../components/ui/button';

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
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Logo fontColor="#1E40AF" width="140" height="40" />
            </div>
            <div>
              {isAuthenticated ? (
                <Button
                  onClick={() => window.location.href = '/dashboard'}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-medium"
                >
                  Open App
                </Button>
              ) : (
                <Button
                  onClick={() => window.location.href = '/login'}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-2 rounded-xl font-medium"
                >
                  Open App
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-blue-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Easily & securely put<br />
                <span className="text-blue-600">digital money to work</span><br />
                in 1 click
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Skip the complexity of traditional investing. Get started with PyInvest and
                watch your digital assets grow with institutional-grade security.
              </p>

              {/* CTA Button with Trust Indicators */}
              <div className="flex flex-col items-center space-y-6">
                <Button
                  onClick={() => window.location.href = isAuthenticated ? '/dashboard' : '/login'}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-6 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Get Started
                </Button>

                {/* Trust Indicators */}
                <div className="flex items-center space-x-6 text-gray-500">
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-600 font-bold">⏱️</span>
                    <span className="text-sm font-medium">Under 3 minutes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-600 font-bold">🔒</span>
                    <span className="text-sm font-medium">Bank-grade security</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Why PyInvest beats traditional savings
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Compare the advantages of digital investing with PyInvest versus
                traditional CDs and high-yield savings accounts.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Higher Returns */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="bg-blue-50 p-4 rounded-2xl w-fit mb-6">
                  <span className="text-4xl">📈</span>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Higher Returns</h3>
                <p className="text-gray-600 mb-6">
                  Earn up to 8-12% APY with digital assets compared to 0.5-2% with traditional savings accounts.
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Traditional CD</span>
                    <span className="text-red-500 font-semibold">0.5-2% APY</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">High-yield Savings</span>
                    <span className="text-orange-500 font-semibold">2-4% APY</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900 font-medium">PyInvest</span>
                    <span className="text-green-600 font-bold">8-12% APY</span>
                  </div>
                </div>
              </div>

              {/* Instant Liquidity */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="bg-green-50 p-4 rounded-2xl w-fit mb-6">
                  <span className="text-4xl">💰</span>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Instant Access</h3>
                <p className="text-gray-600 mb-6">
                  Access your funds anytime without penalties, unlike CDs that lock up your money for months or years.
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Traditional CD</span>
                    <span className="text-red-500 font-semibold">Locked 6mo-5yr</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Savings Account</span>
                    <span className="text-orange-500 font-semibold">Limited transfers</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900 font-medium">PyInvest</span>
                    <span className="text-green-600 font-bold">Instant access</span>
                  </div>
                </div>
              </div>

              {/* Simple Setup */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="bg-purple-50 p-4 rounded-2xl w-fit mb-6">
                  <span className="text-4xl">⚡</span>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Simple Setup</h3>
                <p className="text-gray-600 mb-6">
                  Get started in under 3 minutes with no minimum deposits, paperwork, or lengthy approval processes.
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Traditional CD</span>
                    <span className="text-red-500 font-semibold">Days to weeks</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Bank Account</span>
                    <span className="text-orange-500 font-semibold">1-3 days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900 font-medium">PyInvest</span>
                    <span className="text-green-600 font-bold">Under 3 minutes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-700 py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to put your money to work?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of users who have already started earning more with PyInvest.
            </p>
            <Button
              onClick={() => window.location.href = isAuthenticated ? '/dashboard' : '/login'}
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-50 px-12 py-6 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Get Started - It's Free
            </Button>
          </div>
        </section>
      </main>
    </>
  );
}
