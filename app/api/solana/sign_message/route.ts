import {
    createPrivyClient,
    fetchAndVerifyAuthorizationAppRouter,
} from '@/lib/server-utils';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const client = createPrivyClient();

    const errorOrVerifiedClaims = await fetchAndVerifyAuthorizationAppRouter(
      request,
      client
    );

    // If it's a NextResponse, it means there was an error
    if (errorOrVerifiedClaims instanceof NextResponse) {
      return errorOrVerifiedClaims;
    }

    const body = await request.json();
    const message = body.message;
    const walletId = body.wallet_id;

    if (!message || !walletId) {
      return NextResponse.json(
        { error: 'Message and wallet_id are required' },
        { status: 400 }
      );
    }

    // Check if wallet API is available
    if (!client.walletApi) {
      return NextResponse.json(
        { error: 'Wallet API not configured' },
        { status: 503 }
      );
    }

    const { signature } = await client.walletApi.solana.signMessage({
      walletId,
      message,
    });
    return NextResponse.json(
      {
        method: 'sign_message',
        data: {
          signature: signature,
          encoding: 'hex',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    const statusCode = 500;

    return NextResponse.json(
      {
        error: (error as Error).message,
        cause: (error as Error).stack,
      },
      { status: statusCode }
    );
  }
}
