"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAccessToken, usePrivy } from "@privy-io/react-auth";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import WalletList from "../../components/WalletList";

async function verifyToken() {
  const url = "/api/verify";
  const accessToken = await getAccessToken();
  const result = await fetch(url, {
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined),
    },
  });

  return await result.json();
}

export default function DashboardPage() {
  const [verifyResult, setVerifyResult] = useState();
  const [smartWalletDeploymentStatus, setSmartWalletDeploymentStatus] = useState<{ isDeployed: boolean; isChecking: boolean }>({ isDeployed: false, isChecking: false });
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
  const { client } = useSmartWallets();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  const numAccounts = user?.linkedAccounts?.length || 0;
  const canRemoveAccount = numAccounts > 1;

  const email = user?.email;
  const phone = user?.phone;
  const wallet = user?.wallet;

  // Find smart wallet from linked accounts
  const smartWallet = user?.linkedAccounts?.find(
    (account) => account.type === 'smart_wallet'
  ) as { type: 'smart_wallet'; address: string; smartWalletType?: string } | undefined;

  const googleSubject = user?.google?.subject || null;
  const twitterSubject = user?.twitter?.subject || null;
  const discordSubject = user?.discord?.subject || null;

  // Function to check if smart wallet is deployed
  const checkSmartWalletDeployment = async () => {
    if (!smartWallet?.address || !client) return;
    
    setSmartWalletDeploymentStatus({ isDeployed: false, isChecking: true });
    
    try {
      // Check if there's code at the smart wallet address
      const code = await client.getBytecode({ address: smartWallet.address as `0x${string}` });
      const isDeployed = code !== undefined && code !== '0x';
      setSmartWalletDeploymentStatus({ isDeployed, isChecking: false });
    } catch (error) {
      console.error('Error checking deployment:', error);
      setSmartWalletDeploymentStatus({ isDeployed: false, isChecking: false });
    }
  };

  return (
    <main className="flex flex-col min-h-screen px-4 sm:px-20 py-6 sm:py-10 bg-privy-light-blue">
      {ready && authenticated ? (
        <>
          <div className="flex flex-row justify-between">
            <h1 className="text-2xl font-semibold">Privy Auth Demo</h1>
            <button
              onClick={logout}
              className="text-sm bg-violet-200 hover:text-violet-900 py-2 px-4 rounded-md text-violet-700"
            >
              Logout
            </button>
          </div>
          <div className="mt-12 flex gap-4 flex-wrap">
            {googleSubject ? (
              <button
                onClick={() => {
                  unlinkGoogle(googleSubject);
                }}
                className="text-sm border border-violet-600 hover:border-violet-700 py-2 px-4 rounded-md text-violet-600 hover:text-violet-700 disabled:border-gray-500 disabled:text-gray-500 hover:disabled:text-gray-500"
                disabled={!canRemoveAccount}
              >
                Unlink Google
              </button>
            ) : (
              <button
                onClick={() => {
                  linkGoogle();
                }}
                className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white"
              >
                Link Google
              </button>
            )}

            {twitterSubject ? (
              <button
                onClick={() => {
                  unlinkTwitter(twitterSubject);
                }}
                className="text-sm border border-violet-600 hover:border-violet-700 py-2 px-4 rounded-md text-violet-600 hover:text-violet-700 disabled:border-gray-500 disabled:text-gray-500 hover:disabled:text-gray-500"
                disabled={!canRemoveAccount}
              >
                Unlink Twitter
              </button>
            ) : (
              <button
                className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white"
                onClick={() => {
                  linkTwitter();
                }}
              >
                Link Twitter
              </button>
            )}

            {discordSubject ? (
              <button
                onClick={() => {
                  unlinkDiscord(discordSubject);
                }}
                className="text-sm border border-violet-600 hover:border-violet-700 py-2 px-4 rounded-md text-violet-600 hover:text-violet-700 disabled:border-gray-500 disabled:text-gray-500 hover:disabled:text-gray-500"
                disabled={!canRemoveAccount}
              >
                Unlink Discord
              </button>
            ) : (
              <button
                className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white"
                onClick={() => {
                  linkDiscord();
                }}
              >
                Link Discord
              </button>
            )}

            {email ? (
              <button
                onClick={() => {
                  unlinkEmail(email.address);
                }}
                className="text-sm border border-violet-600 hover:border-violet-700 py-2 px-4 rounded-md text-violet-600 hover:text-violet-700 disabled:border-gray-500 disabled:text-gray-500 hover:disabled:text-gray-500"
                disabled={!canRemoveAccount}
              >
                Unlink email
              </button>
            ) : (
              <button
                onClick={linkEmail}
                className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white"
              >
                Connect email
              </button>
            )}
            {wallet ? (
              <button
                onClick={() => {
                  unlinkWallet(wallet.address);
                }}
                className="text-sm border border-violet-600 hover:border-violet-700 py-2 px-4 rounded-md text-violet-600 hover:text-violet-700 disabled:border-gray-500 disabled:text-gray-500 hover:disabled:text-gray-500"
                disabled={!canRemoveAccount}
              >
                Unlink wallet
              </button>
            ) : (
              <button
                onClick={linkWallet}
                className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
              >
                Connect wallet
              </button>
            )}
            {phone ? (
              <button
                onClick={() => {
                  unlinkPhone(phone.number);
                }}
                className="text-sm border border-violet-600 hover:border-violet-700 py-2 px-4 rounded-md text-violet-600 hover:text-violet-700 disabled:border-gray-500 disabled:text-gray-500 hover:disabled:text-gray-500"
                disabled={!canRemoveAccount}
              >
                Unlink phone
              </button>
            ) : (
              <button
                onClick={linkPhone}
                className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
              >
                Connect phone
              </button>
            )}

            <button
              onClick={() => verifyToken().then(setVerifyResult)}
              className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
            >
              Verify token on server
            </button>

            {Boolean(verifyResult) && (
              <details className="w-full">
                <summary className="mt-6 font-bold uppercase text-sm text-gray-600">
                  Server verify result
                </summary>
                <pre className="max-w-4xl bg-slate-700 text-slate-50 font-mono p-4 text-xs sm:text-sm rounded-md mt-2">
                  {JSON.stringify(verifyResult, null, 2)}
                </pre>
              </details>
            )}
          </div>

          {/* Smart Wallet Section */}
          {smartWallet && (
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <h2 className="text-xl font-bold text-blue-900 mb-4">Your Smart Wallet</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-blue-700 mb-1">
                    Smart Wallet Address {smartWallet.smartWalletType ? `(${smartWallet.smartWalletType})` : ''}:
                  </p>
                  <p className="font-mono text-sm bg-white p-3 rounded border text-gray-800 break-all">
                    {smartWallet.address}
                  </p>
                </div>

                {/* Deployment Status */}
                <div className="bg-white p-3 rounded border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-blue-700">Deployment Status:</p>
                    <button
                      type="button"
                      onClick={checkSmartWalletDeployment}
                      disabled={smartWalletDeploymentStatus.isChecking}
                      className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-white disabled:bg-blue-400"
                    >
                      {smartWalletDeploymentStatus.isChecking ? 'Checking...' : 'Check Status'}
                    </button>
                  </div>
                  <div className="text-sm">
                    {smartWalletDeploymentStatus.isChecking ? (
                      <p className="text-yellow-600">🔄 Checking deployment status...</p>
                    ) : smartWalletDeploymentStatus.isDeployed ? (
                      <p className="text-green-600">✅ Smart wallet is deployed on-chain</p>
                    ) : (
                      <div className="text-yellow-600">
                        <p>⏳ Smart wallet not yet deployed</p>
                        <p className="text-xs mt-1">Will be deployed on your first transaction</p>
                      </div>
                    )}
                  </div>
                </div>

                {client?.chain && (
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm font-medium text-blue-700 mb-2">Network Information:</p>
                    <div className="space-y-1 text-sm text-gray-700">
                      <p><span className="font-medium">Chain:</span> {client.chain.name}</p>
                      <p><span className="font-medium">Chain ID:</span> {client.chain.id}</p>
                      <p><span className="font-medium">Native Currency:</span> {client.chain.nativeCurrency?.symbol || 'ETH'}</p>
                      {client.chain.id === 1 && (
                        <p className="text-xs text-blue-600 mt-2">
                          🔗 <a 
                            href={`https://etherscan.io/address/${smartWallet.address}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="underline hover:text-blue-800"
                          >
                            View on Etherscan
                          </a>
                        </p>
                      )}
                      {client.chain.id === 11155111 && (
                        <p className="text-xs text-blue-600 mt-2">
                          🔗 <a 
                            href={`https://sepolia.etherscan.io/address/${smartWallet.address}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="underline hover:text-blue-800"
                          >
                            View on Sepolia Etherscan
                          </a>
                        </p>
                      )}
                      {client.chain.id === 8453 && (
                        <p className="text-xs text-blue-600 mt-2">
                          🔗 <a 
                            href={`https://basescan.org/address/${smartWallet.address}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="underline hover:text-blue-800"
                          >
                            View on BaseScan
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <div className="text-sm text-blue-600">
                  <p>✅ Gas sponsorship enabled</p>
                  <p>✅ Batch transactions supported</p>
                  <p>✅ EVM compatible</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6 max-w-4xl mt-6">
            <h2 className="text-xl font-bold">Your Wallets</h2>
            <WalletList />
          </div>
          <p className="mt-6 font-bold uppercase text-sm text-gray-600">
            User object
          </p>
          <pre className="max-w-4xl bg-slate-700 text-slate-50 font-mono p-4 text-xs sm:text-sm rounded-md mt-2">
            {JSON.stringify(user, null, 2)}
          </pre>
        </>
      ) : null}
    </main>
  );
}