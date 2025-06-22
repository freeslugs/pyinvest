"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAccessToken, usePrivy } from "@privy-io/react-auth";
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
      router.push("/");
    }
  }, [ready, authenticated, router]);

  const numAccounts = user?.linkedAccounts?.length || 0;
  const canRemoveAccount = numAccounts > 1;

  const email = user?.email;
  const phone = user?.phone;
  const wallet = user?.wallet;

  const googleSubject = user?.google?.subject || null;
  const twitterSubject = user?.twitter?.subject || null;
  const discordSubject = user?.discord?.subject || null;

  return (
    <main className="flex flex-col min-h-screen px-4 sm:px-20 py-6 sm:py-10 bg-privy-light-blue">
      {ready && authenticated ? (
        <>
          <div className="flex flex-row justify-between">
            <h1 className="text-2xl font-semibold">Privy Auth Demo</h1>
            <button
              type="button"
              onClick={logout}
              className="text-sm bg-violet-200 hover:text-violet-900 py-2 px-4 rounded-md text-violet-700"
            >
              Logout
            </button>
          </div>
          <div className="mt-12 flex gap-4 flex-wrap">
            {googleSubject ? (
              <button
                type="button"
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
                type="button"
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
                type="button"
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
                type="button"
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
                type="button"
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
                type="button"
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
                type="button"
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
                type="button"
                onClick={linkEmail}
                className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white"
              >
                Connect email
              </button>
            )}
            {wallet ? (
              <button
                type="button"
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
                type="button"
                onClick={linkWallet}
                className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
              >
                Connect wallet
              </button>
            )}
            {phone ? (
              <button
                type="button"
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
                type="button"
                onClick={linkPhone}
                className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
              >
                Connect phone
              </button>
            )}

            <button
              type="button"
              onClick={() => verifyToken().then(setVerifyResult)}
              className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
            >
              Verify token on server
            </button>
          </div>

          <details className="mt-6 p-4 bg-gray-100 cursor-pointer">
            <summary className="text-sm font-bold uppercase text-gray-600">
              User object
            </summary>
            <pre className="max-w-4xl bg-slate-700 text-slate-50 font-mono text-xs text-wrap rounded-md p-4 mt-4">
              {JSON.stringify(user, null, 2)}
            </pre>
          </details>

          {verifyResult && (
            <details className="mt-4 p-4 bg-gray-100 cursor-pointer">
              <summary className="text-sm font-bold uppercase text-gray-600">
                Server verify result
              </summary>
              <pre className="max-w-4xl bg-slate-700 text-slate-50 font-mono text-xs text-wrap rounded-md p-4 mt-4">
                {JSON.stringify(verifyResult, null, 2)}
              </pre>
            </details>
          )}

          <WalletList />
        </>
      ) : (
        // Loading state or unauthenticated
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      )}
    </main>
  );
} 