'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Check,
  CheckCircle,
  Copy,
  ExternalLink,
  Mail,
  Phone,
  Plus,
  Shield,
  User,
  Wallet,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPublicClient, http, parseAbi } from 'viem';
import { bscTestnet } from 'viem/chains';

import { Modal } from '@/components/ui/modal';

export default function ProfilePage() {
  const router = useRouter();
  const { wallets } = useWallets();
  const {
    ready,
    authenticated,
    user,
    logout,
    linkEmail,
    linkWallet,
    unlinkEmail,
    linkPhone,
    unlinkPhone,
    unlinkWallet,
    linkGoogle,
    unlinkGoogle,
    linkTwitter,
    unlinkTwitter,
    linkDiscord,
    unlinkDiscord,
  } = usePrivy();

  // KYC Contract configuration
  const KYC_CONTRACT_ADDRESS = '0xcc8e8b424464991bbcda036c4781a60334c40628';
  const KYC_CONTRACT_ABI = parseAbi([
    'function balanceOf(address owner) view returns (uint256)',
    'function mintFree() external',
    'function decimals() view returns (uint8)',
  ]);

  // Create public client for reading contract data
  const publicClient = createPublicClient({
    chain: bscTestnet,
    transport: http('https://data-seed-prebsc-1-s1.binance.org:8545'),
  });

  // KYC state management
  const [kycStatus, setKycStatus] = useState<
    'loading' | 'no_token' | 'has_token'
  >('loading');
  const [kycTokenBalance, setKycTokenBalance] = useState(0);
  const [isClaimingToken, setIsClaimingToken] = useState(false);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);

  // BNB balance and deposit states
  const [bnbBalance, setBnbBalance] = useState<string>('0');
  const [isCheckingBnbBalance, setIsCheckingBnbBalance] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  // Helper function to get the embedded wallet address consistently
  const getEmbeddedWalletAddress = () => {
    const embeddedWallet = wallets.find(
      wallet => wallet.walletClientType === 'privy'
    );
    return embeddedWallet?.address;
  };

  const checkBnbBalance = async () => {
    const walletAddress = getEmbeddedWalletAddress();
    if (!walletAddress) return;

    setIsCheckingBnbBalance(true);
    try {
      const balance = await publicClient.getBalance({
        address: walletAddress as `0x${string}`,
      });

      const formattedBalance = Number(balance) / 10 ** 18; // Convert from wei to BNB
      setBnbBalance(formattedBalance.toString());
      return formattedBalance;
    } catch (error) {
      console.error('Error checking BNB balance:', error);
      setBnbBalance('0');
      return 0;
    } finally {
      setIsCheckingBnbBalance(false);
    }
  };

  const checkKycTokenBalance = async () => {
    const walletAddress = getEmbeddedWalletAddress();
    if (!walletAddress) return;

    setIsCheckingBalance(true);
    try {
      console.log('Checking KYC token balance for address:', walletAddress);

      // Get token decimals and balance in parallel
      const [balanceResult, decimalsResult] = await Promise.all([
        publicClient.readContract({
          address: KYC_CONTRACT_ADDRESS as `0x${string}`,
          abi: KYC_CONTRACT_ABI,
          functionName: 'balanceOf',
          args: [walletAddress as `0x${string}`],
        }),
        publicClient
          .readContract({
            address: KYC_CONTRACT_ADDRESS as `0x${string}`,
            abi: KYC_CONTRACT_ABI,
            functionName: 'decimals',
          })
          .catch(() => 18), // Default to 18 decimals if call fails
      ]);

      const rawBalance = Number(balanceResult);
      const decimals = Number(decimalsResult);
      const formattedBalance = rawBalance / 10 ** decimals;

      console.log('Raw balance:', rawBalance);
      console.log('Decimals:', decimals);
      console.log('Formatted balance:', formattedBalance);

      setKycTokenBalance(formattedBalance);
      setKycStatus(formattedBalance > 0 ? 'has_token' : 'no_token');
    } catch (error) {
      console.error('Error checking KYC balance:', error);
      setKycStatus('no_token');
    } finally {
      setIsCheckingBalance(false);
    }
  };

  // Check KYC token balance and BNB balance on component mount
  useEffect(() => {
    if (wallets.length > 0 && getEmbeddedWalletAddress()) {
      checkKycTokenBalance();
      checkBnbBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallets]);

  const handleClaimKycToken = async () => {
    const walletAddress = getEmbeddedWalletAddress();
    if (!walletAddress) {
      alert('No embedded wallet found');
      return;
    }

    // First check BNB balance
    const currentBnbBalance = (await checkBnbBalance()) || 0;

    if (currentBnbBalance === 0 || currentBnbBalance < 0.001) {
      // Show deposit modal if insufficient BNB for gas
      setIsDepositModalOpen(true);
      return;
    }

    setIsClaimingToken(true);
    try {
      // Find the embedded wallet in the wallets list
      const embeddedWallet = wallets.find(
        wallet => wallet.walletClientType === 'privy'
      );

      if (!embeddedWallet) {
        alert(
          'Embedded wallet not found. Please ensure you have a Privy wallet connected.'
        );
        return;
      }

      // Import viem utilities for the transaction
      const { createWalletClient, custom } = await import('viem');

      // Get the provider from the embedded wallet
      const provider = await embeddedWallet.getEthereumProvider();

      if (!provider) {
        alert('Could not access wallet provider. Please try again.');
        return;
      }

      // Create wallet client with the Privy provider
      const walletClient = createWalletClient({
        chain: bscTestnet,
        transport: custom(provider),
        account: embeddedWallet.address as `0x${string}`,
      });

      console.log('Switching to BSC testnet...');

      // Switch to BSC testnet (chain ID 97)
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x61' }], // 97 in hex
        });
      } catch (switchError: any) {
        // If the chain doesn't exist, add it
        if (switchError.code === 4902) {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x61',
                chainName: 'BSC Testnet',
                nativeCurrency: {
                  name: 'BNB',
                  symbol: 'BNB',
                  decimals: 18,
                },
                rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
                blockExplorerUrls: ['https://testnet.bscscan.com'],
              },
            ],
          });
        } else {
          throw switchError;
        }
      }

      console.log('Calling mintFree function...');

      // Call the mintFree function on the contract
      const txHash = await walletClient.writeContract({
        address: KYC_CONTRACT_ADDRESS as `0x${string}`,
        abi: KYC_CONTRACT_ABI,
        functionName: 'mintFree',
        args: [],
      });

      console.log('Transaction sent:', txHash);

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      console.log('Transaction confirmed:', receipt);

      if (receipt.status === 'success') {
        // Refresh the KYC token balance after successful mint
        await checkKycTokenBalance();

        alert(
          `🎉 KYC token minted successfully!\n\n` +
            `Transaction: ${txHash}\n` +
            `Block: ${receipt.blockNumber}\n\n` +
            `View on BSCScan: https://testnet.bscscan.com/tx/${txHash}`
        );
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error: any) {
      console.error('Error minting KYC token:', error);
      alert(`Failed to mint KYC token: ${error.message || 'Unknown error'}`);
    } finally {
      setIsClaimingToken(false);
    }
  };

  if (!ready || !authenticated || !user) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-white'>
        <div className='text-center'>
          <div className='animate-pulse text-gray-400'>Loading profile...</div>
        </div>
      </div>
    );
  }

  const numAccounts = user?.linkedAccounts?.length || 0;
  const canRemoveAccount = numAccounts > 1;

  const email = user?.email;
  const phone = user?.phone;
  const wallet = user?.wallet;
  const googleSubject = user?.google?.subject || null;
  const twitterSubject = user?.twitter?.subject || null;
  const discordSubject = user?.discord?.subject || null;

  // Find smart wallet from linked accounts
  const smartWallet = user?.linkedAccounts?.find(
    account => account.type === 'smart_wallet'
  ) as
    | { type: 'smart_wallet'; address: string; smartWalletType?: string }
    | undefined;

  const connectedWallets =
    user?.linkedAccounts?.filter(account => account.type === 'wallet') || [];

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8 rounded-lg border border-gray-200 bg-white shadow-sm'>
          <div className='px-6 py-8'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-4'>
                <button
                  onClick={() => router.push('/dashboard')}
                  className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200'
                >
                  <ArrowLeft className='h-5 w-5 text-gray-600' />
                </button>
                <div className='flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600'>
                  <User className='h-8 w-8 text-white' />
                </div>
                <div>
                  <h1 className='text-2xl font-bold text-gray-900'>
                    Profile Settings
                  </h1>
                  <p className='text-gray-600'>
                    Manage your account and connected services
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className='rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-200'
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
          {/* Account Information */}
          <div className='space-y-6'>
            <div className='rounded-lg border border-gray-200 bg-white shadow-sm'>
              <div className='border-b border-gray-200 px-6 py-4'>
                <h2 className='flex items-center text-lg font-semibold text-gray-900'>
                  <User className='mr-2 h-5 w-5' />
                  Account Information
                </h2>
              </div>
              <div className='space-y-4 px-6 py-4'>
                {/* User ID */}
                <div className='flex items-center justify-between border-b border-gray-100 py-3'>
                  <div className='flex items-center space-x-3'>
                    <Shield className='h-4 w-4 text-gray-400' />
                    <div>
                      <p className='text-sm font-medium text-gray-900'>
                        User ID
                      </p>
                      <p className='text-xs text-gray-500'>
                        Your unique identifier
                      </p>
                    </div>
                  </div>
                  <p className='font-mono text-sm text-gray-600'>
                    {user.id?.slice(0, 8)}...{user.id?.slice(-8)}
                  </p>
                </div>

                {/* Created Date */}
                <div className='flex items-center justify-between py-3'>
                  <div className='flex items-center space-x-3'>
                    <Shield className='h-4 w-4 text-gray-400' />
                    <div>
                      <p className='text-sm font-medium text-gray-900'>
                        Account Created
                      </p>
                      <p className='text-xs text-gray-500'>Member since</p>
                    </div>
                  </div>
                  <p className='text-sm text-gray-600'>
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>

            {/* Email Settings */}
            <div className='rounded-lg border border-gray-200 bg-white shadow-sm'>
              <div className='border-b border-gray-200 px-6 py-4'>
                <h2 className='flex items-center text-lg font-semibold text-gray-900'>
                  <Mail className='mr-2 h-5 w-5' />
                  Email
                </h2>
              </div>
              <div className='px-6 py-4'>
                {email ? (
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-green-100'>
                        <Check className='h-4 w-4 text-green-600' />
                      </div>
                      <div>
                        <p className='text-sm font-medium text-gray-900'>
                          {email.address}
                        </p>
                        <p className='text-xs text-gray-500'>
                          Verified email address
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => unlinkEmail(email.address)}
                      disabled={!canRemoveAccount}
                      className='rounded-md border border-red-300 px-3 py-1 text-sm text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-100'>
                        <X className='h-4 w-4 text-gray-400' />
                      </div>
                      <div>
                        <p className='text-sm font-medium text-gray-900'>
                          No email connected
                        </p>
                        <p className='text-xs text-gray-500'>
                          Add an email for account recovery
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={linkEmail}
                      className='rounded-md bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-700'
                    >
                      Connect
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Phone Settings */}
            <div className='rounded-lg border border-gray-200 bg-white shadow-sm'>
              <div className='border-b border-gray-200 px-6 py-4'>
                <h2 className='flex items-center text-lg font-semibold text-gray-900'>
                  <Phone className='mr-2 h-5 w-5' />
                  Phone
                </h2>
              </div>
              <div className='px-6 py-4'>
                {phone ? (
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-green-100'>
                        <Check className='h-4 w-4 text-green-600' />
                      </div>
                      <div>
                        <p className='text-sm font-medium text-gray-900'>
                          {phone.number}
                        </p>
                        <p className='text-xs text-gray-500'>
                          Verified phone number
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => unlinkPhone(phone.number)}
                      disabled={!canRemoveAccount}
                      className='rounded-md border border-red-300 px-3 py-1 text-sm text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-100'>
                        <X className='h-4 w-4 text-gray-400' />
                      </div>
                      <div>
                        <p className='text-sm font-medium text-gray-900'>
                          No phone connected
                        </p>
                        <p className='text-xs text-gray-500'>
                          Add a phone for 2FA security
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={linkPhone}
                      className='rounded-md bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-700'
                    >
                      Connect
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* BNB Deposit Modal */}
            <Modal
              isOpen={isDepositModalOpen}
              onClose={() => {
                setIsDepositModalOpen(false);
                setDepositSuccess(false);
              }}
              title='Deposit BNB for Gas Fees'
            >
              {depositSuccess ? (
                <div className='text-center'>
                  <div className='mb-4 flex justify-center'>
                    <CheckCircle className='h-16 w-16 animate-pulse text-green-500' />
                  </div>
                  <h3 className='mb-2 text-lg font-semibold text-gray-900'>
                    Ready to Mint!
                  </h3>
                  <p className='text-gray-600'>
                    Your BNB balance is sufficient for minting the KYC token.
                  </p>
                  <button
                    onClick={() => {
                      setIsDepositModalOpen(false);
                      setDepositSuccess(false);
                      handleClaimKycToken();
                    }}
                    className='mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700'
                  >
                    Mint KYC Token
                  </button>
                </div>
              ) : (
                <div className='space-y-4'>
                  <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4'>
                    <div className='flex items-start space-x-3'>
                      <AlertCircle className='mt-0.5 h-5 w-5 text-yellow-600' />
                      <div>
                        <h4 className='text-sm font-medium text-yellow-800'>
                          Insufficient BNB Balance
                        </h4>
                        <p className='mt-1 text-sm text-yellow-700'>
                          Current Balance: {parseFloat(bnbBalance).toFixed(4)}{' '}
                          BNB
                        </p>
                        <p className='text-sm text-yellow-700'>
                          You need at least 0.001 BNB to pay for gas fees when
                          minting your KYC token.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className='mb-3 text-lg font-semibold text-gray-900'>
                      How to get BNB on BSC Testnet:
                    </h3>
                    <div className='space-y-3 text-sm text-gray-700'>
                      <div className='flex items-start space-x-2'>
                        <span className='mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600'>
                          1
                        </span>
                        <div>
                          <p className='font-medium'>
                            Visit the BSC Testnet Faucet
                          </p>
                          <a
                            href='https://testnet.bnbchain.org/faucet-smart'
                            target='_blank'
                            rel='noopener noreferrer'
                            className='flex items-center space-x-1 text-blue-600 hover:text-blue-800 hover:underline'
                          >
                            <span>
                              https://testnet.bnbchain.org/faucet-smart
                            </span>
                            <ExternalLink className='h-3 w-3' />
                          </a>
                        </div>
                      </div>

                      <div className='flex items-start space-x-2'>
                        <span className='mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600'>
                          2
                        </span>
                        <div>
                          <p className='font-medium'>
                            Enter your wallet address
                          </p>
                          <div className='mt-1 flex items-center space-x-2 rounded bg-gray-100 p-2'>
                            <code className='font-mono text-xs text-gray-800'>
                              {getEmbeddedWalletAddress()}
                            </code>
                            <button
                              onClick={() =>
                                navigator.clipboard.writeText(
                                  getEmbeddedWalletAddress() || ''
                                )
                              }
                              className='text-blue-600 hover:text-blue-800'
                            >
                              <Copy className='h-4 w-4' />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className='flex items-start space-x-2'>
                        <span className='mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600'>
                          3
                        </span>
                        <p>
                          Request testnet BNB (you can claim 0.3 BNB every 24
                          hours)
                        </p>
                      </div>

                      <div className='flex items-start space-x-2'>
                        <span className='mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600'>
                          4
                        </span>
                        <p>
                          Wait for the transaction to complete and return here
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='flex space-x-3 pt-4'>
                    <button
                      onClick={() => setIsDepositModalOpen(false)}
                      className='flex-1 rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200'
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        const newBalance = (await checkBnbBalance()) || 0;
                        if (newBalance >= 0.001) {
                          setDepositSuccess(true);
                        } else {
                          alert(
                            `Still insufficient balance: ${newBalance.toFixed(4)} BNB. Please request more from the faucet.`
                          );
                        }
                      }}
                      disabled={isCheckingBnbBalance}
                      className='flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50'
                    >
                      {isCheckingBnbBalance ? 'Checking...' : 'Check Balance'}
                    </button>
                  </div>
                </div>
              )}
            </Modal>

            {/* KYC Compliance */}
            <div className='rounded-lg border border-gray-200 bg-white shadow-sm'>
              <div className='border-b border-gray-200 px-6 py-4'>
                <h2 className='flex items-center text-lg font-semibold text-gray-900'>
                  <Award className='mr-2 h-5 w-5' />
                  KYC Compliance
                </h2>
              </div>
              <div className='px-6 py-4'>
                {kycStatus === 'loading' && (
                  <div className='flex items-center justify-center py-8'>
                    <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600'></div>
                    <span className='ml-3 text-sm text-gray-600'>
                      Checking KYC token status...
                    </span>
                  </div>
                )}

                {kycStatus === 'no_token' && (
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-100'>
                        <AlertCircle className='h-4 w-4 text-gray-400' />
                      </div>
                      <div>
                        <p className='text-sm font-medium text-gray-900'>
                          No KYC Token
                        </p>
                        <p className='text-xs text-gray-500'>
                          Mint your free KYC token to unlock premium features
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleClaimKycToken}
                      disabled={isClaimingToken}
                      className='rounded-md bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-700 disabled:opacity-50'
                    >
                      {isClaimingToken ? 'Minting...' : 'Mint Free KYC Token'}
                    </button>
                  </div>
                )}

                {kycStatus === 'has_token' && (
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-3'>
                        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-green-100'>
                          <Award className='h-4 w-4 text-green-600' />
                        </div>
                        <div>
                          <p className='text-sm font-medium text-gray-900'>
                            KYC Token Claimed
                          </p>
                          <p className='text-xs text-gray-500'>
                            You have access to premium features
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600'>
                          <Shield className='h-4 w-4 text-white' />
                        </div>
                        <span className='rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-600'>
                          Premium User
                        </span>
                      </div>
                    </div>

                    <div className='rounded-lg border border-green-200 bg-green-50 p-4'>
                      <div className='flex items-start space-x-3'>
                        <Shield className='mt-0.5 h-5 w-5 text-green-600' />
                        <div className='flex-1'>
                          <h4 className='mb-2 text-sm font-medium text-green-800'>
                            Token Details
                          </h4>
                          <div className='space-y-1 text-xs text-green-700'>
                            <p>
                              <span className='font-medium'>Balance:</span>{' '}
                              {Number(kycTokenBalance).toLocaleString()} KYC
                              Token
                              {kycTokenBalance !== 1 ? 's' : ''}
                            </p>
                            <p>
                              <span className='font-medium'>Network:</span> BSC
                              Testnet
                            </p>
                            <p>
                              <span className='font-medium'>Contract:</span>{' '}
                              0xcc8e8b424464991bbcda036c4781a60334c40628
                            </p>
                          </div>
                          <div className='mt-3 flex space-x-2'>
                            <a
                              href='https://testnet.bscscan.com/address/0xcc8e8b424464991bbcda036c4781a60334c40628'
                              target='_blank'
                              rel='noopener noreferrer'
                              className='inline-flex items-center text-xs text-green-600 transition-colors hover:text-green-800'
                            >
                              <ExternalLink className='mr-1 h-3 w-3' />
                              View on BSC Testnet
                            </a>
                            <button
                              onClick={checkKycTokenBalance}
                              disabled={isCheckingBalance}
                              className='inline-flex items-center text-xs text-green-600 transition-colors hover:text-green-800 disabled:opacity-50'
                            >
                              <Shield className='mr-1 h-3 w-3' />
                              {isCheckingBalance
                                ? 'Checking...'
                                : 'Refresh Balance'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Forte KYC Security Information */}
                <div className='mt-6 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4'>
                  <div className='flex items-start space-x-3'>
                    <Shield className='mt-0.5 h-5 w-5 text-blue-600' />
                    <div className='flex-1'>
                      <h4 className='mb-2 text-sm font-semibold text-blue-900'>
                        🔒 Powered by Forte KYC Solutions
                      </h4>
                      <div className='space-y-2 text-xs text-blue-800'>
                        <p>
                          <span className='font-medium'>
                            ✓ Bank-grade security:
                          </span>{' '}
                          Your identity is verified using institutional-level
                          compliance protocols
                        </p>
                        <p>
                          <span className='font-medium'>✓ OFAC screening:</span>{' '}
                          Real-time sanctions and watchlist monitoring for
                          regulatory compliance
                        </p>
                        <p>
                          <span className='font-medium'>
                            ✓ Privacy protected:
                          </span>{' '}
                          Zero-knowledge verification ensures your data remains
                          secure and private
                        </p>
                        <p>
                          <span className='font-medium'>
                            ✓ Globally compliant:
                          </span>{' '}
                          Meets AML/BSA requirements across jurisdictions
                        </p>
                      </div>
                      <div className='mt-3 flex items-center space-x-2 text-xs'>
                        <span className='rounded-full bg-blue-100 px-2 py-1 font-medium text-blue-700'>
                          SOC 2 Type II Certified
                        </span>
                        <span className='rounded-full bg-indigo-100 px-2 py-1 font-medium text-indigo-700'>
                          ISO 27001 Compliant
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

                      {/* Balances Section */}
            <div className='rounded-lg border border-gray-200 bg-white shadow-sm'>
              <div className='border-b border-gray-200 px-6 py-4'>
                <h2 className='flex items-center text-lg font-semibold text-gray-900'>
                  <Wallet className='mr-2 h-5 w-5' />
                  Balances
                </h2>
              </div>
              <div className='px-6 py-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-3'>
                    <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600'>
                      <img
                        src='/assets/pyusd_logo.png'
                        alt='PYUSD'
                        className='h-6 w-6 rounded-full'
                      />
                    </div>
                    <div>
                      <p className='text-sm font-medium text-gray-900'>
                        PYUSD on Flow
                      </p>
                      <p className='text-xs text-gray-500'>
                        Check your PYUSD balance on Flow testnet
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push('/profile/pyusd-flow')}
                    className='inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700'
                  >
                    <ExternalLink className='mr-1 h-4 w-4' />
                    View Balance
                  </button>
                </div>
              </div>
            </div>

            {/* Connected Services & Wallets */}
          <div className='space-y-6'>
            {/* Social Accounts */}
            <div className='rounded-lg border border-gray-200 bg-white shadow-sm'>
              <div className='border-b border-gray-200 px-6 py-4'>
                <h2 className='flex items-center text-lg font-semibold text-gray-900'>
                  <ExternalLink className='mr-2 h-5 w-5' />
                  Social Accounts
                </h2>
              </div>
              <div className='space-y-4 px-6 py-4'>
                {/* Google */}
                <div className='flex items-center justify-between py-2'>
                  <div className='flex items-center space-x-3'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-red-100'>
                      <span className='text-sm font-bold text-red-600'>G</span>
                    </div>
                    <div>
                      <p className='text-sm font-medium text-gray-900'>
                        Google
                      </p>
                      <p className='text-xs text-gray-500'>
                        {googleSubject ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  {googleSubject ? (
                    <button
                      onClick={() => unlinkGoogle(googleSubject)}
                      disabled={!canRemoveAccount}
                      className='rounded-md border border-red-300 px-3 py-1 text-sm text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      Unlink
                    </button>
                  ) : (
                    <button
                      onClick={linkGoogle}
                      className='rounded-md bg-red-600 px-3 py-1 text-sm text-white transition-colors hover:bg-red-700'
                    >
                      Link
                    </button>
                  )}
                </div>

                {/* Twitter */}
                <div className='flex items-center justify-between py-2'>
                  <div className='flex items-center space-x-3'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-blue-100'>
                      <span className='text-sm font-bold text-blue-600'>𝕏</span>
                    </div>
                    <div>
                      <p className='text-sm font-medium text-gray-900'>
                        Twitter
                      </p>
                      <p className='text-xs text-gray-500'>
                        {twitterSubject ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  {twitterSubject ? (
                    <button
                      onClick={() => unlinkTwitter(twitterSubject)}
                      disabled={!canRemoveAccount}
                      className='rounded-md border border-red-300 px-3 py-1 text-sm text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      Unlink
                    </button>
                  ) : (
                    <button
                      onClick={linkTwitter}
                      className='rounded-md bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-700'
                    >
                      Link
                    </button>
                  )}
                </div>

                {/* Discord */}
                <div className='flex items-center justify-between py-2'>
                  <div className='flex items-center space-x-3'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-purple-100'>
                      <span className='text-sm font-bold text-purple-600'>
                        D
                      </span>
                    </div>
                    <div>
                      <p className='text-sm font-medium text-gray-900'>
                        Discord
                      </p>
                      <p className='text-xs text-gray-500'>
                        {discordSubject ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  {discordSubject ? (
                    <button
                      onClick={() => unlinkDiscord(discordSubject)}
                      disabled={!canRemoveAccount}
                      className='rounded-md border border-red-300 px-3 py-1 text-sm text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      Unlink
                    </button>
                  ) : (
                    <button
                      onClick={linkDiscord}
                      className='rounded-md bg-purple-600 px-3 py-1 text-sm text-white transition-colors hover:bg-purple-700'
                    >
                      Link
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Wallets */}
            <div className='rounded-lg border border-gray-200 bg-white shadow-sm'>
              <div className='border-b border-gray-200 px-6 py-4'>
                <h2 className='flex items-center text-lg font-semibold text-gray-900'>
                  <Wallet className='mr-2 h-5 w-5' />
                  Wallets
                </h2>
              </div>
              <div className='space-y-4 px-6 py-4'>
                {/* Primary Wallet */}
                {wallet && (
                  <div className='flex items-center justify-between py-2'>
                    <div className='flex items-center space-x-3'>
                      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-green-100'>
                        <Wallet className='h-4 w-4 text-green-600' />
                      </div>
                      <div>
                        <p className='text-sm font-medium text-gray-900'>
                          Primary Wallet
                        </p>
                        <p className='font-mono text-xs text-gray-500'>
                          {wallet.address.slice(0, 8)}...
                          {wallet.address.slice(-8)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => unlinkWallet(wallet.address)}
                      disabled={!canRemoveAccount}
                      className='rounded-md border border-red-300 px-3 py-1 text-sm text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      Unlink
                    </button>
                  </div>
                )}

                {/* Smart Wallet */}
                {smartWallet && (
                  <div className='flex items-center justify-between py-2'>
                    <div className='flex items-center space-x-3'>
                      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-blue-100'>
                        <Shield className='h-4 w-4 text-blue-600' />
                      </div>
                      <div>
                        <p className='text-sm font-medium text-gray-900'>
                          Smart Wallet
                        </p>
                        <p className='font-mono text-xs text-gray-500'>
                          {smartWallet.address.slice(0, 8)}...
                          {smartWallet.address.slice(-8)}
                        </p>
                      </div>
                    </div>
                    <span className='rounded-full bg-green-100 px-2 py-1 text-xs text-green-600'>
                      Active
                    </span>
                  </div>
                )}

                {/* Additional Wallets */}
                {connectedWallets.map((connectedWallet, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between py-2'
                  >
                    <div className='flex items-center space-x-3'>
                      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-100'>
                        <Wallet className='h-4 w-4 text-gray-600' />
                      </div>
                      <div>
                        <p className='text-sm font-medium text-gray-900'>
                          {connectedWallet.walletClientType === 'privy'
                            ? 'Embedded Wallet'
                            : 'External Wallet'}
                        </p>
                        <p className='font-mono text-xs text-gray-500'>
                          {connectedWallet.address.slice(0, 8)}...
                          {connectedWallet.address.slice(-8)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => unlinkWallet(connectedWallet.address)}
                      disabled={!canRemoveAccount}
                      className='rounded-md border border-red-300 px-3 py-1 text-sm text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      Unlink
                    </button>
                  </div>
                ))}

                {/* Connect New Wallet Button */}
                <div className='border-t border-gray-100 pt-2'>
                  <button
                    onClick={linkWallet}
                    className='flex w-full items-center justify-center space-x-2 rounded-md border-2 border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-700'
                  >
                    <Plus className='h-4 w-4' />
                    <span>Connect New Wallet</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Account Security Status */}
            <div className='rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-blue-50 p-6'>
              <div className='mb-4 flex items-center space-x-3'>
                <Shield className='h-6 w-6 text-green-600' />
                <h3 className='text-lg font-semibold text-gray-900'>
                  Security Status
                </h3>
              </div>
              <div className='space-y-2'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-700'>
                    Two-Factor Authentication
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      phone
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {phone ? 'Enabled' : 'Recommended'}
                  </span>
                </div>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-700'>Account Recovery</span>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      email
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {email ? 'Configured' : 'Recommended'}
                  </span>
                </div>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-700'>Social Backup</span>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      googleSubject || twitterSubject || discordSubject
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {googleSubject || twitterSubject || discordSubject
                      ? 'Available'
                      : 'Optional'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Warning about account removal */}
        {!canRemoveAccount && (
          <div className='mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4'>
            <div className='flex items-start space-x-3'>
              <div className='flex-shrink-0'>
                <Shield className='h-5 w-5 text-yellow-600' />
              </div>
              <div>
                <h3 className='text-sm font-medium text-yellow-800'>
                  Account Security Notice
                </h3>
                <p className='mt-1 text-sm text-yellow-700'>
                  You cannot remove your last authentication method. Please add
                  another method before removing your current one.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
