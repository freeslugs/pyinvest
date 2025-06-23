import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, formatUnits } from 'viem';
import { sepolia } from 'viem/chains';

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// Create a public client for read-only operations
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(), // Uses the default public RPC
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, tokenAddress } = body;

    if (!walletAddress || !tokenAddress) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing walletAddress or tokenAddress' 
      }, { status: 400 });
    }

    // Read the token balance
    const balanceResult = await publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [walletAddress as `0x${string}`],
    });

    // Format the balance (PyUSD has 6 decimals)
    const formattedBalance = formatUnits(balanceResult as bigint, 6);

    return NextResponse.json({
      success: true,
      balance: formattedBalance,
      raw: (balanceResult as bigint).toString(),
    });

  } catch (error: any) {
    console.error('Balance fetch error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch balance',
    }, { status: 500 });
  }
}