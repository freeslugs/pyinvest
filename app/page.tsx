import { PrivyClient } from '@privy-io/server-auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import Portal from '../components/graphics/portal';

import LoginClient from './login-client';

async function checkAuth() {
  const cookieStore = await cookies();
  const cookieAuthToken = cookieStore.get('privy-token')?.value;

  // If no cookie is found, skip any further checks
  if (!cookieAuthToken) return false;

  const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;
  const client = new PrivyClient(PRIVY_APP_ID!, PRIVY_APP_SECRET!);

  try {
    const claims = await client.verifyAuthToken(cookieAuthToken);
    console.log({ claims });
    return true;
  } catch (error) {
    return false;
  }
}

export const metadata = {
  title: 'Login · Pyinvest',
};

export default async function LoginPage() {
  const isAuthenticated = await checkAuth();

  if (isAuthenticated) {
    redirect('/dashboard');
  }

  return (
    <main className='flex min-h-screen min-w-full'>
      <div className='flex flex-1 items-center justify-center bg-privy-light-blue p-6'>
        <div>
          <div>
            <Portal style={{ maxWidth: '100%', height: 'auto' }} />
          </div>
          <div className='mt-6 flex justify-center text-center'>
            <LoginClient />
          </div>
        </div>
      </div>
    </main>
  );
}
