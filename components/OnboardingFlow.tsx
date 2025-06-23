'use client';

import { usePrivy } from '@privy-io/react-auth';
import { ArrowRight, Copy, Wallet } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import { Modal } from './ui/modal';
import { QRCodeComponent } from './ui/qr-code';

type OnboardingStep =
  | 'welcome'
  | 'pyusd-source'
  | 'traditional-deposit'
  | 'crypto-wallet'
  | 'waiting-deposit'
  | 'completed';

interface OnboardingFlowProps {
  isOpen: boolean;
  onComplete: () => void;
  skipWelcome?: boolean;
}

export function OnboardingFlow({
  isOpen,
  onComplete,
  skipWelcome = false,
}: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(
    skipWelcome ? 'pyusd-source' : 'welcome'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>(
    'right'
  );
  const { user, linkWallet } = usePrivy();

  // Get smart wallet address
  const smartWallet = user?.linkedAccounts?.find(
    account => account.type === 'smart_wallet'
  ) as { address: string } | undefined;

  // Helper function to transition between steps with animation
  const transitionToStep = (
    newStep: OnboardingStep,
    direction: 'left' | 'right' = 'right'
  ) => {
    setIsTransitioning(true);
    setSlideDirection(direction);

    setTimeout(() => {
      setCurrentStep(newStep);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 10); // Small delay to ensure new content is rendered before animating in
    }, 150); // Half of the transition duration
  };

  const handlePyusdSource = (source: 'traditional' | 'crypto') => {
    if (source === 'traditional') {
      transitionToStep('traditional-deposit', 'right');
    } else {
      transitionToStep('crypto-wallet', 'right');
    }
  };

  const handleConnectWallet = async () => {
    setIsLoading(true);
    try {
      await linkWallet();
      // After successful wallet connection, check if they have a balance
      transitionToStep('waiting-deposit', 'right');
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToDeposit = () => {
    transitionToStep('waiting-deposit', 'right');
  };

  const handleCompleteOnboarding = () => {
    // Mark onboarding as completed in localStorage
    localStorage.setItem('onboarding_completed', 'true');
    onComplete();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderWelcomeStep = () => (
    <div className='space-y-6'>
      <div className='mb-6'>
        <div className='mb-4 flex justify-center'>
          <Image
            src='/assets/PyInvest-logomark.png'
            alt='PyInvest'
            width={48}
            height={48}
            className='h-12 w-12'
            unoptimized
          />
        </div>
        <h2 className='mb-2 text-left text-2xl font-normal text-gray-900'>
          Welcome to PyInvest!
        </h2>
        <p className='text-left text-gray-600'>
          Let&apos;s get you started with earning yield on your PYUSD
        </p>
      </div>

      <button
        onClick={() => transitionToStep('pyusd-source', 'right')}
        className='flex w-full items-center justify-center space-x-2 rounded-xl bg-blue-600 px-6 py-4 text-white transition-colors hover:bg-blue-700'
      >
        <span>Get Started</span>
        <ArrowRight className='h-4 w-4' />
      </button>
    </div>
  );

  const renderPyusdSourceStep = () => (
    <div className='space-y-6'>
      <div className='mb-6'>
        <h2 className='mb-2 text-left text-xl font-normal text-gray-900'>
          Do you already have PYUSD?
        </h2>
        <p className='text-left text-sm text-gray-600'>
          Tell us where you keep your PYUSD so we can help you get started
        </p>
      </div>

      <div className='space-y-3'>
        <button
          onClick={() => handlePyusdSource('traditional')}
          className='flex w-full items-center justify-between rounded-xl border border-gray-200 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50'
        >
          <div className='flex items-center space-x-3'>
            <div className='relative flex items-center'>
              {/* Stacked/overlapped logos */}
              <Image
                src='/assets/Venmo-icon.png'
                alt='Venmo'
                width={20}
                height={20}
                className='relative z-30 rounded-full shadow-sm'
              />
              <Image
                src='/assets/pyusd_logo.png'
                alt='PayPal'
                width={20}
                height={20}
                className='relative z-20 -ml-2 rounded-full shadow-sm'
              />
              <Image
                src='/assets/coinbase-icon.png'
                alt='Coinbase'
                width={20}
                height={20}
                className='relative z-10 -ml-2 rounded-full shadow-sm'
              />
            </div>
            <div className='text-left'>
              <p className='font-normal text-gray-900'>
                Venmo, PayPal, or Coinbase
              </p>
              <p className='text-sm text-gray-500'>
                Transfer to your smart wallet
              </p>
            </div>
          </div>
          <ArrowRight className='h-4 w-4 text-gray-400' />
        </button>

        <button
          onClick={() => handlePyusdSource('crypto')}
          className='flex w-full items-center justify-between rounded-xl border border-gray-200 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50'
        >
          <div className='flex items-center space-x-3'>
            <Wallet className='h-5 w-5 text-gray-600' />
            <div className='text-left'>
              <p className='font-normal text-gray-900'>Crypto Wallet</p>
              <p className='text-sm text-gray-500'>
                Connect your MetaMask or other wallet
              </p>
            </div>
          </div>
          <ArrowRight className='h-4 w-4 text-gray-400' />
        </button>
      </div>

      <div className='pt-4 text-center'>
        <button
          onClick={handleCompleteOnboarding}
          className='text-sm text-gray-500 hover:text-gray-700'
        >
          I don&apos;t have PYUSD yet
        </button>
      </div>
    </div>
  );

  const renderTraditionalDepositStep = () => (
    <div className='space-y-3'>
      <div className='mb-3'>
        <h2 className='mb-1 text-left text-xl font-normal text-gray-900'>
          Transfer PYUSD to Your Smart Wallet
        </h2>
        <p className='text-left text-sm text-gray-600'>
          Send your PYUSD to this address to start earning yield
        </p>
      </div>

      {smartWallet && (
        <div className='space-y-3'>
          {/* QR Code and Address in same row on desktop */}
          <div className='flex flex-col space-y-3 sm:flex-row sm:items-start sm:space-x-4 sm:space-y-0'>
            {/* QR Code */}
            <div className='flex flex-shrink-0 justify-center sm:justify-start'>
              <div className='rounded-lg border border-gray-200 bg-white p-2'>
                <QRCodeComponent
                  value={smartWallet.address}
                  size={120}
                  className='rounded'
                />
              </div>
            </div>

            {/* Wallet Address */}
            <div className='min-w-0 flex-1'>
              <div className='rounded-lg bg-gray-50 p-3'>
                <p className='mb-2 text-xs font-normal text-gray-700'>
                  Smart Wallet Address:
                </p>
                <div className='flex items-center justify-between rounded border border-gray-200 bg-white p-2'>
                  <code className='mr-2 flex-1 break-all font-mono text-xs text-gray-800'>
                    {smartWallet.address}
                  </code>
                  <button
                    onClick={() => copyToClipboard(smartWallet.address)}
                    className='flex-shrink-0 p-1 text-gray-400 hover:text-gray-600'
                  >
                    <Copy className='h-3 w-3' />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className='rounded-lg bg-blue-50 p-3'>
            <h3 className='mb-2 text-xs font-normal text-blue-900'>
              How to send PYUSD:
            </h3>
            <div className='space-y-1 text-xs text-blue-800'>
              <div className='flex items-start space-x-2'>
                <span className='font-medium'>1.</span>
                <p>Open your Venmo, PayPal, or Coinbase app</p>
              </div>
              <div className='flex items-start space-x-2'>
                <span className='font-medium'>2.</span>
                <p>Go to your PYUSD balance or crypto section</p>
              </div>
              <div className='flex items-start space-x-2'>
                <span className='font-medium'>3.</span>
                <p>
                  Choose &quot;Send&quot; or &quot;Transfer&quot; and scan the
                  QR code
                </p>
              </div>
              <div className='flex items-start space-x-2'>
                <span className='font-medium'>4.</span>
                <p>Or copy and paste the wallet address</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleContinueToDeposit}
            className='w-full rounded-lg bg-blue-600 px-6 py-2.5 text-sm text-white transition-colors hover:bg-blue-700'
          >
            I&apos;ve sent the PYUSD
          </button>
        </div>
      )}

      <div className='pt-2 text-center'>
        <button
          onClick={() => transitionToStep('pyusd-source', 'left')}
          className='text-xs text-gray-500 hover:text-gray-700'
        >
          ← Back to options
        </button>
      </div>
    </div>
  );

  const renderCryptoWalletStep = () => (
    <div className='space-y-6'>
      <div className='mb-6'>
        <h2 className='mb-2 text-left text-xl font-normal text-gray-900'>
          Connect Your Crypto Wallet
        </h2>
        <p className='text-left text-sm text-gray-600'>
          Link your MetaMask or other wallet that contains PYUSD
        </p>
      </div>

      <div className='rounded-xl bg-amber-50 p-4'>
        <p className='text-sm text-amber-800'>
          <strong>Note:</strong> Make sure your wallet contains PYUSD on the
          Ethereum network before connecting.
        </p>
      </div>

      <button
        onClick={handleConnectWallet}
        disabled={isLoading}
        className='flex w-full items-center justify-center space-x-2 rounded-xl bg-blue-600 px-6 py-4 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
      >
        <Wallet className='h-4 w-4' />
        <span>{isLoading ? 'Connecting...' : 'Connect Wallet'}</span>
      </button>

      <div className='text-center'>
        <button
          onClick={() => transitionToStep('pyusd-source', 'left')}
          className='text-sm text-gray-500 hover:text-gray-700'
        >
          ← Back to options
        </button>
      </div>
    </div>
  );

  const renderWaitingDepositStep = () => (
    <div className='space-y-6'>
      <div className='flex justify-center'>
        <div className='h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
      </div>

      <div>
        <h2 className='mb-2 text-left text-xl font-normal text-gray-900'>
          Waiting for your PYUSD deposit
        </h2>
        <p className='text-left text-sm text-gray-600'>
          We&apos;re watching for your PYUSD to arrive. This usually takes a few
          minutes.
        </p>
      </div>

      <div className='rounded-xl bg-gray-50 p-4'>
        <p className='text-sm text-gray-700'>
          Once we detect your PYUSD, you&apos;ll be able to start earning yield
          immediately!
        </p>
      </div>

      <button
        onClick={handleCompleteOnboarding}
        className='w-full rounded-xl bg-green-600 px-6 py-3 text-white transition-colors hover:bg-green-700'
      >
        Continue to Dashboard
      </button>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcomeStep();
      case 'pyusd-source':
        return renderPyusdSourceStep();
      case 'traditional-deposit':
        return renderTraditionalDepositStep();
      case 'crypto-wallet':
        return renderCryptoWalletStep();
      case 'waiting-deposit':
        return renderWaitingDepositStep();
      default:
        return renderWelcomeStep();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onComplete} title=''>
      <div className='relative overflow-hidden'>
        <div
          className={`transition-all duration-300 ease-in-out ${
            isTransitioning
              ? slideDirection === 'right'
                ? 'translate-x-full opacity-0' // Forward: slide out to right, new content comes from right
                : '-translate-x-full opacity-0' // Backward: slide out to left, new content comes from left
              : 'translate-x-0 opacity-100'
          }`}
        >
          {renderCurrentStep()}
        </div>
      </div>
    </Modal>
  );
}
