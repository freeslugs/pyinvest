import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { WalletApiRpcResponseType } from "@privy-io/public-api";
import type { AuthTokenClaims } from "@privy-io/server-auth";
import {
  APIError,
  createPrivyClient,
} from "../../../../lib/utils";

const client = createPrivyClient();

export async function POST(request: NextRequest) {
  // Handle authorization manually for App Router
  const header = request.headers.get("authorization");
  if (!header) {
    return NextResponse.json({ error: "Missing auth token." }, { status: 401 });
  }
  const authToken = header.replace(/^Bearer /, "");

  let verifiedClaims: AuthTokenClaims;
  try {
    verifiedClaims = await client.verifyAuthToken(authToken);
  } catch (error) {
    return NextResponse.json({ error: "Invalid auth token." }, { status: 401 });
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

    return NextResponse.json({
      method: "signMessage",
      data: {
        signature: Buffer.from(signature).toString("base64"),
        encoding: "base64",
      },
    });
  } catch (error) {
    console.error("Error signing message:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCause = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: errorMessage,
        cause: errorCause,
      },
      { status: 500 }
    );
  }
} 