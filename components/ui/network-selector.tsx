'use client';

import { usePrivy } from '@privy-io/react-auth';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { bscTestnet, flowTestnet, sepolia } from 'viem/chains';

const SUPPORTED_NETWORKS = [
  {
    id: sepolia.id,
    name: sepolia.name,
    shortName: 'Sepolia',
    color: 'bg-purple-500',
  },
  {
    id: flowTestnet.id,
    name: flowTestnet.name,
    shortName: 'Flow',
    color: 'bg-green-500',
  },
  {
    id: bscTestnet.id,
    name: bscTestnet.name,
    shortName: 'BSC',
    color: 'bg-yellow-500',
  },
];

export function NetworkSelector() {
  const { user } = usePrivy();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState(SUPPORTED_NETWORKS[0]);

  const handleNetworkSelect = (network: typeof SUPPORTED_NETWORKS[0]) => {
    setSelectedNetwork(network);
    setIsOpen(false);
    // TODO: Implement network switching logic
    console.log('Switching to network:', network.name);
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div className={`h-2 w-2 rounded-full ${selectedNetwork.color}`} />
        <span>{selectedNetwork.shortName}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="py-1">
            {SUPPORTED_NETWORKS.map((network) => (
              <button
                key={network.id}
                onClick={() => handleNetworkSelect(network)}
                className={`flex w-full items-center space-x-3 px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                  selectedNetwork.id === network.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
              >
                <div className={`h-2 w-2 rounded-full ${network.color}`} />
                <span>{network.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}