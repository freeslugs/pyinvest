'use client';

import { usePrivy } from '@privy-io/react-auth';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Check,
  ExternalLink,
  Mail,
  Phone,
  Plus,
  Shield,
  User,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const router = useRouter();
  const {
    ready,
    authenticated,
    user,
    logout,
    linkEmail,
    linkWallet,
    unlinkEmail,
    linkPhone,
    unlinkPhone,
    unlinkWallet,
    linkGoogle,
    unlinkGoogle,
    linkTwitter,
    unlinkTwitter,
    linkDiscord,
    unlinkDiscord,
  } = usePrivy();

  // KYC state management
  const [kycStatus, setKycStatus] = useState<
    'not_started' | 'passed' | 'claimed'
  >('not_started');
  const [kycTokenBalance, setKycTokenBalance] = useState(0);
  const [isClaimingToken, setIsClaimingToken] = useState(false);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  // Mock KYC status - in real app this would come from backend
  useEffect(() => {
    if (user?.id) {
      // Mock logic - simulate different states based on user ID
      const userId = user.id;
      if (userId.endsWith('1') || userId.endsWith('2')) {
        setKycStatus('passed');
        setKycTokenBalance(0);
      } else if (userId.endsWith('3') || userId.endsWith('4')) {
        setKycStatus('claimed');
        setKycTokenBalance(1);
      } else {
        setKycStatus('not_started');
        setKycTokenBalance(0);
      }
    }
  }, [user?.id]);

  const handleClaimKycToken = async () => {
    setIsClaimingToken(true);
    try {
      // Mock claiming process
      await new Promise(resolve => setTimeout(resolve, 2000));
      setKycStatus('claimed');
      setKycTokenBalance(1);
      alert(
        'KYC token claimed successfully! You now have access to premium support.'
      );
    } catch (error) {
      alert('Failed to claim KYC token. Please try again.');
    } finally {
      setIsClaimingToken(false);
    }
  };

  if (!ready || !authenticated || !user) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-white'>
        <div className='text-center'>
          <div className='animate-pulse text-gray-400'>Loading profile...</div>
        </div>
      </div>
    );
  }

  const numAccounts = user?.linkedAccounts?.length || 0;
  const canRemoveAccount = numAccounts > 1;

  const email = user?.email;
  const phone = user?.phone;
  const wallet = user?.wallet;
  const googleSubject = user?.google?.subject || null;
  const twitterSubject = user?.twitter?.subject || null;
  const discordSubject = user?.discord?.subject || null;

  // Find smart wallet from linked accounts
  const smartWallet = user?.linkedAccounts?.find(
    account => account.type === 'smart_wallet'
  ) as
    | { type: 'smart_wallet'; address: string; smartWalletType?: string }
    | undefined;

  const connectedWallets =
    user?.linkedAccounts?.filter(account => account.type === 'wallet') || [];

  return (
    <div className='min-h-screen bg-white py-8'>
      <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8 rounded-xl border border-gray-200 bg-white shadow-sm'>
          <div className='px-6 py-8'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-4'>
                <button
                  onClick={() => router.push('/dashboard')}
                  className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200'
                >
                  <ArrowLeft className='h-5 w-5 text-gray-600' />
                </button>
                <div className='flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600'>
                  <User className='h-8 w-8 text-white' />
                </div>
                <div>
                  <h1 className='text-2xl font-medium text-gray-900'>
                    Profile Settings
                  </h1>
                  <p className='text-gray-600'>
                    Manage your account and connected services
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className='rounded-md bg-red-100 px-4 py-2 text-sm font-normal text-red-700 transition-colors hover:bg-red-200'
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
          {/* Account Information */}
          <div className='space-y-6'>
            <div className='rounded-xl border border-gray-200 bg-white shadow-sm'>
              <div className='border-b border-gray-200 px-6 py-4'>
                <h2 className='flex items-center text-lg font-medium text-gray-900'>
                  <User className='mr-2 h-5 w-5' />
                  Account Information
                </h2>
              </div>
              <div className='space-y-4 px-6 py-4'>
                {/* User ID */}
                <div className='flex items-center justify-between border-b border-gray-100 py-3'>
                  <div className='flex items-center space-x-3'>
                    <Shield className='h-4 w-4 text-gray-400' />
                    <div>
                      <p className='text-sm font-normal text-gray-900'>
                        User ID
                      </p>
                      <p className='text-xs text-gray-500'>
                        Your unique identifier
                      </p>
                    </div>
                  </div>
                  <p className='font-mono text-sm text-gray-600'>
                    {user.id?.slice(0, 8)}...{user.id?.slice(-8)}
                  </p>
                </div>

                {/* Created Date */}
                <div className='flex items-center justify-between py-3'>
                  <div className='flex items-center space-x-3'>
                    <Shield className='h-4 w-4 text-gray-400' />
                    <div>
                      <p className='text-sm font-normal text-gray-900'>
                        Account Created
                      </p>
                      <p className='text-xs text-gray-500'>Member since</p>
                    </div>
                  </div>
                  <p className='text-sm text-gray-600'>
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>

            {/* Email Settings */}
            <div className='rounded-xl border border-gray-200 bg-white shadow-sm'>
              <div className='border-b border-gray-200 px-6 py-4'>
                <h2 className='flex items-center text-lg font-medium text-gray-900'>
                  <Mail className='mr-2 h-5 w-5' />
                  Email
                </h2>
              </div>
              <div className='px-6 py-4'>
                {email ? (
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-green-100'>
                        <Check className='h-4 w-4 text-green-600' />
                      </div>
                      <div>
                        <p className='text-sm font-normal text-gray-900'>
                          {email.address}
                        </p>
                        <p className='text-xs text-gray-500'>
                          Verified email address
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => unlinkEmail(email.address)}
                      disabled={!canRemoveAccount}
                      className='rounded-md border border-red-300 px-3 py-1 text-sm text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-100'>
                        <X className='h-4 w-4 text-gray-400' />
                      </div>
                      <div>
                        <p className='text-sm font-normal text-gray-900'>
                          No email connected
                        </p>
                        <p className='text-xs text-gray-500'>
                          Add an email for account recovery
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={linkEmail}
                      className='rounded-md bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-700'
                    >
                      Connect
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Phone Settings */}
            <div className='rounded-xl border border-gray-200 bg-white shadow-sm'>
              <div className='border-b border-gray-200 px-6 py-4'>
                <h2 className='flex items-center text-lg font-medium text-gray-900'>
                  <Phone className='mr-2 h-5 w-5' />
                  Phone
                </h2>
              </div>
              <div className='px-6 py-4'>
                {phone ? (
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-green-100'>
                        <Check className='h-4 w-4 text-green-600' />
                      </div>
                      <div>
                        <p className='text-sm font-normal text-gray-900'>
                          {phone.number}
                        </p>
                        <p className='text-xs text-gray-500'>
                          Verified phone number
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => unlinkPhone(phone.number)}
                      disabled={!canRemoveAccount}
                      className='rounded-md border border-red-300 px-3 py-1 text-sm text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-100'>
                        <X className='h-4 w-4 text-gray-400' />
                      </div>
                      <div>
                        <p className='text-sm font-normal text-gray-900'>
                          No phone connected
                        </p>
                        <p className='text-xs text-gray-500'>
                          Add a phone for 2FA security
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={linkPhone}
                      className='rounded-md bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-700'
                    >
                      Connect
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* KYC Compliance */}
            <div className='rounded-xl border border-gray-200 bg-white shadow-sm'>
              <div className='border-b border-gray-200 px-6 py-4'>
                <h2 className='flex items-center text-lg font-medium text-gray-900'>
                  <Award className='mr-2 h-5 w-5' />
                  KYC Compliance
                </h2>
              </div>
              <div className='px-6 py-4'>
                {kycStatus === 'not_started' && (
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-100'>
                        <AlertCircle className='h-4 w-4 text-gray-400' />
                      </div>
                      <div>
                        <p className='text-sm font-normal text-gray-900'>
                          KYC Not Started
                        </p>
                        <p className='text-xs text-gray-500'>
                          Complete KYC to unlock premium features
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => alert('KYC process would start here')}
                      className='rounded-md bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-700'
                    >
                      Start KYC
                    </button>
                  </div>
                )}

                {kycStatus === 'passed' && (
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-3'>
                        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-green-100'>
                          <Check className='h-4 w-4 text-green-600' />
                        </div>
                        <div>
                          <p className='text-sm font-normal text-gray-900'>
                            KYC Verified
                          </p>
                          <p className='text-xs text-gray-500'>
                            Ready to claim your KYC token
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleClaimKycToken}
                        disabled={isClaimingToken}
                        className='rounded-md bg-gradient-to-r from-yellow-400 to-yellow-500 px-4 py-2 text-sm font-normal text-white transition-all hover:from-yellow-500 hover:to-yellow-600 disabled:opacity-50'
                      >
                        {isClaimingToken ? 'Claiming...' : 'Claim KYC Token'}
                      </button>
                    </div>
                    <div className='rounded-xl border border-yellow-200 bg-yellow-50 p-4'>
                      <div className='flex items-start space-x-3'>
                        <Zap className='mt-0.5 h-5 w-5 text-yellow-600' />
                        <div>
                          <h4 className='text-sm font-normal text-yellow-800'>
                            KYC Token Benefits
                          </h4>
                          <ul className='mt-2 space-y-1 text-xs text-yellow-700'>
                            <li>• Access to American tech support</li>
                            <li>• Priority customer service</li>
                            <li>• Enhanced security features</li>
                            <li>• Early access to new features</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {kycStatus === 'claimed' && (
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-3'>
                        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-green-100'>
                          <Award className='h-4 w-4 text-green-600' />
                        </div>
                        <div>
                          <p className='text-sm font-normal text-gray-900'>
                            KYC Token Claimed
                          </p>
                          <p className='text-xs text-gray-500'>
                            You have access to premium features
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600'>
                          <Shield className='h-4 w-4 text-white' />
                        </div>
                        <span className='rounded-full bg-green-100 px-2 py-1 text-xs font-normal text-green-600'>
                          Premium User
                        </span>
                      </div>
                    </div>

                    <div className='rounded-xl border border-green-200 bg-green-50 p-4'>
                      <div className='flex items-start space-x-3'>
                        <Shield className='mt-0.5 h-5 w-5 text-green-600' />
                        <div className='flex-1'>
                          <h4 className='mb-2 text-sm font-normal text-green-800'>
                            Token Details
                          </h4>
                          <div className='space-y-1 text-xs text-green-700'>
                            <p>
                              <span className='font-normal'>Balance:</span>{' '}
                              {kycTokenBalance} KYC Token
                            </p>
                            <p>
                              <span className='font-normal'>Network:</span> BNB
                              Smart Chain
                            </p>
                            <p>
                              <span className='font-normal'>Contract:</span>{' '}
                              0x742d35Cc6634C0532925a3b8D
                            </p>
                          </div>
                          <div className='mt-3 flex space-x-2'>
                            <a
                              href='https://bscscan.com/token/0x742d35Cc6634C0532925a3b8D'
                              target='_blank'
                              rel='noopener noreferrer'
                              className='inline-flex items-center text-xs text-green-600 transition-colors hover:text-green-800'
                            >
                              <ExternalLink className='mr-1 h-3 w-3' />
                              View on BscScan
                            </a>
                            <a
                              href='https://pancakeswap.finance/info/token/0x742d35Cc6634C0532925a3b8D'
                              target='_blank'
                              rel='noopener noreferrer'
                              className='inline-flex items-center text-xs text-green-600 transition-colors hover:text-green-800'
                            >
                              <ExternalLink className='mr-1 h-3 w-3' />
                              View on PancakeSwap
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Connected Services & Wallets */}
          <div className='space-y-6'>
            {/* Social Accounts */}
            <div className='rounded-xl border border-gray-200 bg-white shadow-sm'>
              <div className='border-b border-gray-200 px-6 py-4'>
                <h2 className='flex items-center text-lg font-medium text-gray-900'>
                  <ExternalLink className='mr-2 h-5 w-5' />
                  Social Accounts
                </h2>
              </div>
              <div className='space-y-4 px-6 py-4'>
                {/* Google */}
                <div className='flex items-center justify-between py-2'>
                  <div className='flex items-center space-x-3'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-red-100'>
                      <span className='text-sm font-bold text-red-600'>G</span>
                    </div>
                    <div>
                      <p className='text-sm font-normal text-gray-900'>
                        Google
                      </p>
                      <p className='text-xs text-gray-500'>
                        {googleSubject ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  {googleSubject ? (
                    <button
                      onClick={() => unlinkGoogle(googleSubject)}
                      disabled={!canRemoveAccount}
                      className='rounded-md border border-red-300 px-3 py-1 text-sm text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      Unlink
                    </button>
                  ) : (
                    <button
                      onClick={linkGoogle}
                      className='rounded-md bg-red-600 px-3 py-1 text-sm text-white transition-colors hover:bg-red-700'
                    >
                      Link
                    </button>
                  )}
                </div>

                {/* Twitter */}
                <div className='flex items-center justify-between py-2'>
                  <div className='flex items-center space-x-3'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-blue-100'>
                      <span className='text-sm font-bold text-blue-600'>𝕏</span>
                    </div>
                    <div>
                      <p className='text-sm font-normal text-gray-900'>
                        Twitter
                      </p>
                      <p className='text-xs text-gray-500'>
                        {twitterSubject ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  {twitterSubject ? (
                    <button
                      onClick={() => unlinkTwitter(twitterSubject)}
                      disabled={!canRemoveAccount}
                      className='rounded-md border border-red-300 px-3 py-1 text-sm text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      Unlink
                    </button>
                  ) : (
                    <button
                      onClick={linkTwitter}
                      className='rounded-md bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-700'
                    >
                      Link
                    </button>
                  )}
                </div>

                {/* Discord */}
                <div className='flex items-center justify-between py-2'>
                  <div className='flex items-center space-x-3'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-purple-100'>
                      <span className='text-sm font-bold text-purple-600'>
                        D
                      </span>
                    </div>
                    <div>
                      <p className='text-sm font-normal text-gray-900'>
                        Discord
                      </p>
                      <p className='text-xs text-gray-500'>
                        {discordSubject ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  {discordSubject ? (
                    <button
                      onClick={() => unlinkDiscord(discordSubject)}
                      disabled={!canRemoveAccount}
                      className='rounded-md border border-red-300 px-3 py-1 text-sm text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      Unlink
                    </button>
                  ) : (
                    <button
                      onClick={linkDiscord}
                      className='rounded-md bg-purple-600 px-3 py-1 text-sm text-white transition-colors hover:bg-purple-700'
                    >
                      Link
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Wallets */}
            <div className='rounded-xl border border-gray-200 bg-white shadow-sm'>
              <div className='border-b border-gray-200 px-6 py-4'>
                <h2 className='flex items-center text-lg font-medium text-gray-900'>
                  <Wallet className='mr-2 h-5 w-5' />
                  Wallets
                </h2>
              </div>
              <div className='space-y-4 px-6 py-4'>
                {/* Primary Wallet */}
                {wallet && (
                  <div className='flex items-center justify-between py-2'>
                    <div className='flex items-center space-x-3'>
                      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-green-100'>
                        <Wallet className='h-4 w-4 text-green-600' />
                      </div>
                      <div>
                        <p className='text-sm font-normal text-gray-900'>
                          Primary Wallet
                        </p>
                        <p className='font-mono text-xs text-gray-500'>
                          {wallet.address.slice(0, 8)}...
                          {wallet.address.slice(-8)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => unlinkWallet(wallet.address)}
                      disabled={!canRemoveAccount}
                      className='rounded-md border border-red-300 px-3 py-1 text-sm text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      Unlink
                    </button>
                  </div>
                )}

                {/* Smart Wallet */}
                {smartWallet && (
                  <div className='flex items-center justify-between py-2'>
                    <div className='flex items-center space-x-3'>
                      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-blue-100'>
                        <Shield className='h-4 w-4 text-blue-600' />
                      </div>
                      <div>
                        <p className='text-sm font-normal text-gray-900'>
                          Smart Wallet
                        </p>
                        <p className='font-mono text-xs text-gray-500'>
                          {smartWallet.address.slice(0, 8)}...
                          {smartWallet.address.slice(-8)}
                        </p>
                      </div>
                    </div>
                    <span className='rounded-full bg-green-100 px-2 py-1 text-xs text-green-600'>
                      Active
                    </span>
                  </div>
                )}

                {/* Additional Wallets */}
                {connectedWallets.map((connectedWallet, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between py-2'
                  >
                    <div className='flex items-center space-x-3'>
                      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-100'>
                        <Wallet className='h-4 w-4 text-gray-600' />
                      </div>
                      <div>
                        <p className='text-sm font-normal text-gray-900'>
                          {connectedWallet.walletClientType === 'privy'
                            ? 'Embedded Wallet'
                            : 'External Wallet'}
                        </p>
                        <p className='font-mono text-xs text-gray-500'>
                          {connectedWallet.address.slice(0, 8)}...
                          {connectedWallet.address.slice(-8)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => unlinkWallet(connectedWallet.address)}
                      disabled={!canRemoveAccount}
                      className='rounded-md border border-red-300 px-3 py-1 text-sm text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      Unlink
                    </button>
                  </div>
                ))}

                {/* Connect New Wallet Button */}
                <div className='border-t border-gray-100 pt-2'>
                  <button
                    onClick={linkWallet}
                    className='flex w-full items-center justify-center space-x-2 rounded-md border-2 border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-700'
                  >
                    <Plus className='h-4 w-4' />
                    <span>Connect New Wallet</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Account Security Status */}
            <div className='rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-blue-50 p-6'>
              <div className='mb-4 flex items-center space-x-3'>
                <Shield className='h-6 w-6 text-green-600' />
                <h3 className='text-lg font-medium text-gray-900'>
                  Security Status
                </h3>
              </div>
              <div className='space-y-2'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-700'>
                    Two-Factor Authentication
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      phone
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {phone ? 'Enabled' : 'Recommended'}
                  </span>
                </div>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-700'>Account Recovery</span>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      email
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {email ? 'Configured' : 'Recommended'}
                  </span>
                </div>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-700'>Social Backup</span>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      googleSubject || twitterSubject || discordSubject
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {googleSubject || twitterSubject || discordSubject
                      ? 'Available'
                      : 'Optional'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Warning about account removal */}
        {!canRemoveAccount && (
          <div className='mt-8 rounded-xl border border-yellow-200 bg-yellow-50 p-4'>
            <div className='flex items-start space-x-3'>
              <div className='flex-shrink-0'>
                <Shield className='h-5 w-5 text-yellow-600' />
              </div>
              <div>
                <h3 className='text-sm font-normal text-yellow-800'>
                  Account Security Notice
                </h3>
                <p className='mt-1 text-sm text-yellow-700'>
                  You cannot remove your last authentication method. Please add
                  another method before removing your current one.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
