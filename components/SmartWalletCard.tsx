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
      <div className="rounded-xl border border-gray-200 bg-white text-gray-950 shadow-sm">
        <div className="p-6">
          <p className="mb-2 text-base text-gray-500">Smart Wallet Balance</p>
          <div className="mb-1 flex items-center space-x-2">
            <span className="font-adelle text-4xl font-light text-gray-300">$</span>
            <p className="font-adelle text-4xl font-medium text-gray-800">{balance}</p>
            <Image
              src="/assets/pyusd_logo.png"
              alt="pyUSD logo"
              width={24}
              height={24}
              className="ml-1 h-6 w-6"
              unoptimized
            />
          </div>

          <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">Smart Wallet Address</p>
              <button
                onClick={() => setIsQrModalOpen(true)}
                className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <QrCode className="h-4 w-4" />
                <span>Show QR</span>
              </button>
            </div>

            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <code className="text-sm font-mono text-gray-700 flex-1 mr-2">
                {formatAddress(address)}
              </code>
              <button
                onClick={() => copyToClipboard(address)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Copy full address"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-gray-400 mt-2">
              This is your smart wallet address for receiving PYUSD
            </p>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title="Smart Wallet QR Code"
      >
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-white border border-gray-200 rounded-xl">
              <QRCodeComponent
                value={address}
                size={192}
                className="rounded-lg"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Smart Wallet Address:</p>
            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
              <code className="text-sm font-mono text-gray-800 break-all flex-1 mr-2">
                {address}
              </code>
              <button
                onClick={() => copyToClipboard(address)}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <strong>Send PYUSD to this address</strong> from Venmo, PayPal, Coinbase, or any other wallet to start earning yield.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}
