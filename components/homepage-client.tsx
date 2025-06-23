'use client';

import { useLogin } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';

import { Button } from './ui/button';

interface HeaderButtonProps {
  isAuthenticated: boolean;
}

export function HeaderButton({ isAuthenticated }: HeaderButtonProps) {
  const router = useRouter();
  const { login } = useLogin({
    onComplete: () => router.push('/dashboard'),
  });

  const handleClick = () => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      login();
    }
  };

  return isAuthenticated ? (
    <Button
      onClick={handleClick}
      className='rounded-xl bg-blue-600 px-6 py-2 font-normal text-white hover:bg-blue-700'
    >
      Open App
    </Button>
  ) : (
    <Button
      onClick={handleClick}
      variant='outline'
      className='rounded-xl border-blue-600 px-6 py-2 font-normal text-blue-600 hover:bg-blue-50'
    >
      Open App
    </Button>
  );
}

interface HeroCTAButtonProps {
  isAuthenticated: boolean;
}

export function HeroCTAButton({ isAuthenticated }: HeroCTAButtonProps) {
  const router = useRouter();
  const { login } = useLogin({
    onComplete: () => router.push('/dashboard'),
  });

  const handleClick = () => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      login();
    }
  };

  return (
    <Button
      onClick={handleClick}
      size='lg'
      className='w-full rounded-xl bg-blue-600 px-8 py-4 text-base font-medium text-white shadow-lg transition-all duration-200 hover:bg-blue-700 hover:shadow-xl sm:w-auto sm:px-12 sm:py-6 sm:text-lg'
    >
      Start Earning
    </Button>
  );
}

interface FinalCTAButtonProps {
  isAuthenticated: boolean;
}

export function FinalCTAButton({ isAuthenticated }: FinalCTAButtonProps) {
  const router = useRouter();
  const { login } = useLogin({
    onComplete: () => router.push('/dashboard'),
  });

  const handleClick = () => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      login();
    }
  };

  return (
    <Button
      onClick={handleClick}
      size='lg'
      className='w-full rounded-2xl bg-white px-8 py-4 text-base font-medium text-blue-600 shadow-lg transition-all duration-200 hover:bg-gray-50 hover:shadow-xl sm:w-auto sm:px-12 sm:py-6 sm:text-lg'
    >
      Get Started - It&apos;s Free
    </Button>
  );
}
