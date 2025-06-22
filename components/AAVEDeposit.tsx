'use client';
import { usePrivy, getAccessToken } from '@privy-io/react-auth';
import { useState, useCallback, useEffect, useRef } from 'react';
import { encodeFunctionData, parseUnits } from 'viem';
import axios from 'axios';

const CONTRACTS = {
  // AAVE v3 Pool on Sepolia
  AAVE_POOL: '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951' as `0x${string}`,
  // PyUSD on Sepolia
  PYUSD: '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9' as `0x${string}`,
} as const;

const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'boolean' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

const AAVE_POOL_ABI = [
  {
    name: 'supply',
    type: 'function',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'onBehalfOf', type: 'address' },
      { name: 'referralCode', type: 'uint16' },
    ],
    outputs: [],
  },
] as const;

export default function AAVEDeposit() {
  // Privy hooks
  const { user, ready, authenticated } = usePrivy();
  
  // State management
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState('0');
  const [allBalances, setAllBalances] = useState<Record<string, string>>({});
  const [selectedWalletAddress, setSelectedWalletAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // All Ethereum wallets (embedded + external)
  const allEthereumWallets = user?.linkedAccounts.filter(
    (account) => 
      account.type === 'wallet' && 
      account.chainType === 'ethereum'
  ) || [];
  
  // Selected wallet for deposits
  const selectedWallet = allEthereumWallets.find(
    (account) => (account as any).address === selectedWalletAddress
  );
  
  // If no wallet selected, default to embedded wallet or first available
  const defaultWallet = allEthereumWallets.find(
    (account) => (account as any).walletClientType === 'privy'
  ) || allEthereumWallets[0];
  
  const activeWallet = selectedWallet || defaultWallet;
  const walletAddress = (activeWallet as any)?.address as `0x${string}`;

  // Auto-select default wallet when wallets load
  useEffect(() => {
    if (!selectedWalletAddress && defaultWallet) {
      setSelectedWalletAddress((defaultWallet as any).address);
    }
  }, [selectedWalletAddress, defaultWallet]);

  // Update balance when selected wallet changes
  useEffect(() => {
    if (selectedWalletAddress && allBalances[selectedWalletAddress]) {
      setBalance(allBalances[selectedWalletAddress]);
    }
  }, [selectedWalletAddress, allBalances]);

  // Load balance for a specific wallet
  const loadWalletBalance = useCallback(async (address: string) => {
    try {
      const response = await fetch('/api/get-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          tokenAddress: CONTRACTS.PYUSD,
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        return data.balance;
      } else {
        console.error('Balance fetch failed for', address, ':', data.error);
        return '0.000000';
      }
    } catch (err) {
      console.error('Error loading balance for', address, ':', err);
      return '0.000000';
    }
  }, []);

  // Load balances for all wallets - stable function
  const loadAllBalances = useCallback(async () => {
    const walletsToLoad = user?.linkedAccounts.filter(
      (account) => 
        account.type === 'wallet' && 
        account.chainType === 'ethereum'
    ) || [];
    
    if (walletsToLoad.length === 0) return;
    
    setLoadingBalance(true);
    try {
      const balancePromises = walletsToLoad.map(async (wallet) => {
        const address = (wallet as any).address;
        const balance = await loadWalletBalance(address);
        return { address, balance };
      });

      const results = await Promise.all(balancePromises);
      
      const newBalances: Record<string, string> = {};
      results.forEach(({ address, balance }) => {
        newBalances[address] = balance;
      });
      
      setAllBalances(newBalances);
      
      // Update balance for currently selected wallet
      if (selectedWalletAddress && newBalances[selectedWalletAddress]) {
        setBalance(newBalances[selectedWalletAddress]);
      }
    } catch (err) {
      console.error('Error loading all balances:', err);
    } finally {
      setLoadingBalance(false);
    }
  }, [user?.linkedAccounts, loadWalletBalance]);

  // Load balances on mount and when wallets change
  useEffect(() => {
    if (authenticated && user?.linkedAccounts) {
      loadAllBalances();
    }
  }, [authenticated, user?.linkedAccounts?.length]); // Only depend on length to avoid infinite loops

  // Deposit function using server-side transaction execution
  const depositPyUSD = useCallback(async () => {
    if (!activeWallet || !walletAddress || !amount) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const amountWei = parseUnits(amount, 6); // PyUSD 6 decimals
      const authToken = await getAccessToken();
      
      // Encode approve transaction
      const approveCalldata = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.AAVE_POOL, amountWei],
      });
      
      // Encode supply transaction
      const supplyCalldata = encodeFunctionData({
        abi: AAVE_POOL_ABI,
        functionName: 'supply',
        args: [CONTRACTS.PYUSD, amountWei, walletAddress, 0],
      });
      
      // Send batch transaction via custom API endpoint
      const response = await axios.post('/api/aave-deposit', {
        wallet_id: (activeWallet as any)?.id,
        transactions: [
          {
            to: CONTRACTS.PYUSD,
            data: approveCalldata,
            value: '0x0',
          },
          {
            to: CONTRACTS.AAVE_POOL,
            data: supplyCalldata,
            value: '0x0',
          }
        ],
        amount: amount
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = response.data;
      
      if (response.status === 200 && data.success) {
        setTxHash(data.txHash);
        setSuccess('Deposit successful!');
        setAmount('');
        
        // Reload balance after successful deposit
        setTimeout(loadAllBalances, 2000);
      } else {
        throw new Error(data.error || 'Transaction failed');
      }
      
    } catch (err: any) {
      console.error('Deposit failed:', err);
      setError(err?.response?.data?.error || err?.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  }, [activeWallet, walletAddress, amount, loadAllBalances]);

  // Input validation
  const isValidAmount = amount && parseFloat(amount) > 0 && parseFloat(amount) <= parseFloat(balance);
  const canDeposit = !loading && isValidAmount && walletAddress;

  // Connection state handling
  if (!ready) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center text-gray-600">Please sign in to continue</div>
      </div>
    );
  }

  if (!walletAddress) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center text-red-600">Embedded wallet not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Deposit PyUSD to AAVE (Sepolia Testnet)
      </h1>
      
      {/* All Connected Wallets */}
      <div className="mb-4 p-3 bg-gray-50 rounded-md">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700">Connected Wallets</p>
          <button
            onClick={loadAllBalances}
            disabled={loadingBalance}
            className="text-xs bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 text-blue-700 disabled:text-gray-400 px-2 py-1 rounded transition-colors"
          >
            {loadingBalance ? '↻' : '↻ Refresh All'}
          </button>
        </div>
        
        {allEthereumWallets.length === 0 ? (
          <p className="text-sm text-gray-500">No Ethereum wallets connected</p>
        ) : (
          <div className="space-y-3">
            {allEthereumWallets.map((wallet, index) => {
              const address = (wallet as any).address;
              const walletType = (wallet as any).walletClientType;
              const isSelected = address === selectedWalletAddress;
              const walletBalance = allBalances[address] || '0.000000';
              
              return (
                <div 
                  key={address} 
                  className={`p-2 rounded border cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-200' 
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedWalletAddress(address)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={isSelected}
                          onChange={() => setSelectedWalletAddress(address)}
                          className="text-blue-600 focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="text-xs font-medium text-gray-600">
                          {walletType === 'privy' ? '🔐 Embedded' : '🔗 External'}
                        </span>
                        {isSelected && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">Selected for Deposit</span>
                        )}
                      </div>
                      <p className="font-mono text-xs text-gray-800 break-all mt-1 ml-5">
                        {address}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 ml-5 text-sm text-gray-600">
                    PyUSD Balance: <span className="font-semibold">
                      {loadingBalance ? 'Loading...' : walletBalance}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Amount Input */}
      <div className="mb-4">
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
          Amount to Deposit {activeWallet && `(from ${(activeWallet as any).walletClientType === 'privy' ? 'Embedded' : 'External'} Wallet)`}
        </label>
        <div className="relative">
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter PyUSD amount"
            step="0.000001"
            min="0"
            className="w-full p-3 pr-16 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setAmount(balance)}
            disabled={loading || parseFloat(balance) === 0}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 disabled:text-gray-400 px-2 py-1 rounded"
          >
            Max
          </button>
        </div>
        {amount && parseFloat(amount) > parseFloat(balance) && (
          <p className="mt-1 text-sm text-red-600">Insufficient balance</p>
        )}
      </div>
      
      {/* Deposit Button */}
      <button
        onClick={depositPyUSD}
        disabled={!canDeposit}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-md transition-colors duration-200"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          'Deposit to AAVE'
        )}
      </button>
      
      {/* Status Messages */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
          {success}
          {txHash && (
            <div className="mt-2">
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm font-mono break-all"
              >
                View on Sepolia Etherscan →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}