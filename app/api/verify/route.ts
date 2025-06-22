import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { PrivyClient, type AuthTokenClaims } from "@privy-io/server-auth";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;

export type AuthenticateSuccessResponse = {
  claims: AuthTokenClaims;
};

export type AuthenticationErrorResponse = {
  error: string;
};

export async function GET(request: NextRequest) {
  const headerAuthToken = request.headers.get("authorization")?.replace(/^Bearer /, "");
  const cookieAuthToken = request.cookies.get("privy-token")?.value;

  const authToken = cookieAuthToken || headerAuthToken;
  if (!authToken) {
    return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
  }

  if (!PRIVY_APP_ID || !PRIVY_APP_SECRET) {
    return NextResponse.json({ error: "Missing Privy configuration" }, { status: 500 });
  }

  const client = new PrivyClient(PRIVY_APP_ID, PRIVY_APP_SECRET);

  try {
    const claims = await client.verifyAuthToken(authToken);
    return NextResponse.json({ claims });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 401 });
  }
} 