import {
  createPrivyClient,
  fetchAndVerifyAuthorizationAppRouter,
} from '@/lib/server-utils';
import { NextRequest, NextResponse } from 'next/server';

const client = createPrivyClient();

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
    console.log('Request body:', body);

    const { wallet_id, transactions, amount } = body;

    if (!wallet_id || !transactions || !Array.isArray(transactions)) {
      console.error('Validation failed:', {
        wallet_id,
        transactions: !!transactions,
        isArray: Array.isArray(transactions),
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Executing approve transaction...');
    // Execute the approve transaction first
    const approveResult = await client.walletApi.ethereum.sendTransaction({
      walletId: wallet_id,
      caip2: 'eip155:11155111', // Ethereum Sepolia testnet
      transaction: {
        to: transactions[0].to,
        data: transactions[0].data,
        value: transactions[0].value || '0x0',
      },
    });
    console.log('Approve result:', approveResult);

    console.log('Executing supply transaction...');
    // Execute the supply transaction second
    const supplyResult = await client.walletApi.ethereum.sendTransaction({
      walletId: wallet_id,
      caip2: 'eip155:11155111', // Ethereum Sepolia testnet
      transaction: {
        to: transactions[1].to,
        data: transactions[1].data,
        value: transactions[1].value || '0x0',
      },
    });
    console.log('Supply result:', supplyResult);

    return NextResponse.json({
      success: true,
      txHash:
        (supplyResult as any).transactionHash || (supplyResult as any).hash,
      approveHash:
        (approveResult as any).transactionHash || (approveResult as any).hash,
      message: `Successfully deposited ${amount} PyUSD to AAVE on Sepolia`,
    });
  } catch (error: any) {
    console.error('AAVE deposit error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to execute AAVE deposit transaction',
      },
      { status: 500 }
    );
  }
}
