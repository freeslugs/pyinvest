'use client';

import { Button } from './ui/button';

interface HeaderButtonProps {
  isAuthenticated: boolean;
}

export function HeaderButton({ isAuthenticated }: HeaderButtonProps) {
  const handleNavigation = (path: string) => {
    window.location.href = path;
  };

  return isAuthenticated ? (
    <Button
      onClick={() => handleNavigation('/dashboard')}
      className='rounded-xl bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700'
    >
      Open App
    </Button>
  ) : (
    <Button
      onClick={() => handleNavigation('/login')}
      variant='outline'
      className='rounded-xl border-blue-600 px-6 py-2 font-medium text-blue-600 hover:bg-blue-50'
    >
      Open App
    </Button>
  );
}

interface HeroCTAButtonProps {
  isAuthenticated: boolean;
}

export function HeroCTAButton({ isAuthenticated }: HeroCTAButtonProps) {
  const handleNavigation = (path: string) => {
    window.location.href = path;
  };

  return (
    <Button
      onClick={() =>
        handleNavigation(isAuthenticated ? '/dashboard' : '/login')
      }
      size='lg'
      className='rounded-2xl bg-blue-600 px-12 py-6 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:bg-blue-700 hover:shadow-xl'
    >
      Get Started
    </Button>
  );
}

interface FinalCTAButtonProps {
  isAuthenticated: boolean;
}

export function FinalCTAButton({ isAuthenticated }: FinalCTAButtonProps) {
  const handleNavigation = (path: string) => {
    window.location.href = path;
  };

  return (
    <Button
      onClick={() =>
        handleNavigation(isAuthenticated ? '/dashboard' : '/login')
      }
      size='lg'
      className='rounded-2xl bg-white px-12 py-6 text-lg font-semibold text-blue-600 shadow-lg transition-all duration-200 hover:bg-gray-50 hover:shadow-xl'
    >
      Get Started - It's Free
    </Button>
  );
}
