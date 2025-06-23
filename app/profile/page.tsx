'use client';

import { usePrivy } from '@privy-io/react-auth';
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Mail,
  Phone,
  Plus,
  Shield,
  User,
  Wallet,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

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

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  if (!ready || !authenticated || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-gray-400">Loading profile...</div>
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

  const connectedWallets = user?.linkedAccounts?.filter(
    account => account.type === 'wallet'
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
                  <p className="text-gray-600">Manage your account and connected services</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Account Information */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Account Information
                </h2>
              </div>
              <div className="px-6 py-4 space-y-4">
                {/* User ID */}
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">User ID</p>
                      <p className="text-xs text-gray-500">Your unique identifier</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 font-mono">
                    {user.id?.slice(0, 8)}...{user.id?.slice(-8)}
                  </p>
                </div>

                {/* Created Date */}
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Account Created</p>
                      <p className="text-xs text-gray-500">Member since</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>

            {/* Email Settings */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Email
                </h2>
              </div>
              <div className="px-6 py-4">
                {email ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                                                 <p className="text-sm font-medium text-gray-900">{email.address}</p>
                         <p className="text-xs text-gray-500">Verified email address</p>
                      </div>
                    </div>
                    <button
                      onClick={() => unlinkEmail(email.address)}
                      disabled={!canRemoveAccount}
                      className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                        <X className="h-4 w-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">No email connected</p>
                        <p className="text-xs text-gray-500">Add an email for account recovery</p>
                      </div>
                    </div>
                    <button
                      onClick={linkEmail}
                      className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 transition-colors"
                    >
                      Connect
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Phone Settings */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Phone className="h-5 w-5 mr-2" />
                  Phone
                </h2>
              </div>
              <div className="px-6 py-4">
                {phone ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                                                 <p className="text-sm font-medium text-gray-900">{phone.number}</p>
                         <p className="text-xs text-gray-500">Verified phone number</p>
                      </div>
                    </div>
                    <button
                      onClick={() => unlinkPhone(phone.number)}
                      disabled={!canRemoveAccount}
                      className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                        <X className="h-4 w-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">No phone connected</p>
                        <p className="text-xs text-gray-500">Add a phone for 2FA security</p>
                      </div>
                    </div>
                    <button
                      onClick={linkPhone}
                      className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 transition-colors"
                    >
                      Connect
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Connected Services & Wallets */}
          <div className="space-y-6">
            {/* Social Accounts */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Social Accounts
                </h2>
              </div>
              <div className="px-6 py-4 space-y-4">
                {/* Google */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 font-bold text-sm">G</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Google</p>
                      <p className="text-xs text-gray-500">
                        {googleSubject ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  {googleSubject ? (
                    <button
                      onClick={() => unlinkGoogle(googleSubject)}
                      disabled={!canRemoveAccount}
                      className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Unlink
                    </button>
                  ) : (
                    <button
                      onClick={linkGoogle}
                      className="rounded-md bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 transition-colors"
                    >
                      Link
                    </button>
                  )}
                </div>

                {/* Twitter */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">𝕏</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Twitter</p>
                      <p className="text-xs text-gray-500">
                        {twitterSubject ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  {twitterSubject ? (
                    <button
                      onClick={() => unlinkTwitter(twitterSubject)}
                      disabled={!canRemoveAccount}
                      className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Unlink
                    </button>
                  ) : (
                    <button
                      onClick={linkTwitter}
                      className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 transition-colors"
                    >
                      Link
                    </button>
                  )}
                </div>

                {/* Discord */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-bold text-sm">D</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Discord</p>
                      <p className="text-xs text-gray-500">
                        {discordSubject ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  {discordSubject ? (
                    <button
                      onClick={() => unlinkDiscord(discordSubject)}
                      disabled={!canRemoveAccount}
                      className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Unlink
                    </button>
                  ) : (
                    <button
                      onClick={linkDiscord}
                      className="rounded-md bg-purple-600 px-3 py-1 text-sm text-white hover:bg-purple-700 transition-colors"
                    >
                      Link
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Wallets */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Wallet className="h-5 w-5 mr-2" />
                  Wallets
                </h2>
              </div>
              <div className="px-6 py-4 space-y-4">
                {/* Primary Wallet */}
                {wallet && (
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Wallet className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Primary Wallet</p>
                        <p className="text-xs text-gray-500 font-mono">
                          {wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => unlinkWallet(wallet.address)}
                      disabled={!canRemoveAccount}
                      className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Unlink
                    </button>
                  </div>
                )}

                {/* Smart Wallet */}
                {smartWallet && (
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Shield className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Smart Wallet</p>
                        <p className="text-xs text-gray-500 font-mono">
                          {smartWallet.address.slice(0, 8)}...{smartWallet.address.slice(-8)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      Active
                    </span>
                  </div>
                )}

                {/* Additional Wallets */}
                {connectedWallets.map((connectedWallet, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <Wallet className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {connectedWallet.walletClientType === 'privy' ? 'Embedded Wallet' : 'External Wallet'}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          {connectedWallet.address.slice(0, 8)}...{connectedWallet.address.slice(-8)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => unlinkWallet(connectedWallet.address)}
                      disabled={!canRemoveAccount}
                      className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Unlink
                    </button>
                  </div>
                ))}

                {/* Connect New Wallet Button */}
                <div className="pt-2 border-t border-gray-100">
                  <button
                    onClick={linkWallet}
                    className="w-full flex items-center justify-center space-x-2 rounded-md border-2 border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Connect New Wallet</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Account Security Status */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Security Status</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Two-Factor Authentication</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    phone ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {phone ? 'Enabled' : 'Recommended'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Account Recovery</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    email ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {email ? 'Configured' : 'Recommended'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Social Backup</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    (googleSubject || twitterSubject || discordSubject) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {(googleSubject || twitterSubject || discordSubject) ? 'Available' : 'Optional'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Warning about account removal */}
        {!canRemoveAccount && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Shield className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Account Security Notice</h3>
                <p className="mt-1 text-sm text-yellow-700">
                  You cannot remove your last authentication method. Please add another method before removing your current one.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
