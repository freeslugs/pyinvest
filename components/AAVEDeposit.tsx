'use client';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useSmartWallets } from '@privy-io/react-auth/smart-wallets';
import { useState, useCallback, useEffect } from 'react';
import { encodeFunctionData, parseUnits, createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';

const CONTRACTS = {
  // AAVE v3 Pool on Sepolia
  AAVE_POOL: '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951' as `0x${string}`,
  // USDC on Sepolia (correct address)
  USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as `0x${string}`,
  // aUSDC on Sepolia
  AUSDC: '0x16dA4541aD1807f4443d92D26044C1147406EB80' as `0x${string}`,
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
  {
    name: 'allowance',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'transferFrom',
    type: 'function',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'boolean' }],
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

// Multicall3 contract ABI for batch transactions
const MULTICALL3_ABI = [
  {
    name: 'aggregate3',
    type: 'function',
    inputs: [
      {
        name: 'calls',
        type: 'tuple[]',
        components: [
          { name: 'target', type: 'address' },
          { name: 'allowFailure', type: 'bool' },
          { name: 'callData', type: 'bytes' },
        ],
      },
    ],
    outputs: [
      {
        name: 'returnData',
        type: 'tuple[]',
        components: [
          { name: 'success', type: 'bool' },
          { name: 'returnData', type: 'bytes' },
        ],
      },
    ],
  },
] as const;

// Multicall3 contract on Sepolia
const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11' as const;

export default function AAVEDeposit() {
  // Privy hooks
  const { user, ready, authenticated, connectWallet } = usePrivy();
  const { client } = useSmartWallets();
  const { wallets } = useWallets();
  
  // State management
  const [amount, setAmount] = useState('');
  const [smartWalletBalance, setSmartWalletBalance] = useState('0');
  const [eoaBalance, setEoaBalance] = useState('0');
  const [allowance, setAllowance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [approving, setApproving] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<{
    isDeployed: boolean;
    isChecking: boolean;
  }>({ isDeployed: false, isChecking: false });
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Wallet detection
  const smartWallet = user?.linkedAccounts?.find(
    (account) => account.type === 'smart_wallet'
  ) as { type: 'smart_wallet'; address: string; smartWalletType?: string } | undefined;
  
  const eoaWallet = user?.linkedAccounts?.find(
    (account) => account.type === 'wallet'
  ) as { type: 'wallet'; address: string; walletClient?: string } | undefined;
  
  const smartWalletAddress = smartWallet?.address as `0x${string}` | undefined;
  const eoaAddress = eoaWallet?.address as `0x${string}` | undefined;
  
  // Check if we're on the right network (Sepolia)
  const isCorrectNetwork = client?.chain?.id === 11155111;
  
  // Create public client for balance checking
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http('https://ethereum-sepolia-rpc.publicnode.com'),
  });
  
  // Load USDC balances and allowance
  const loadBalances = useCallback(async () => {
    if (!eoaAddress || !smartWalletAddress) return;
    
    setLoadingBalances(true);
    try {
      // Load EOA USDC balance
      const eoaBalanceWei = await publicClient.readContract({
        address: CONTRACTS.USDC,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [eoaAddress],
      });
      
      // Load Smart Wallet USDC balance
      const smartBalanceWei = await publicClient.readContract({
        address: CONTRACTS.USDC,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [smartWalletAddress],
      });
      
      // Load allowance (EOA → Smart Wallet)
      const allowanceWei = await publicClient.readContract({
        address: CONTRACTS.USDC,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [eoaAddress, smartWalletAddress],
      });
      
      // USDC has 6 decimals
      const eoaFormatted = (Number(eoaBalanceWei) / 10**6).toFixed(6);
      const smartFormatted = (Number(smartBalanceWei) / 10**6).toFixed(6);
      const allowanceFormatted = (Number(allowanceWei) / 10**6).toFixed(6);
      
      setEoaBalance(eoaFormatted);
      setSmartWalletBalance(smartFormatted);
      setAllowance(allowanceFormatted);
    } catch (err) {
      console.error('Error loading balances:', err);
      setEoaBalance('0.000000');
      setSmartWalletBalance('0.000000');
      setAllowance('0.000000');
    } finally {
      setLoadingBalances(false);
    }
  }, [eoaAddress, smartWalletAddress, publicClient]);
  
  // Approve smart wallet to spend USDC from EOA
  const approveSmartWallet = useCallback(async () => {
    if (!eoaAddress || !smartWalletAddress || !amount || !isCorrectNetwork) return;
    
    setApproving(true);
    setError('');
    setSuccess('');
    
    try {
      // Find the EOA wallet in the wallets list
      const eoaWallet = wallets.find(
        w => w.address.toLowerCase() === eoaAddress.toLowerCase() && w.walletClientType !== 'privy'
      );
      
      if (!eoaWallet) {
        setError('EOA wallet not found');
        return;
      }
      
      // Get the EOA wallet's provider
      const eoaProvider = await eoaWallet.getEthereumProvider();
      
      // Check if on correct network
      const currentChainId = await eoaProvider.request({ method: 'eth_chainId' });
      const sepoliaChainId = '0xaa36a7'; // 11155111 in hex
      
      if (currentChainId !== sepoliaChainId) {
        await eoaProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: sepoliaChainId }],
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      const amountWei = parseUnits(amount, 6); // USDC 6 decimals
      
      const data = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [smartWalletAddress, amountWei],
      });
      
      // Send approval transaction from EOA
      const txHash = await eoaProvider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: eoaAddress,
          to: CONTRACTS.USDC,
          data,
        }],
      });
      
      setSuccess(`Approval successful! Transaction: ${txHash}`);
      
      // Refresh balances/allowance after approval
      setTimeout(loadBalances, 3000);
      
    } catch (err: any) {
      console.error('Approval failed:', err);
      setError(err?.message || 'Approval failed');
    } finally {
      setApproving(false);
    }
  }, [eoaAddress, smartWalletAddress, amount, isCorrectNetwork, wallets, loadBalances]);
  
  // Check smart wallet deployment status
  const checkDeployment = useCallback(async () => {
    if (!smartWalletAddress || !client?.chain) return;
    
    setDeploymentStatus({ isDeployed: false, isChecking: true });
    
    try {
      const code = await publicClient.getBytecode({
        address: smartWalletAddress,
      });
      
      const isDeployed = code !== undefined && code !== '0x' && code !== null;
      setDeploymentStatus({ isDeployed, isChecking: false });
    } catch (err) {
      console.error('Error checking deployment:', err);
      setDeploymentStatus({ isDeployed: false, isChecking: false });
    }
  }, [smartWalletAddress, client, publicClient]);
  
  // Load balances and check deployment when wallets change
  useEffect(() => {
    if (eoaAddress && smartWalletAddress && isCorrectNetwork) {
      loadBalances();
      checkDeployment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eoaAddress, smartWalletAddress, isCorrectNetwork]);
  
  // Batch deposit function using Smart Wallet to transferFrom EOA + supply to AAVE
  const depositUSDCBatch = useCallback(async () => {
    if (!client || !eoaAddress || !smartWalletAddress || !amount || !isCorrectNetwork) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const amountWei = parseUnits(amount, 6); // USDC 6 decimals
      
      console.log('Starting delegation deposit...');
      console.log('EOA address:', eoaAddress);
      console.log('Smart wallet address:', smartWalletAddress);
      console.log('Amount:', amount);
      
      // Prepare transferFrom call data (EOA → Smart Wallet)
      const transferFromCallData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'transferFrom',
        args: [eoaAddress, smartWalletAddress, amountWei],
      });
      
      // Prepare approve call data (Smart Wallet → AAVE Pool)
      const approveCallData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.AAVE_POOL, amountWei],
      });
      
      // Prepare the supply call data
      const supplyCallData = encodeFunctionData({
        abi: AAVE_POOL_ABI,
        functionName: 'supply',
        args: [CONTRACTS.USDC, amountWei, smartWalletAddress, 0],
      });
      
      // Prepare batch call using Multicall3 (transferFrom + approve + supply)
      const batchCallData = encodeFunctionData({
        abi: MULTICALL3_ABI,
        functionName: 'aggregate3',
        args: [
          [
            {
              target: CONTRACTS.USDC,
              allowFailure: false,
              callData: transferFromCallData,
            },
            {
              target: CONTRACTS.USDC,
              allowFailure: false,
              callData: approveCallData,
            },
            {
              target: CONTRACTS.AAVE_POOL,
              allowFailure: false,
              callData: supplyCallData,
            },
          ],
        ],
      });
      
      console.log('Sending batch transaction via smart wallet...');
      
      // Execute batch transaction with smart wallet (gas sponsored!)
      const transactionHash = await client.sendTransaction({
        to: MULTICALL3_ADDRESS,
        data: batchCallData,
        value: 0n,
      });
      
      console.log('Batch transaction hash:', transactionHash);
      
      setTxHash(transactionHash);
      setSuccess('Delegation deposit successful! TransferFrom + Approve + Supply completed in one transaction with sponsored gas.');
      setAmount('');
      
      // Reload balances after successful deposit
      setTimeout(loadBalances, 3000);
      
    } catch (err: any) {
      console.error('Batch deposit failed:', err);
      setError(err?.message || 'Batch transaction failed');
    } finally {
      setLoading(false);
    }
  }, [client, eoaAddress, smartWalletAddress, amount, isCorrectNetwork, loadBalances]);
  
  // Input validation
  const isValidAmount = amount && parseFloat(amount) > 0 && parseFloat(amount) <= parseFloat(eoaBalance);
  const hasApproval = parseFloat(allowance) >= parseFloat(amount || '0');
  const canApprove = !approving && isValidAmount && eoaAddress && smartWalletAddress && isCorrectNetwork && !hasApproval;
  const canDeposit = !loading && isValidAmount && hasApproval && eoaAddress && smartWalletAddress && isCorrectNetwork;
  
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

  if (!smartWallet) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <div className="text-red-600 mb-2">Smart wallet not found</div>
          <div className="text-sm text-gray-500">
            Smart wallets should be automatically created. Check your Privy dashboard configuration.
          </div>
        </div>
      </div>
    );
  }

  if (!eoaWallet) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <div className="text-red-600 mb-2">External wallet not connected</div>
          <div className="text-sm text-gray-500 mb-4">
            Please connect an external wallet (MetaMask, etc.) to fund the smart wallet.
          </div>
          <button
            onClick={connectWallet}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
          >
            Connect External Wallet
          </button>
        </div>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <div className="text-yellow-600 mb-2">Wrong Network</div>
          <div className="text-sm text-gray-500 mb-4">
            Please switch to Ethereum Sepolia testnet to use this feature.
          </div>
          <div className="text-xs text-gray-400">
            Current network: {client?.chain?.name || 'Unknown'} (ID: {client?.chain?.id})
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
        Smart Wallet AAVE Deposit
      </h1>
      <p className="text-sm text-center text-gray-600 mb-6">
        USDC → AAVE v3 (Sepolia Testnet)
      </p>
      
      {/* Wallet Delegation Info */}
      <div className="mb-6 space-y-4">
        {/* EOA Wallet */}
        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-green-900">External Wallet (Funding Source)</h3>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              💰 Funds
            </span>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-green-700 font-medium">Address:</p>
              <p className="font-mono text-xs text-gray-800 break-all bg-white p-2 rounded border">
                {eoaAddress}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-xs text-green-700 font-medium">USDC Balance:</p>
                <span className="text-sm font-semibold text-gray-800">
                  {loadingBalances ? 'Loading...' : eoaBalance}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Smart Wallet */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-blue-900">Smart Wallet (Executor)</h3>
            <div className="flex gap-2">
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                ⚡ Gas Sponsored
              </span>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                📦 Batch Tx
              </span>
            </div>
          </div>
        
          <div className="space-y-2">
            <div>
              <p className="text-xs text-blue-700 font-medium">Address:</p>
              <p className="font-mono text-xs text-gray-800 break-all bg-white p-2 rounded border">
                {smartWalletAddress}
              </p>
            </div>
            
            {/* Deployment Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-xs text-blue-700 font-medium">Status:</p>
                {deploymentStatus.isChecking ? (
                  <span className="text-xs text-yellow-600">🔄 Checking...</span>
                ) : deploymentStatus.isDeployed ? (
                  <span className="text-xs text-green-600">✅ Deployed</span>
                ) : (
                  <span className="text-xs text-yellow-600">⏳ Not deployed</span>
                )}
              </div>
              <button
                onClick={checkDeployment}
                disabled={deploymentStatus.isChecking}
                className="text-xs bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 text-blue-700 disabled:text-gray-400 px-2 py-1 rounded transition-colors"
              >
                {deploymentStatus.isChecking ? '...' : 'Check'}
              </button>
            </div>
          </div>
        </div>

        {/* Allowance Status */}
        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-purple-900">Delegation Status</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${hasApproval ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {hasApproval ? '✅ Approved' : '⏳ Needs Approval'}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-xs text-purple-700 font-medium">Current Allowance:</p>
                <span className="text-sm font-semibold text-gray-800">
                  {loadingBalances ? 'Loading...' : allowance} USDC
                </span>
              </div>
              <button
                onClick={loadBalances}
                disabled={loadingBalances}
                className="text-xs bg-purple-100 hover:bg-purple-200 disabled:bg-gray-100 text-purple-700 disabled:text-gray-400 px-2 py-1 rounded transition-colors"
              >
                {loadingBalances ? '↻' : '↻ Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Amount Input */}
      <div className="mb-4">
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
          Deposit Amount (USDC)
        </label>
        <div className="relative">
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter USDC amount"
            step="0.000001"
            min="0"
            className="w-full p-3 pr-16 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setAmount(eoaBalance)}
            disabled={loading || parseFloat(eoaBalance) === 0}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 disabled:text-gray-400 px-2 py-1 rounded"
          >
            Max
          </button>
        </div>
        {amount && parseFloat(amount) > parseFloat(eoaBalance) && (
          <p className="mt-1 text-sm text-red-600">Insufficient EOA balance</p>
        )}
      </div>
      
      {/* Delegation Benefits */}
      <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-md border border-green-200">
        <h4 className="text-sm font-semibold text-green-800 mb-2">Delegation Benefits:</h4>
        <ul className="text-xs text-green-700 space-y-1">
          <li>✅ Use existing USDC from your external wallet</li>
          <li>✅ Smart wallet handles AAVE interaction with sponsored gas</li>
          <li>✅ Atomic execution (transferFrom + approve + supply)</li>
          <li>✅ Enhanced security with smart contract validation</li>
        </ul>
      </div>
      
      {/* Two-Step Flow */}
      <div className="space-y-3">
        {!hasApproval && (
          <button
            onClick={approveSmartWallet}
            disabled={!canApprove}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 px-4 rounded-md transition-all duration-200 transform hover:scale-105 disabled:scale-100"
          >
            {approving ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Approving Smart Wallet...
              </span>
            ) : (
              '1️⃣ Approve Smart Wallet (External Wallet)'
            )}
          </button>
        )}
        
        <button
          onClick={depositUSDCBatch}
          disabled={!canDeposit}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 px-4 rounded-md transition-all duration-200 transform hover:scale-105 disabled:scale-100"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing Delegation Deposit...
            </span>
          ) : hasApproval ? (
            '🚀 Execute Deposit to AAVE (Gas Free!)'
          ) : (
            '2️⃣ Execute Deposit to AAVE (Needs Approval First)'
          )}
        </button>
      </div>
      
      {/* Status Messages */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <div className="flex items-start">
            <span className="text-red-500 mr-2">❌</span>
            <div>
              <p className="font-medium">Transaction Failed</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
          <div className="flex items-start">
            <span className="text-green-500 mr-2">✅</span>
            <div>
              <p className="font-medium">Success!</p>
              <p className="text-sm">{success}</p>
              {txHash && (
                <div className="mt-2">
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm font-mono break-all inline-flex items-center"
                  >
                    <span className="mr-1">🔗</span>
                    View on Sepolia Etherscan →
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}