import { NextRequest, NextResponse } from "next/server";
import {
  createPrivyClient,
  fetchAndVerifyAuthorizationAppRouter,
} from "../../../../lib/utils";

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

  const body = await request.json();
  const message = body.message;
  const walletId = body.wallet_id;

  if (!message || !walletId) {
    return NextResponse.json(
      { error: "Message and wallet_id are required" },
      { status: 400 }
    );
  }

  try {
    // Sign the message using Privy's wallet API
    const { signature } = await client.walletApi.solana.signMessage({
      walletId,
      message,
    });

    return NextResponse.json(
      {
        method: "signMessage",
        data: {
          signature: Buffer.from(signature).toString("base64"),
          encoding: "base64",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error signing message:", error);
    return NextResponse.json(
      {
        error: (error as Error).message,
        cause: (error as Error).stack,
      },
      { status: 500 }
    );
  }
}