'use client';

import { useRouter } from 'next/navigation';

import { Button } from './ui/button';

interface HeaderButtonProps {
  isAuthenticated: boolean;
}

export function HeaderButton({ isAuthenticated }: HeaderButtonProps) {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return isAuthenticated ? (
    <Button
      onClick={() => handleNavigation('/dashboard')}
      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-normal"
    >
      Open App
    </Button>
  ) : (
    <Button
      onClick={() => handleNavigation('/login')}
      variant="outline"
      className="border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-2 rounded-xl font-normal"
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

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <Button
      onClick={() => handleNavigation(isAuthenticated ? '/dashboard' : '/login')}
      size="lg"
      className="bg-blue-600 hover:bg-blue-700 text-white px-8 sm:px-12 py-4 sm:py-6 rounded-xl text-base sm:text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto"
    >
      Get Started
    </Button>
  );
}

interface FinalCTAButtonProps {
  isAuthenticated: boolean;
}

export function FinalCTAButton({ isAuthenticated }: FinalCTAButtonProps) {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <Button
      onClick={() => handleNavigation(isAuthenticated ? '/dashboard' : '/login')}
      size="lg"
      className="bg-white text-blue-600 hover:bg-gray-50 px-8 sm:px-12 py-4 sm:py-6 rounded-2xl text-base sm:text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto"
    >
      Get Started - It&apos;s Free
    </Button>
  );
}
