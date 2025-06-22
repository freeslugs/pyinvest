import { NextRequest, NextResponse } from 'next/server';
import {
  fetchAndVerifyAuthorizationAppRouter,
  createPrivyClient,
} from '../../../lib/utils';

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
    const { wallet_id, transactions, amount } = body;

    if (!wallet_id || !transactions || !Array.isArray(transactions)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

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

    return NextResponse.json({
      success: true,
      txHash: (supplyResult as any).transactionHash || (supplyResult as any).hash,
      approveHash: (approveResult as any).transactionHash || (approveResult as any).hash,
      message: `Successfully deposited ${amount} PyUSD to AAVE on Sepolia`,
    });

  } catch (error: any) {
    console.error('AAVE deposit error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to execute AAVE deposit transaction',
    }, { status: 500 });
  }
}