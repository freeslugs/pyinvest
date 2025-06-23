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
}

export function OnboardingFlow({ isOpen, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const { user, linkWallet } = usePrivy();

  // Get smart wallet address
  const smartWallet = user?.linkedAccounts?.find(
    account => account.type === 'smart_wallet'
  ) as { address: string } | undefined;

    // Helper function to transition between steps with animation
  const transitionToStep = (newStep: OnboardingStep, direction: 'left' | 'right' = 'right') => {
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
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex justify-center mb-4">
          <Image
            src="/assets/PyInvest-logomark.png"
            alt="PyInvest"
            width={48}
            height={48}
            className="h-12 w-12"
            unoptimized
          />
        </div>
        <h2 className="text-2xl font-normal text-gray-900 mb-2 text-left">
          Welcome to PyInvest!
        </h2>
        <p className="text-gray-600 text-left">
          Let&apos;s get you started with earning yield on your PYUSD
        </p>
      </div>

      <button
        onClick={() => transitionToStep('pyusd-source', 'right')}
        className="w-full flex items-center justify-center space-x-2 rounded-xl bg-blue-600 px-6 py-4 text-white hover:bg-blue-700 transition-colors"
      >
        <span>Get Started</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );

  const renderPyusdSourceStep = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-normal text-gray-900 mb-2 text-left">
          Do you already have PYUSD?
        </h2>
        <p className="text-sm text-gray-600 text-left">
          Tell us where you keep your PYUSD so we can help you get started
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => handlePyusdSource('traditional')}
          className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
                                    <div className="relative flex items-center">
              {/* Stacked/overlapped logos */}
              <Image
                src="/assets/Venmo-icon.png"
                alt="Venmo"
                width={20}
                height={20}
                className="relative z-30 rounded-full shadow-sm"
              />
              <Image
                src="/assets/pyusd_logo.png"
                alt="PayPal"
                width={20}
                height={20}
                className="relative z-20 -ml-2 rounded-full shadow-sm"
              />
              <Image
                src="/assets/coinbase-icon.png"
                alt="Coinbase"
                width={20}
                height={20}
                className="relative z-10 -ml-2 rounded-full shadow-sm"
              />
            </div>
            <div className="text-left">
              <p className="font-normal text-gray-900">Venmo, PayPal, or Coinbase</p>
              <p className="text-sm text-gray-500">Transfer to your smart wallet</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
        </button>

        <button
          onClick={() => handlePyusdSource('crypto')}
          className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Wallet className="h-5 w-5 text-gray-600" />
            <div className="text-left">
              <p className="font-normal text-gray-900">Crypto Wallet</p>
              <p className="text-sm text-gray-500">Connect your MetaMask or other wallet</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      <div className="text-center pt-4">
                  <button
            onClick={handleCompleteOnboarding}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            I don&apos;t have PYUSD yet
          </button>
      </div>
    </div>
  );

  const renderTraditionalDepositStep = () => (
    <div className="space-y-4">
      <div className="mb-4">
        <h2 className="text-xl font-normal text-gray-900 mb-2 text-left">
          Transfer PYUSD to Your Smart Wallet
        </h2>
        <p className="text-sm text-gray-600 text-left">
          Send your PYUSD to this address to start earning yield
        </p>
      </div>

      {smartWallet && (
        <div className="space-y-4">
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="p-3 bg-white border border-gray-200 rounded-xl">
              <QRCodeComponent
                value={smartWallet.address}
                size={160}
                className="rounded-lg"
              />
            </div>
          </div>

          {/* Wallet Address */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-normal text-gray-700 mb-2">Smart Wallet Address:</p>
            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
              <code className="text-sm font-mono text-gray-800 flex-1 mr-2 break-all">
                {smartWallet.address}
              </code>
              <button
                onClick={() => copyToClipboard(smartWallet.address)}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

                    {/* Instructions */}
          <div className="bg-blue-50 rounded-xl p-3">
            <h3 className="font-normal text-blue-900 mb-2 text-sm">How to send PYUSD:</h3>
            <div className="space-y-1 text-xs text-blue-800">
              <div className="flex items-start space-x-2">
                <span className="font-medium">1.</span>
                <p>Open your Venmo, PayPal, or Coinbase app</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-medium">2.</span>
                <p>Go to your PYUSD balance or crypto section</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-medium">3.</span>
                <p>Choose &quot;Send&quot; or &quot;Transfer&quot; and scan the QR code above</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-medium">4.</span>
                <p>Or copy and paste the wallet address</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleContinueToDeposit}
            className="w-full rounded-xl bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 transition-colors"
          >
            I&apos;ve sent the PYUSD
          </button>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={() => transitionToStep('pyusd-source', 'left')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to options
        </button>
      </div>
    </div>
  );

  const renderCryptoWalletStep = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-normal text-gray-900 mb-2 text-left">
          Connect Your Crypto Wallet
        </h2>
        <p className="text-sm text-gray-600 text-left">
          Link your MetaMask or other wallet that contains PYUSD
        </p>
      </div>

      <div className="bg-amber-50 rounded-xl p-4">
        <p className="text-sm text-amber-800">
          <strong>Note:</strong> Make sure your wallet contains PYUSD on the Ethereum network before connecting.
        </p>
      </div>

      <button
        onClick={handleConnectWallet}
        disabled={isLoading}
        className="w-full flex items-center justify-center space-x-2 rounded-xl bg-blue-600 px-6 py-4 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Wallet className="h-4 w-4" />
        <span>{isLoading ? 'Connecting...' : 'Connect Wallet'}</span>
      </button>

      <div className="text-center">
        <button
          onClick={() => transitionToStep('pyusd-source', 'left')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to options
        </button>
      </div>
    </div>
  );

  const renderWaitingDepositStep = () => (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <div>
        <h2 className="text-xl font-normal text-gray-900 mb-2 text-left">
          Waiting for your PYUSD deposit
        </h2>
        <p className="text-sm text-gray-600 text-left">
          We&apos;re watching for your PYUSD to arrive. This usually takes a few minutes.
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-sm text-gray-700">
          Once we detect your PYUSD, you&apos;ll be able to start earning yield immediately!
        </p>
      </div>

      <button
        onClick={handleCompleteOnboarding}
        className="w-full rounded-xl bg-green-600 px-6 py-3 text-white hover:bg-green-700 transition-colors"
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
    <Modal
      isOpen={isOpen}
      onClose={onComplete}
      title=""
    >
            <div className="relative overflow-hidden">
        <div
          className={`transition-all duration-300 ease-in-out ${
            isTransitioning
              ? slideDirection === 'right'
                ? 'translate-x-full opacity-0'   // Forward: slide out to right, new content comes from right
                : '-translate-x-full opacity-0'  // Backward: slide out to left, new content comes from left
              : 'translate-x-0 opacity-100'
          }`}
        >
          {renderCurrentStep()}
        </div>
      </div>
    </Modal>
  );
}
