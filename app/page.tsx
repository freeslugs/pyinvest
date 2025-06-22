import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PrivyClient } from "@privy-io/server-auth";
import LoginClient from "./login-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login · Privy",
};

async function checkAuth() {
  const cookiesStore = await cookies();
  const cookieAuthToken = cookiesStore.get("privy-token")?.value;

  // If no cookie is found, return false
  if (!cookieAuthToken) return false;

  const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;
  
  if (!PRIVY_APP_ID || !PRIVY_APP_SECRET) {
    console.error("Missing Privy environment variables");
    return false;
  }
  
  const client = new PrivyClient(PRIVY_APP_ID, PRIVY_APP_SECRET);

  try {
    const claims = await client.verifyAuthToken(cookieAuthToken);
    console.log({ claims });
    return true;
  } catch (error) {
    return false;
  }
}

export default async function HomePage() {
  const isAuthenticated = await checkAuth();
  
  if (isAuthenticated) {
    redirect("/dashboard");
  }

  return <LoginClient />;
} 