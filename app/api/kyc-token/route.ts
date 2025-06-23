import {
  createPrivyClient,
  fetchAndVerifyAuthorizationAppRouter,
} from '@/lib/server-utils';
import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { bscTestnet } from 'viem/chains';

const client = createPrivyClient();

// KYC Contract ABI - based on user description
const KYC_CONTRACT_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'mintFree',
    type: 'function',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

const KYC_CONTRACT_ADDRESS = '0xcc8e8b424464991bbcda036c4781a60334c40628' as const;

// Create a public client for BSC testnet read operations
const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http('https://data-seed-prebsc-1-s1.binance.org:8545'),
});

export async function POST(request: NextRequest) {
  const errorOrVerifiedClaims = await fetchAndVerifyAuthorizationAppRouter(
    request,
    client
  );

  // If it's a NextResponse, it means there was an error
  if (errorOrVerifiedClaims instanceof NextResponse) {
    return errorOrVerifiedClaims;
  }

  try {
    const body = await request.json();
    const { action, walletAddress, walletId } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing walletAddress' },
        { status: 400 }
      );
    }

    if (action === 'checkBalance') {
      // Check KYC token balance
      const balanceResult = await publicClient.readContract({
        address: KYC_CONTRACT_ADDRESS,
        abi: KYC_CONTRACT_ABI,
        functionName: 'balanceOf',
        args: [walletAddress as `0x${string}`],
      });

      const balance = Number(balanceResult);

      return NextResponse.json({
        success: true,
        balance,
        hasToken: balance > 0,
      });
    } else if (action === 'mintFree') {
      if (!walletId) {
        return NextResponse.json(
          { success: false, error: 'Missing walletId for minting' },
          { status: 400 }
        );
      }

      // Execute the mintFree transaction
      const mintResult = await client.walletApi.ethereum.sendTransaction({
        walletId: walletId,
        caip2: 'eip155:97', // BSC Testnet chain ID
        transaction: {
          to: KYC_CONTRACT_ADDRESS,
          data: '0x8ab53447', // mintFree function selector
          value: '0x0',
        },
      });

      return NextResponse.json({
        success: true,
        txHash: (mintResult as any).transactionHash || (mintResult as any).hash,
        message: 'KYC token minted successfully!',
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('KYC token operation error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to execute KYC token operation',
      },
      { status: 500 }
    );
  }
}
