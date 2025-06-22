'use client';

import { useLogin } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';

export default function LoginClient() {
  const router = useRouter();
  const { login } = useLogin({
    onComplete: () => router.push('/dashboard'),
  });

  return (
    <button
      className='rounded-lg bg-violet-600 px-6 py-3 text-white hover:bg-violet-700'
      onClick={login}
    >
      Log in
    </button>
  );
}
