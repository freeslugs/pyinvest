"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import AAVEDeposit from '../../components/AAVEDeposit';

export default function DepositPage() {
  const router = useRouter();
  const { ready, authenticated, logout } = usePrivy();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-privy-light-blue flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-privy-light-blue flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Please sign in to continue</p>
          <button
            onClick={() => router.push("/")}
            className="bg-violet-600 hover:bg-violet-700 py-3 px-6 text-white rounded-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="flex flex-col min-h-screen px-4 sm:px-20 py-6 sm:py-10 bg-privy-light-blue">
      {/* Header */}
      <div className="flex flex-row justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold">AAVE PyUSD Deposit (Sepolia)</h1>
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm bg-gray-200 hover:bg-gray-300 py-2 px-4 rounded-md text-gray-700"
          >
            Dashboard
          </button>
          <button
            onClick={logout}
            className="text-sm bg-violet-200 hover:text-violet-900 py-2 px-4 rounded-md text-violet-700"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <AAVEDeposit />
    </main>
  );
}