import { AuthTokenClaims, PrivyClient } from "@privy-io/server-auth";
import type { NextApiRequest, NextApiResponse } from "next";
import { NextRequest, NextResponse } from "next/server";

export type APIError = {
  error: string;
  cause?: string;
};

/**
 * Authorizes a user to call an endpoint (Pages Router version)
 * @param req - The API request
 * @param res - The API response
 * @param client - A PrivyClient
 */
export const fetchAndVerifyAuthorization = async (
  req: NextApiRequest,
  res: NextApiResponse,
  client: PrivyClient
): Promise<AuthTokenClaims | void> => {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ error: "Missing auth token." });
  }
  const authToken = header.replace(/^Bearer /, "");

  try {
    return client.verifyAuthToken(authToken);
  } catch {
    return res.status(401).json({ error: "Invalid auth token." });
  }
};

/**
 * Authorizes a user to call an endpoint (App Router version)
 * @param req - The API request
 * @param client - A PrivyClient
 */
export const fetchAndVerifyAuthorizationAppRouter = async (
  req: NextRequest,
  client: PrivyClient
): Promise<AuthTokenClaims | NextResponse> => {
  const header = req.headers.get("authorization");
  if (!header) {
    return NextResponse.json({ error: "Missing auth token." }, { status: 401 });
  }
  const authToken = header.replace(/^Bearer /, "");

  try {
    return await client.verifyAuthToken(authToken);
  } catch {
    return NextResponse.json({ error: "Invalid auth token." }, { status: 401 });
  }
};

export const createPrivyClient = () => {
  return new PrivyClient(
    process.env.NEXT_PUBLIC_PRIVY_APP_ID as string,
    process.env.PRIVY_APP_SECRET as string,
    {
      walletApi: {
        authorizationPrivateKey: process.env.SESSION_SIGNER_SECRET,
      },
    }
  );
};
