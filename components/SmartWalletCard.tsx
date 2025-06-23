'use client';

import { Copy, QrCode } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import { Modal } from './ui/modal';
import { QRCodeComponent } from './ui/qr-code';

interface SmartWalletCardProps {
  address: string;
  balance: string;
}

export function SmartWalletCard({ address, balance }: SmartWalletCardProps) {
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  return (
    <>
      <div className='rounded-xl border border-gray-200 bg-white text-gray-950 shadow-sm'>
        <div className='p-6'>
          <p className='mb-2 text-base text-gray-500'>Smart Wallet Balance</p>
          <div className='mb-1 flex items-center space-x-2'>
            <span className='font-adelle text-4xl font-light text-gray-300'>
              $
            </span>
            <p className='font-adelle text-4xl font-medium text-gray-800'>
              {balance}
            </p>
            <Image
              src='/assets/pyusd_logo.png'
              alt='pyUSD logo'
              width={24}
              height={24}
              className='ml-1 h-6 w-6'
              unoptimized
            />
          </div>

          <div className='mt-4 border-t border-gray-100 pt-4'>
            <div className='mb-3 flex items-center justify-between'>
              <p className='text-sm text-gray-500'>Smart Wallet Address</p>
              <button
                onClick={() => setIsQrModalOpen(true)}
                className='flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800'
              >
                <QrCode className='h-4 w-4' />
                <span>Show QR</span>
              </button>
            </div>

            <div className='flex items-center justify-between rounded-lg bg-gray-50 p-3'>
              <code className='mr-2 flex-1 font-mono text-sm text-gray-700'>
                {formatAddress(address)}
              </code>
              <button
                onClick={() => copyToClipboard(address)}
                className='p-1 text-gray-400 transition-colors hover:text-gray-600'
                title='Copy full address'
              >
                <Copy className='h-4 w-4' />
              </button>
            </div>

            <p className='mt-2 text-xs text-gray-400'>
              This is your smart wallet address for receiving PYUSD
            </p>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title='Smart Wallet QR Code'
      >
        <div className='space-y-4 text-center'>
          <div className='flex justify-center'>
            <div className='rounded-xl border border-gray-200 bg-white p-4'>
              <QRCodeComponent
                value={address}
                size={192}
                className='rounded-lg'
              />
            </div>
          </div>

          <div className='rounded-xl bg-gray-50 p-4'>
            <p className='mb-2 text-sm font-medium text-gray-700'>
              Smart Wallet Address:
            </p>
            <div className='flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3'>
              <code className='mr-2 flex-1 break-all font-mono text-sm text-gray-800'>
                {address}
              </code>
              <button
                onClick={() => copyToClipboard(address)}
                className='flex-shrink-0 p-1 text-gray-400 hover:text-gray-600'
              >
                <Copy className='h-4 w-4' />
              </button>
            </div>
          </div>

          <div className='rounded-xl bg-blue-50 p-4'>
            <p className='text-sm text-blue-800'>
              <strong>Send PYUSD to this address</strong> from Venmo, PayPal,
              Coinbase, or any other wallet to start earning yield.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}
