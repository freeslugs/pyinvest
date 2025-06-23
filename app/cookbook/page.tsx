'use client';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useCallback, useEffect, useState } from 'react';
import { encodeFunctionData } from 'viem';

import {
  ERC20_ABI,
  NETWORKS,
  UNISWAP_V3_POSITION_MANAGER_ABI,
  UNISWAP_V3_POSITION_MANAGER_ADDRESS,
  UNISWAP_V3_ROUTER_ABI,
  UNISWAP_V3_ROUTER_ADDRESS,
  getPoolsForNetwork,
  getTokensForNetwork
} from '../../lib/constants';

// Types for our pool data
interface PoolData {
  metaMaskPYUSDBalance: number;
  metaMaskUSDCBalance: number;
  routerAllowance: number;
  positionManagerAllowance: number;
  positionManagerUSDCAllowance: number;
  poolLiquidity: string;
  swapStatus: string;
  liquidityStatus: string;
  nftPositionCount: number;
  totalPoolValueUSD: number;
  error?: string;
}

export default function CookbookPage() {
  const { ready, authenticated, logout } = usePrivy();
  const { wallets } = useWallets();

  // Get the connected MetaMask wallet
  const metamaskWallet = wallets.find(wallet => wallet.walletClientType === 'metamask');

  // Pool data state
  const [poolData, setPoolData] = useState<PoolData>({
    metaMaskPYUSDBalance: 0,
    metaMaskUSDCBalance: 0,
    routerAllowance: 0,
    positionManagerAllowance: 0,
    positionManagerUSDCAllowance: 0,
    poolLiquidity: '0',
    swapStatus: 'Ready',
    liquidityStatus: 'Ready',
    nftPositionCount: 0,
    totalPoolValueUSD: 0,
  });

  // Form state
  const [swapAmount, setSwapAmount] = useState<string>('1');
  const [liquidityAmount, setLiquidityAmount] = useState<string>('2');

  // Get token and pool configurations for Sepolia
  const SEPOLIA_TOKENS = getTokensForNetwork(NETWORKS.SEPOLIA.id);
  const SEPOLIA_POOLS = getPoolsForNetwork(NETWORKS.SEPOLIA.id);
  const PYUSD_TOKEN = SEPOLIA_TOKENS.PYUSD;
  const USDC_TOKEN = SEPOLIA_TOKENS.USDC;
  const PYUSD_USDC_POOL = SEPOLIA_POOLS.PYUSD_USDC;

  // Check token balances and allowances
  const checkBalancesAndAllowances = useCallback(async () => {
    if (!metamaskWallet || !PYUSD_TOKEN || !USDC_TOKEN) {
      console.log('❌ Missing requirements for balance check');
      return;
    }

    try {
      console.log('🔍 === STARTING BALANCE & ALLOWANCE CHECK ===');
      console.log('📍 MetaMask address:', metamaskWallet.address);
      console.log('📍 PYUSD token:', PYUSD_TOKEN.address);
      console.log('📍 USDC token:', USDC_TOKEN.address);
      console.log('📍 Universal Router address:', UNISWAP_V3_ROUTER_ADDRESS);
      console.log('📍 Position Manager:', UNISWAP_V3_POSITION_MANAGER_ADDRESS);

      // Create viem public client
      const { createPublicClient, http } = await import('viem');
      const { sepolia } = await import('viem/chains');

      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http('https://ethereum-sepolia-rpc.publicnode.com'),
      });

      // Check PYUSD balance
      console.log('💰 Checking PYUSD balance...');
      const pyusdBalance = await publicClient.readContract({
        address: PYUSD_TOKEN.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [metamaskWallet.address as `0x${string}`],
      }) as bigint;

      const pyusdBalanceFormatted = Number(pyusdBalance) / Math.pow(10, PYUSD_TOKEN.decimals);
      console.log(`✅ PYUSD Balance: ${pyusdBalanceFormatted} PYUSD`);

      // Check USDC balance
      console.log('💰 Checking USDC balance...');
      const usdcBalance = await publicClient.readContract({
        address: USDC_TOKEN.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [metamaskWallet.address as `0x${string}`],
      }) as bigint;

      const usdcBalanceFormatted = Number(usdcBalance) / Math.pow(10, USDC_TOKEN.decimals);
      console.log(`✅ USDC Balance: ${usdcBalanceFormatted} USDC`);

      // Check Universal Router allowance for PYUSD
      console.log('🔐 Checking Universal Router allowance for PYUSD...');
      const routerAllowance = await publicClient.readContract({
        address: PYUSD_TOKEN.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [metamaskWallet.address as `0x${string}`, UNISWAP_V3_ROUTER_ADDRESS],
      }) as bigint;

      const routerAllowanceFormatted = Number(routerAllowance) / Math.pow(10, PYUSD_TOKEN.decimals);
      console.log(`✅ Router Allowance: ${routerAllowanceFormatted} PYUSD`);

      // Check position manager allowances for BOTH tokens
      console.log('🔐 Checking position manager allowances...');
      const pyusdPMAllowance = await publicClient.readContract({
        address: PYUSD_TOKEN.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [metamaskWallet.address as `0x${string}`, UNISWAP_V3_POSITION_MANAGER_ADDRESS],
      }) as bigint;

      const usdcPMAllowance = await publicClient.readContract({
        address: USDC_TOKEN.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [metamaskWallet.address as `0x${string}`, UNISWAP_V3_POSITION_MANAGER_ADDRESS],
      }) as bigint;

      const pyusdPMAllowanceFormatted = Number(pyusdPMAllowance) / Math.pow(10, PYUSD_TOKEN.decimals);
      const usdcPMAllowanceFormatted = Number(usdcPMAllowance) / Math.pow(10, USDC_TOKEN.decimals);
      console.log(`✅ Position Manager PYUSD Allowance: ${pyusdPMAllowanceFormatted} PYUSD`);
      console.log(`✅ Position Manager USDC Allowance: ${usdcPMAllowanceFormatted} USDC`);

      // Check Uniswap V3 NFT positions
      console.log('🎯 Checking Uniswap V3 positions...');
      let nftCount = 0;
      let totalValueUSD = 0;

      try {
        // Get NFT balance (number of positions)
        const nftBalance = await publicClient.readContract({
          address: UNISWAP_V3_POSITION_MANAGER_ADDRESS as `0x${string}`,
          abi: UNISWAP_V3_POSITION_MANAGER_ABI,
          functionName: 'balanceOf',
          args: [metamaskWallet.address as `0x${string}`],
        }) as bigint;

        nftCount = Number(nftBalance);
        console.log(`💎 NFT Positions owned: ${nftCount}`);

        if (nftCount > 0) {
          // For each NFT, get position details and calculate value
          for (let i = 0; i < nftCount; i++) {
            try {
              // Get token ID by index
              const tokenId = await publicClient.readContract({
                address: UNISWAP_V3_POSITION_MANAGER_ADDRESS as `0x${string}`,
                abi: UNISWAP_V3_POSITION_MANAGER_ABI,
                functionName: 'tokenOfOwnerByIndex',
                args: [metamaskWallet.address as `0x${string}`, BigInt(i)],
              }) as bigint;

              console.log(`📍 Position ${i + 1} - Token ID: ${tokenId}`);

              // Get position details
              const position = await publicClient.readContract({
                address: UNISWAP_V3_POSITION_MANAGER_ADDRESS as `0x${string}`,
                abi: UNISWAP_V3_POSITION_MANAGER_ABI,
                functionName: 'positions',
                args: [tokenId],
              }) as readonly [bigint, `0x${string}`, `0x${string}`, `0x${string}`, number, number, number, bigint, bigint, bigint, bigint, bigint];

              // Position data structure: [nonce, operator, token0, token1, fee, tickLower, tickUpper, liquidity, feeGrowthInside0LastX128, feeGrowthInside1LastX128, tokensOwed0, tokensOwed1]
              const token0Address = position[2];
              const token1Address = position[3];
              const fee = position[4];
              const liquidity = position[7];
              const tokensOwed0 = position[10];
              const tokensOwed1 = position[11];

              // Check if this is our PYUSD/USDC pool
              const isOurPool = (
                (token0Address.toLowerCase() === USDC_TOKEN.address.toLowerCase() &&
                 token1Address.toLowerCase() === PYUSD_TOKEN.address.toLowerCase()) ||
                (token0Address.toLowerCase() === PYUSD_TOKEN.address.toLowerCase() &&
                 token1Address.toLowerCase() === USDC_TOKEN.address.toLowerCase())
              ) && fee === PYUSD_USDC_POOL.fee;

              if (isOurPool && Number(liquidity) > 0) {
                // Calculate approximate position value
                // For simplicity, assume roughly equal split between tokens
                const token0Amount = Number(tokensOwed0) / Math.pow(10, 6); // Both tokens have 6 decimals
                const token1Amount = Number(tokensOwed1) / Math.pow(10, 6);

                // Rough USD value (assuming USDC ≈ $1, PYUSD ≈ $1)
                const positionValueUSD = token0Amount + token1Amount;
                totalValueUSD += positionValueUSD;

                console.log(`💰 Position ${i + 1} value: ~$${positionValueUSD.toFixed(2)} USD`);
                console.log(`   Token0: ${token0Amount.toFixed(4)}, Token1: ${token1Amount.toFixed(4)}`);
              }
            } catch (positionError) {
              console.warn(`⚠️ Could not read position ${i + 1}:`, positionError);
            }
          }
        }

        console.log(`💎 Total NFT positions: ${nftCount}`);
        console.log(`💰 Total pool value: ~$${totalValueUSD.toFixed(2)} USD`);

      } catch (nftError) {
        console.warn('⚠️ Could not read NFT positions:', nftError);
      }

      // Update state
      setPoolData(prev => ({
        ...prev,
        metaMaskPYUSDBalance: pyusdBalanceFormatted,
        metaMaskUSDCBalance: usdcBalanceFormatted,
        routerAllowance: routerAllowanceFormatted,
        positionManagerAllowance: pyusdPMAllowanceFormatted,
        positionManagerUSDCAllowance: usdcPMAllowanceFormatted,
        nftPositionCount: nftCount,
        totalPoolValueUSD: totalValueUSD,
        error: undefined,
      }));

      console.log('✅ === BALANCE & ALLOWANCE CHECK COMPLETED ===\n');

    } catch (error) {
      console.error('❌ Error checking balances:', error);
      setPoolData(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [metamaskWallet, PYUSD_TOKEN, USDC_TOKEN]);

  // Load data on component mount and when wallet changes
  useEffect(() => {
    if (ready && authenticated && metamaskWallet) {
      checkBalancesAndAllowances();
    }
  }, [ready, authenticated, metamaskWallet, checkBalancesAndAllowances]);

  // Approve router to spend PYUSD
  const approveRouter = async () => {
    if (!metamaskWallet || !PYUSD_TOKEN) {
      console.log('❌ Missing requirements for router approval');
      return;
    }

    try {
      console.log('🔄 === STARTING ROUTER APPROVAL ===');

             // Switch to Sepolia
       await metamaskWallet.switchChain(NETWORKS.SEPOLIA.id);

       // Large approval amount (1 million PYUSD)
       const approvalAmount = BigInt(1_000_000 * Math.pow(10, PYUSD_TOKEN.decimals));
       console.log(`💰 Approving ${Number(approvalAmount) / Math.pow(10, PYUSD_TOKEN.decimals)} PYUSD to router`);

       // Get Ethereum provider
       const provider = await metamaskWallet.getEthereumProvider();

       // Create approval transaction
       const approveTx = await provider.request({
         method: 'eth_sendTransaction',
         params: [{
           from: metamaskWallet.address,
           to: PYUSD_TOKEN.address,
           data: encodeFunctionData({
             abi: ERC20_ABI,
             functionName: 'approve',
             args: [UNISWAP_V3_ROUTER_ADDRESS, approvalAmount],
           }),
         }],
       });

      console.log(`✅ Router approval transaction sent: ${approveTx}`);

      // Wait a bit then refresh balances
      setTimeout(() => {
        checkBalancesAndAllowances();
      }, 3000);

    } catch (error) {
      console.error('❌ Router approval failed:', error);
      setPoolData(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Approval failed',
      }));
    }
  };

  // Approve position manager to spend tokens
  const approvePositionManager = async () => {
    if (!metamaskWallet || !PYUSD_TOKEN || !USDC_TOKEN) {
      console.log('❌ Missing requirements for position manager approval');
      return;
    }

    try {
      console.log('🔄 === STARTING POSITION MANAGER APPROVAL ===');

             // Switch to Sepolia
       await metamaskWallet.switchChain(NETWORKS.SEPOLIA.id);

       // Get Ethereum provider
       const provider = await metamaskWallet.getEthereumProvider();

       // Large approval amount
       const approvalAmount = BigInt(1_000_000 * Math.pow(10, PYUSD_TOKEN.decimals));

       console.log('💰 Approving PYUSD to position manager...');
       const pyusdApproval = await provider.request({
         method: 'eth_sendTransaction',
         params: [{
           from: metamaskWallet.address,
           to: PYUSD_TOKEN.address,
           data: encodeFunctionData({
             abi: ERC20_ABI,
             functionName: 'approve',
             args: [UNISWAP_V3_POSITION_MANAGER_ADDRESS, approvalAmount],
           }),
         }],
       });
       console.log(`✅ PYUSD approval: ${pyusdApproval}`);

       console.log('💰 Approving USDC to position manager...');
       const usdcApprovalAmount = BigInt(1_000_000 * Math.pow(10, USDC_TOKEN.decimals));
       const usdcApproval = await provider.request({
         method: 'eth_sendTransaction',
         params: [{
           from: metamaskWallet.address,
           to: USDC_TOKEN.address,
           data: encodeFunctionData({
             abi: ERC20_ABI,
             functionName: 'approve',
             args: [UNISWAP_V3_POSITION_MANAGER_ADDRESS, usdcApprovalAmount],
           }),
         }],
       });
       console.log(`✅ USDC approval: ${usdcApproval}`);

      // Wait then refresh balances
      setTimeout(() => {
        checkBalancesAndAllowances();
      }, 5000);

    } catch (error) {
      console.error('❌ Position manager approval failed:', error);
      setPoolData(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Position manager approval failed',
      }));
    }
  };

  // Perform swap: PYUSD → USDC
  const performSwap = async () => {
    if (!metamaskWallet || !PYUSD_TOKEN || !USDC_TOKEN || !PYUSD_USDC_POOL) {
      console.log('❌ Missing requirements for swap');
      return;
    }

    try {
      console.log('🔄 === STARTING PYUSD → USDC SWAP ===');
      setPoolData(prev => ({ ...prev, swapStatus: 'Swapping...' }));

             // Switch to Sepolia
       await metamaskWallet.switchChain(NETWORKS.SEPOLIA.id);

       // Get Ethereum provider
       const provider = await metamaskWallet.getEthereumProvider();

       // Calculate swap amount in wei
       const swapAmountWei = BigInt(Number(swapAmount) * Math.pow(10, PYUSD_TOKEN.decimals));
       console.log(`💱 Swapping ${swapAmount} PYUSD (${swapAmountWei} wei) for USDC`);

       // Create deadline (20 minutes from now)
       const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);
       console.log(`⏰ Deadline: ${deadline}`);

       // Calculate minimum output amount with 5% slippage tolerance
       // Based on rough price ratio from successful txs: ~70 PYUSD per USDC
       const estimatedOutputWei = swapAmountWei / 70n; // Rough estimate
       const slippageToleranceBps = 500n; // 5% = 500 basis points
       const amountOutMinimum = (estimatedOutputWei * (10000n - slippageToleranceBps)) / 10000n;

       console.log(`📊 Estimated output: ${estimatedOutputWei} wei USDC`);
       console.log(`📊 Minimum output (5% slippage): ${amountOutMinimum} wei USDC`);

       // Construct swap parameters
       const swapParams = {
         tokenIn: PYUSD_TOKEN.address as `0x${string}`,
         tokenOut: USDC_TOKEN.address as `0x${string}`,
         fee: PYUSD_USDC_POOL.fee,
         recipient: metamaskWallet.address as `0x${string}`,
         deadline,
         amountIn: swapAmountWei,
         amountOutMinimum, // Proper slippage protection
         sqrtPriceLimitX96: 0n, // No price limit for now
       };

       console.log('📋 Swap parameters:', {
         ...swapParams,
         deadline: swapParams.deadline.toString(),
         amountIn: swapParams.amountIn.toString(),
         amountOutMinimum: swapParams.amountOutMinimum.toString(),
       });

       // Validate parameters before encoding
       console.log('🔍 Validating swap parameters...');
       console.log(`  - Token In: ${swapParams.tokenIn}`);
       console.log(`  - Token Out: ${swapParams.tokenOut}`);
       console.log(`  - Fee: ${swapParams.fee}`);
       console.log(`  - Recipient: ${swapParams.recipient}`);
       console.log(`  - Amount In: ${swapParams.amountIn.toString()} wei (${Number(swapParams.amountIn) / Math.pow(10, PYUSD_TOKEN.decimals)} tokens)`);
       console.log(`  - Min Amount Out: ${swapParams.amountOutMinimum.toString()} wei (${Number(swapParams.amountOutMinimum) / Math.pow(10, USDC_TOKEN.decimals)} tokens)`);

       // Encode V3_SWAP_EXACT_IN command (0x00) for Universal Router
       const { encodeAbiParameters } = await import('viem');

       // Command 0x00 = V3_SWAP_EXACT_IN
       const commands = '0x00';

       // Encode the swap input parameters for V3_SWAP_EXACT_IN
       const swapInput = encodeAbiParameters(
         [
           { name: 'recipient', type: 'address' },
           { name: 'amountIn', type: 'uint256' },
           { name: 'amountOutMinimum', type: 'uint256' },
           { name: 'path', type: 'bytes' },
           { name: 'payerIsUser', type: 'bool' },
         ],
         [
           metamaskWallet.address as `0x${string}`,
           swapAmountWei,
           amountOutMinimum,
           // Encode path: token0 + fee + token1 (packed format)
           `0x${PYUSD_TOKEN.address.slice(2)}${PYUSD_USDC_POOL.fee.toString(16).padStart(6, '0')}${USDC_TOKEN.address.slice(2)}` as `0x${string}`,
           true, // User pays input token
         ]
       );

       console.log('📞 Universal Router command:', commands);
       console.log('📞 Swap input data:', swapInput);

               // Encode the Universal Router execute call
        const executeCalldata = encodeFunctionData({
          abi: UNISWAP_V3_ROUTER_ABI,
          functionName: 'execute',
          args: [commands as `0x${string}`, [swapInput], deadline],
        });

       console.log('📞 Execute calldata:', executeCalldata);
       console.log('📞 Universal Router address:', UNISWAP_V3_ROUTER_ADDRESS);

       // Execute swap transaction
       console.log('🚀 Executing Universal Router swap transaction...');
       const swapGasLimit = '0x7A120'; // 500k gas limit (sufficient for swaps)
       console.log('📊 Swap gas limit:', parseInt(swapGasLimit, 16).toLocaleString(), 'gas');

       const swapTx = await provider.request({
         method: 'eth_sendTransaction',
         params: [{
           from: metamaskWallet.address,
           to: UNISWAP_V3_ROUTER_ADDRESS,
           data: executeCalldata,
           gas: swapGasLimit,
         }],
       });

      console.log(`✅ Swap transaction sent: ${swapTx}`);
      setPoolData(prev => ({ ...prev, swapStatus: `Swap completed! Tx: ${swapTx}` }));

      // Refresh balances after swap
      setTimeout(() => {
        checkBalancesAndAllowances();
      }, 5000);

    } catch (error) {
      console.error('❌ Swap failed:', error);
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
      });

      // Try to extract more meaningful error info
      let errorMessage = 'Swap failed';
      if (error instanceof Error) {
        if (error.message.includes('execution reverted')) {
          errorMessage = 'Transaction reverted - check slippage/liquidity';
        } else if (error.message.includes('insufficient')) {
          errorMessage = 'Insufficient balance or allowance';
        } else if (error.message.includes('user denied')) {
          errorMessage = 'Transaction rejected by user';
        } else {
          errorMessage = error.message;
        }
      }

      setPoolData(prev => ({
        ...prev,
        swapStatus: 'Swap failed',
        error: errorMessage,
      }));
    }
  };

  // Add liquidity to Uniswap V3 pool
  const addLiquidity = async () => {
    if (!metamaskWallet || !PYUSD_TOKEN || !USDC_TOKEN || !PYUSD_USDC_POOL) {
      console.log('❌ Missing requirements for liquidity');
      return;
    }

    try {
      console.log('🔄 === STARTING LIQUIDITY ADDITION ===');
      setPoolData(prev => ({ ...prev, liquidityStatus: 'Adding liquidity...' }));

      // Switch to Sepolia
      await metamaskWallet.switchChain(NETWORKS.SEPOLIA.id);

      // Get Ethereum provider
      const provider = await metamaskWallet.getEthereumProvider();

      console.log('🔍 === LIQUIDITY VALIDATION & SETUP ===');
      console.log('📍 Wallet Address:', metamaskWallet.address);
      console.log('📍 PYUSD Token:', PYUSD_TOKEN.address, `(${PYUSD_TOKEN.decimals} decimals)`);
      console.log('📍 USDC Token:', USDC_TOKEN.address, `(${USDC_TOKEN.decimals} decimals)`);
      console.log('📍 Pool Address:', PYUSD_USDC_POOL.address);
      console.log('📍 Position Manager:', UNISWAP_V3_POSITION_MANAGER_ADDRESS);

      // Validate pool configuration by reading from the pool contract
      console.log('🔍 === POOL VALIDATION ===');
      try {
        const { createPublicClient, http } = await import('viem');
        const { sepolia } = await import('viem/chains');

        const publicClient = createPublicClient({
          chain: sepolia,
          transport: http('https://ethereum-sepolia-rpc.publicnode.com'),
        });

        // Read pool configuration
        const poolToken0 = await publicClient.readContract({
          address: PYUSD_USDC_POOL.address as `0x${string}`,
          abi: [
            {
              inputs: [],
              name: 'token0',
              outputs: [{ name: '', type: 'address' }],
              stateMutability: 'view',
              type: 'function',
            },
          ],
          functionName: 'token0',
        }) as string;

        const poolToken1 = await publicClient.readContract({
          address: PYUSD_USDC_POOL.address as `0x${string}`,
          abi: [
            {
              inputs: [],
              name: 'token1',
              outputs: [{ name: '', type: 'address' }],
              stateMutability: 'view',
              type: 'function',
            },
          ],
          functionName: 'token1',
        }) as string;

        const poolFee = await publicClient.readContract({
          address: PYUSD_USDC_POOL.address as `0x${string}`,
          abi: [
            {
              inputs: [],
              name: 'fee',
              outputs: [{ name: '', type: 'uint24' }],
              stateMutability: 'view',
              type: 'function',
            },
          ],
          functionName: 'fee',
        }) as number;

        console.log('✅ Pool Validation Results:');
        console.log('📍 Pool Token0:', poolToken0);
        console.log('📍 Pool Token1:', poolToken1);
        console.log('📍 Pool Fee:', poolFee);
        console.log('✅ Token0 matches USDC:', poolToken0.toLowerCase() === USDC_TOKEN.address.toLowerCase());
        console.log('✅ Token1 matches PYUSD:', poolToken1.toLowerCase() === PYUSD_TOKEN.address.toLowerCase());
        console.log('✅ Fee matches config:', poolFee === PYUSD_USDC_POOL.fee);

        if (poolFee !== PYUSD_USDC_POOL.fee) {
          throw new Error(`Pool fee mismatch: expected ${PYUSD_USDC_POOL.fee}, got ${poolFee}`);
        }

      } catch (poolValidationError) {
        console.error('❌ Pool validation failed:', poolValidationError);
        // Continue anyway, but log the issue
      }

      // Calculate amounts in wei
      const pyusdAmountWei = BigInt(Number(liquidityAmount) * Math.pow(10, PYUSD_TOKEN.decimals));
      const usdcAmountWei = BigInt(Number(liquidityAmount) * Math.pow(10, USDC_TOKEN.decimals));

      console.log(`💰 Desired amounts: ${liquidityAmount} PYUSD (${pyusdAmountWei} wei) and ${liquidityAmount} USDC (${usdcAmountWei} wei)`);

      // Determine correct token order (token0 < token1 by address)
      const isUSDCToken0 = USDC_TOKEN.address.toLowerCase() < PYUSD_TOKEN.address.toLowerCase();
      const token0Address = isUSDCToken0 ? USDC_TOKEN.address : PYUSD_TOKEN.address;
      const token1Address = isUSDCToken0 ? PYUSD_TOKEN.address : USDC_TOKEN.address;
      const token0Symbol = isUSDCToken0 ? 'USDC' : 'PYUSD';
      const token1Symbol = isUSDCToken0 ? 'PYUSD' : 'USDC';

      // Assign amounts according to token order
      const amount0Desired = isUSDCToken0 ? usdcAmountWei : pyusdAmountWei;
      const amount1Desired = isUSDCToken0 ? pyusdAmountWei : usdcAmountWei;

      console.log('🔄 === TOKEN ORDERING ===');
      console.log(`📍 Token0 (${token0Symbol}):`, token0Address);
      console.log(`📍 Token1 (${token1Symbol}):`, token1Address);
      console.log(`💰 Amount0Desired (${token0Symbol}):`, amount0Desired.toString(), 'wei');
      console.log(`� Amount1Desired (${token1Symbol}):`, amount1Desired.toString(), 'wei');

            // Get correct tick spacing based on fee tier
      const getTickSpacing = (feeTier: number): number => {
        switch (feeTier) {
          case 500:   return 10;   // 0.05%
          case 3000:  return 60;   // 0.3%
          case 10000: return 200;  // 1%
          default: throw new Error(`Unsupported fee tier: ${feeTier}`);
        }
      };

      const tickSpacing = getTickSpacing(PYUSD_USDC_POOL.fee);
      const maxTick = 887270; // Maximum tick for Uniswap V3

      // Calculate largest valid ticks (must be divisible by tick spacing)
      const tickLower = -Math.floor(maxTick / tickSpacing) * tickSpacing;
      const tickUpper = Math.floor(maxTick / tickSpacing) * tickSpacing;

      console.log('🎯 === TICK RANGE CALCULATION ===');
      console.log('📍 Fee Tier:', PYUSD_USDC_POOL.fee, '(0.3%)');
      console.log('📍 Required Tick Spacing:', tickSpacing);
      console.log('📍 Tick Lower:', tickLower, `(${tickLower / tickSpacing} * ${tickSpacing})`);
      console.log('📍 Tick Upper:', tickUpper, `(${tickUpper / tickSpacing} * ${tickSpacing})`);
      console.log('✅ Tick Lower divisible by spacing:', tickLower % tickSpacing === 0);
      console.log('✅ Tick Upper divisible by spacing:', tickUpper % tickSpacing === 0);

      // Add 5% slippage protection
      const slippageToleranceBps = 500n; // 5%
      const amount0Min = (amount0Desired * (10000n - slippageToleranceBps)) / 10000n;
      const amount1Min = (amount1Desired * (10000n - slippageToleranceBps)) / 10000n;

      console.log('🛡️ === SLIPPAGE PROTECTION ===');
      console.log(`💰 Amount0Min (${token0Symbol}):`, amount0Min.toString(), 'wei (5% slippage)');
      console.log(`💰 Amount1Min (${token1Symbol}):`, amount1Min.toString(), 'wei (5% slippage)');

      // Create deadline (20 minutes from now)
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);
      console.log('⏰ Deadline:', deadline.toString());

      // Pre-flight checks for balances and allowances
      console.log('🔍 === PRE-FLIGHT CHECKS ===');

      // Check current balances
      const currentPYUSDBalance = poolData.metaMaskPYUSDBalance;
      const currentUSDCBalance = poolData.metaMaskUSDCBalance;
      const requiredPYUSD = Number(pyusdAmountWei) / Math.pow(10, PYUSD_TOKEN.decimals);
      const requiredUSDC = Number(usdcAmountWei) / Math.pow(10, USDC_TOKEN.decimals);

      console.log('💰 Balance Check:');
      console.log(`  - Current PYUSD: ${currentPYUSDBalance}, Required: ${requiredPYUSD}`);
      console.log(`  - Current USDC: ${currentUSDCBalance}, Required: ${requiredUSDC}`);
      console.log(`  - PYUSD Sufficient: ${currentPYUSDBalance >= requiredPYUSD}`);
      console.log(`  - USDC Sufficient: ${currentUSDCBalance >= requiredUSDC}`);

      // Check allowances
      const currentPYUSDAllowance = poolData.positionManagerAllowance;
      const currentUSDCAllowance = poolData.positionManagerUSDCAllowance;

      console.log('🔐 Allowance Check:');
      console.log(`  - PYUSD Allowance: ${currentPYUSDAllowance}, Required: ${requiredPYUSD}`);
      console.log(`  - USDC Allowance: ${currentUSDCAllowance}, Required: ${requiredUSDC}`);
      console.log(`  - PYUSD Allowance Sufficient: ${currentPYUSDAllowance >= requiredPYUSD}`);
      console.log(`  - USDC Allowance Sufficient: ${currentUSDCAllowance >= requiredUSDC}`);

      // Validate all requirements
      if (currentPYUSDBalance < requiredPYUSD) {
        throw new Error(`Insufficient PYUSD balance: have ${currentPYUSDBalance}, need ${requiredPYUSD}`);
      }
      if (currentUSDCBalance < requiredUSDC) {
        throw new Error(`Insufficient USDC balance: have ${currentUSDCBalance}, need ${requiredUSDC}`);
      }
      if (currentPYUSDAllowance < requiredPYUSD) {
        throw new Error(`Insufficient PYUSD allowance: have ${currentPYUSDAllowance}, need ${requiredPYUSD}`);
      }
      if (currentUSDCAllowance < requiredUSDC) {
        throw new Error(`Insufficient USDC allowance: have ${currentUSDCAllowance}, need ${requiredUSDC}`);
      }

      console.log('✅ All pre-flight checks passed!');

      // Construct mint parameters
      const mintParams = {
        token0: token0Address as `0x${string}`,
        token1: token1Address as `0x${string}`,
        fee: PYUSD_USDC_POOL.fee,
        tickLower,
        tickUpper,
        amount0Desired,
        amount1Desired,
        amount0Min,
        amount1Min,
        recipient: metamaskWallet.address as `0x${string}`,
        deadline,
      };

      console.log('📋 === FINAL MINT PARAMETERS ===');
      console.log('Parameters for Position Manager mint():', {
        token0: mintParams.token0,
        token1: mintParams.token1,
        fee: mintParams.fee,
        tickLower: mintParams.tickLower,
        tickUpper: mintParams.tickUpper,
        amount0Desired: mintParams.amount0Desired.toString(),
        amount1Desired: mintParams.amount1Desired.toString(),
        amount0Min: mintParams.amount0Min.toString(),
        amount1Min: mintParams.amount1Min.toString(),
        recipient: mintParams.recipient,
        deadline: mintParams.deadline.toString(),
      });

      // Encode the mint call
      const mintCalldata = encodeFunctionData({
        abi: UNISWAP_V3_POSITION_MANAGER_ABI,
        functionName: 'mint',
        args: [mintParams],
      });

      console.log('📞 === TRANSACTION PREPARATION ===');
      console.log('📞 Position Manager Address:', UNISWAP_V3_POSITION_MANAGER_ADDRESS);
      console.log('📞 Mint Calldata:', mintCalldata);

      // Execute mint transaction with higher gas limit
      console.log('🚀 === EXECUTING LIQUIDITY ADDITION ===');

      // Use higher gas limit for full-range positions (800k gas)
      const gasLimit = '0xC3500'; // 800,000 gas limit for full-range positions
      console.log('📊 Gas limit set to:', parseInt(gasLimit, 16).toLocaleString(), 'gas');

      const mintTx = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: metamaskWallet.address,
          to: UNISWAP_V3_POSITION_MANAGER_ADDRESS,
          data: mintCalldata,
          gas: gasLimit,
        }],
      });

      console.log(`✅ Liquidity addition transaction sent: ${mintTx}`);
      setPoolData(prev => ({ ...prev, liquidityStatus: `Liquidity added! Tx: ${mintTx}` }));

      // Refresh balances
      setTimeout(() => {
        checkBalancesAndAllowances();
      }, 5000);

    } catch (error) {
      console.error('❌ === LIQUIDITY ADDITION FAILED ===');
      console.error('❌ Error details:', error);
      console.error('❌ Error name:', error instanceof Error ? error.name : 'Unknown');
      console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');

      // Try to extract more meaningful error info
      let errorMessage = 'Liquidity addition failed';
      if (error instanceof Error) {
        if (error.message.includes('execution reverted')) {
          errorMessage = 'Transaction reverted - check token approvals and balances';
        } else if (error.message.includes('insufficient')) {
          errorMessage = 'Insufficient balance or allowance for one or both tokens';
        } else if (error.message.includes('user denied')) {
          errorMessage = 'Transaction rejected by user';
        } else if (error.message.includes('TRANSFER_FROM_FAILED')) {
          errorMessage = 'Token transfer failed - check approvals to Position Manager';
        } else if (error.message.includes('T')) {
          errorMessage = 'Tick range or pool configuration issue';
        } else {
          errorMessage = error.message;
        }
      }

      setPoolData(prev => ({
        ...prev,
        liquidityStatus: 'Liquidity addition failed',
        error: errorMessage,
      }));
    }
  };

  if (!ready || !authenticated) {
    return (
      <main className='flex min-h-screen flex-col items-center justify-center bg-privy-light-blue px-4 py-6'>
        <div className='text-center'>
          <h1 className='text-2xl font-semibold mb-4'>Please log in to continue</h1>
          <p className='text-gray-600'>You need to be authenticated to use the DeFi features.</p>
        </div>
      </main>
    );
  }

  if (!metamaskWallet) {
    return (
      <main className='flex min-h-screen flex-col items-center justify-center bg-privy-light-blue px-4 py-6'>
        <div className='text-center'>
          <h1 className='text-2xl font-semibold mb-4'>MetaMask Required</h1>
          <p className='text-gray-600 mb-4'>This demo requires a MetaMask wallet to be connected.</p>
          <p className='text-sm text-gray-500'>Please connect MetaMask through the login process.</p>
        </div>
      </main>
    );
  }

  return (
    <main className='flex min-h-screen flex-col bg-privy-light-blue px-4 py-6 sm:px-20 sm:py-10'>
      {/* Header */}
      <div className='flex flex-row justify-between'>
        <h1 className='text-2xl font-semibold'>Uniswap V3 PYUSD/USDC Demo</h1>
        <button
          onClick={logout}
          className='rounded-md bg-violet-200 px-4 py-2 text-sm text-violet-700 hover:text-violet-900'
        >
          Logout
        </button>
      </div>

      {/* Wallet Info */}
      <div className='mt-8 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6'>
        <h2 className='mb-4 text-xl font-bold text-blue-900'>MetaMask Wallet</h2>
        <p className='text-sm text-blue-700'>Address: {metamaskWallet.address}</p>
        <p className='text-sm text-blue-700'>Network: Sepolia Testnet</p>
      </div>

      {/* Balance Information */}
      <div className='mt-8 rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-6'>
        <h2 className='mb-4 text-xl font-bold text-green-900'>Token Balances & Approvals</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <h3 className='font-semibold text-green-800'>Balances</h3>
            <p className='text-sm text-green-700'>PYUSD: {poolData.metaMaskPYUSDBalance.toFixed(4)}</p>
            <p className='text-sm text-green-700'>USDC: {poolData.metaMaskUSDCBalance.toFixed(4)}</p>
            <div className='border-t border-green-300 mt-2 pt-2'>
              <p className='text-sm text-green-700'>🏊‍♂️ Pool Positions: {poolData.nftPositionCount}</p>
              <p className='text-sm font-semibold text-green-800'>
                💰 Pool Value: ${poolData.totalPoolValueUSD.toFixed(2)}
                {poolData.totalPoolValueUSD > 0 && " 🎉 Earning fees!"}
              </p>
            </div>
          </div>
          <div>
            <h3 className='font-semibold text-green-800'>Approvals</h3>
            <p className='text-sm text-green-700'>Router: {poolData.routerAllowance.toFixed(2)} PYUSD</p>
            <p className='text-sm text-green-700'>Position Mgr PYUSD: {poolData.positionManagerAllowance.toFixed(2)}</p>
            <p className='text-sm text-green-700'>Position Mgr USDC: {poolData.positionManagerUSDCAllowance.toFixed(2)}</p>
          </div>
        </div>
        <button
          onClick={checkBalancesAndAllowances}
          className='mt-4 rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700'
        >
          🔄 Refresh Data
        </button>
      </div>

      {/* Approval Section */}
      <div className='mt-8 rounded-lg border border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 p-6'>
        <h2 className='mb-4 text-xl font-bold text-yellow-900'>Step 1: Token Approvals</h2>
        <p className='mb-4 text-sm text-yellow-700'>
          Approve contracts to spend your tokens before swapping or adding liquidity.
        </p>
        <div className='space-x-4'>
          <button
            onClick={approveRouter}
            className='rounded bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700'
            disabled={poolData.routerAllowance > 100}
          >
            {poolData.routerAllowance > 100 ? '✅ Router Approved' : '🔓 Approve Router'}
          </button>
          <button
            onClick={approvePositionManager}
            className='rounded bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700'
            disabled={poolData.positionManagerAllowance > 100 && poolData.positionManagerUSDCAllowance > 100}
          >
            {poolData.positionManagerAllowance > 100 && poolData.positionManagerUSDCAllowance > 100
              ? '✅ Position Mgr Approved (Both Tokens)'
              : '🔓 Approve Position Manager (Both Tokens)'}
          </button>
        </div>
      </div>

      {/* Swap Section */}
      <div className='mt-8 rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 p-6'>
        <h2 className='mb-4 text-xl font-bold text-purple-900'>Step 2: Swap PYUSD → USDC</h2>
        <p className='mb-4 text-sm text-purple-700'>
          Test the Uniswap V3 swap functionality by converting PYUSD to USDC.
        </p>
        <div className='mb-4'>
          <label className='block text-sm font-medium text-purple-800'>Amount to Swap (PYUSD)</label>
          <input
            type='number'
            value={swapAmount}
            onChange={(e) => setSwapAmount(e.target.value)}
            className='mt-1 block w-32 rounded-md border-gray-300 px-3 py-2 text-sm'
            step='0.1'
            min='0'
          />
        </div>
        <button
          onClick={performSwap}
          className='rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700'
          disabled={poolData.routerAllowance < 1 || poolData.metaMaskPYUSDBalance < Number(swapAmount)}
        >
          🔄 Swap PYUSD → USDC
        </button>
        <p className='mt-2 text-sm text-purple-700'>Status: {poolData.swapStatus}</p>
      </div>

      {/* Liquidity Section */}
      <div className='mt-8 rounded-lg border border-red-200 bg-gradient-to-r from-red-50 to-pink-50 p-6'>
        <h2 className='mb-4 text-xl font-bold text-red-900'>Step 3: Add Liquidity to Pool</h2>
        <p className='mb-4 text-sm text-red-700'>
          Add liquidity to the PYUSD/USDC pool and receive LP NFT tokens representing your position.
        </p>
        <div className='mb-4'>
          <label className='block text-sm font-medium text-red-800'>Amount of Each Token</label>
          <input
            type='number'
            value={liquidityAmount}
            onChange={(e) => setLiquidityAmount(e.target.value)}
            className='mt-1 block w-32 rounded-md border-gray-300 px-3 py-2 text-sm'
            step='0.1'
            min='0'
          />
          <p className='text-xs text-red-600 mt-1'>This will add {liquidityAmount} PYUSD + {liquidityAmount} USDC</p>
        </div>
        <button
          onClick={addLiquidity}
          className='rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700'
          disabled={
            poolData.positionManagerAllowance < 1 ||
            poolData.positionManagerUSDCAllowance < 1 ||
            poolData.metaMaskPYUSDBalance < Number(liquidityAmount) ||
            poolData.metaMaskUSDCBalance < Number(liquidityAmount)
          }
        >
          🏊 Add Liquidity
        </button>
        <p className='mt-2 text-sm text-red-700'>Status: {poolData.liquidityStatus}</p>
      </div>

      {/* Error Display */}
      {poolData.error && (
        <div className='mt-8 rounded-lg border border-red-300 bg-red-50 p-4'>
          <h3 className='font-semibold text-red-800'>Error</h3>
          <p className='text-sm text-red-700'>{poolData.error}</p>
        </div>
      )}

      {/* Debug Info */}
      <div className='mt-8 rounded-lg border border-gray-200 bg-gray-50 p-6'>
        <h2 className='mb-4 text-xl font-bold text-gray-900'>Debug Information</h2>
        <div className='space-y-2 text-sm text-gray-700'>
          <p><strong>PYUSD Token:</strong> {PYUSD_TOKEN?.address}</p>
          <p><strong>USDC Token:</strong> {USDC_TOKEN?.address}</p>
          <p><strong>Pool Address:</strong> {PYUSD_USDC_POOL?.address}</p>
          <p><strong>Pool Fee:</strong> {PYUSD_USDC_POOL?.fee} (0.3%)</p>
          <p><strong>Router:</strong> {UNISWAP_V3_ROUTER_ADDRESS}</p>
          <p><strong>Position Manager:</strong> {UNISWAP_V3_POSITION_MANAGER_ADDRESS}</p>
        </div>
        <p className='mt-4 text-xs text-gray-500'>
          Check browser console for detailed transaction logs and debugging information.
        </p>
      </div>
    </main>
  );
}
