import { AuthTokenClaims, PrivyClient } from '@privy-io/server-auth';
import { type ClassValue, clsx } from 'clsx';
import type { NextApiRequest, NextApiResponse } from 'next';
import { NextRequest, NextResponse } from 'next/server';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
    return res.status(401).json({ error: 'Missing auth token.' });
  }
  const authToken = header.replace(/^Bearer /, '');

  try {
    return client.verifyAuthToken(authToken);
  } catch {
    return res.status(401).json({ error: 'Invalid auth token.' });
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
  const header = req.headers.get('authorization');
  if (!header) {
    return NextResponse.json({ error: 'Missing auth token.' }, { status: 401 });
  }
  const authToken = header.replace(/^Bearer /, '');

  try {
    return await client.verifyAuthToken(authToken);
  } catch {
    return NextResponse.json({ error: 'Invalid auth token.' }, { status: 401 });
  }
};

export const createPrivyClient = () => {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID as string;
  const appSecret = process.env.PRIVY_APP_SECRET as string;
  const sessionSignerSecret = process.env.SESSION_SIGNER_SECRET;

  // Only add wallet API config if we have a valid session signer secret
  // and we're not in build mode (when NODE_ENV is set to production during build)
  const walletApiConfig =
    sessionSignerSecret &&
    sessionSignerSecret.startsWith('0x') &&
    sessionSignerSecret.length === 66
      ? {
          walletApi: {
            authorizationPrivateKey: sessionSignerSecret,
          },
        }
      : {};

  return new PrivyClient(appId, appSecret, walletApiConfig);
};
