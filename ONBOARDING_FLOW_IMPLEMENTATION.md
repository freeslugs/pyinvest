# PyInvest Onboarding Flow Implementation

## Overview

The onboarding flow has been successfully implemented to guide new users through getting started with PyInvest. The flow determines whether users have PYUSD in traditional apps (Venmo, PayPal, Coinbase) or crypto wallets, and provides appropriate guidance for each scenario.

## Components Created

### 1. OnboardingFlow Component (`components/OnboardingFlow.tsx`)
The main onboarding modal that manages the multi-step flow:

- **Welcome Step**: Introduces users to PyInvest
- **PYUSD Source Selection**: Asks where they currently have PYUSD
- **Traditional Deposit**: Shows QR code and instructions for transferring from Venmo/PayPal/Coinbase
- **Crypto Wallet Connection**: Helps users connect MetaMask or other crypto wallets via Privy
- **Waiting for Deposit**: Loading state while monitoring for incoming PYUSD
- **Completion**: Marks onboarding as completed in localStorage

### 2. SmartWalletCard Component (`components/SmartWalletCard.tsx`)
Replaces the traditional balance sources section when users have a smart wallet with PYUSD:

- Displays smart wallet balance
- Shows truncated wallet address
- "Show QR" button to open QR code modal
- Copy address functionality

### 3. QRCodeComponent (`components/ui/qr-code.tsx`)
Reusable QR code component using the `qrcode` library:

- Generates real QR codes from wallet addresses
- Loading state while generating
- Error handling for QR generation failures
- Configurable size and error correction level

## Dashboard Integration

### Updated Dashboard (`app/dashboard/page.tsx`)

The dashboard now includes:

1. **Onboarding Detection Logic**:
   - Checks localStorage for `onboarding_completed` flag
   - Detects if user has connected external wallets
   - Monitors smart wallet balance
   - Shows onboarding modal for new users without significant setup

2. **Smart Wallet Integration**:
   - Uses Privy hooks (`usePrivy`, `useSmartWallets`)
   - Fetches PYUSD balance from smart wallet on Sepolia testnet
   - Conditionally shows either SmartWalletCard or traditional balance sources

3. **Balance Fetching**:
   - `fetchSmartWalletBalance()`: Fetches PYUSD balance from smart wallet using viem
   - Automatically switches to smart wallet view when balance is detected
   - Error handling for RPC failures

## User Flow Logic

### New User Experience

1. **First Login**:
   - User logs in for the first time
   - Dashboard checks if `onboarding_completed` exists in localStorage
   - If not completed and no significant wallet setup, shows onboarding modal

2. **PYUSD Source Selection**:
   - **Traditional Apps Path**:
     - Shows QR code of smart wallet address
     - Provides step-by-step instructions for transferring from Venmo/PayPal/Coinbase
     - "I've sent the PYUSD" button leads to waiting state

   - **Crypto Wallet Path**:
     - Prompts to connect wallet using Privy's `linkWallet()`
     - Automatically proceeds to waiting state after connection

3. **Waiting State**:
   - Shows loading spinner
   - Explains that balance monitoring is happening
   - "Continue to Dashboard" button to exit onboarding

4. **Completion**:
   - Sets `onboarding_completed: 'true'` in localStorage
   - Closes onboarding modal
   - Dashboard refreshes smart wallet balance

### Dashboard Behavior After Onboarding

- **Smart Wallet View**: Shows when user has smart wallet with PYUSD or connected external wallet
- **Traditional View**: Shows Venmo/Coinbase balance sources for users without smart wallet setup
- **Automatic Balance Updates**: Dashboard fetches smart wallet balance on load and after onboarding

## Technical Implementation Details

### Dependencies Added
- `qrcode`: For generating QR codes
- `@types/qrcode`: TypeScript types for qrcode library

### Privy Integration
- **Authentication**: Uses `usePrivy()` hook for user authentication state
- **Smart Wallets**: Uses `useSmartWallets()` for smart wallet access
- **Wallet Linking**: Uses `linkWallet()` to connect external wallets
- **Account Detection**: Checks `user.linkedAccounts` for smart wallets and external wallets

### Smart Wallet Configuration
- **Network**: Sepolia testnet (chainId: 11155111)
- **PYUSD Token**: Contract address `0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9`
- **RPC Endpoint**: Uses PublicNode Sepolia endpoint with fallback handling
- **Balance Fetching**: ERC20 `balanceOf` function call using viem

### State Management
- **localStorage**: Stores onboarding completion status
- **React State**: Manages onboarding flow steps, loading states, and balance data
- **Conditional Rendering**: Shows appropriate UI based on user's wallet setup status

## QR Code Implementation

The QR codes are generated using the `qrcode` library and display the smart wallet address:

```typescript
await QRCode.toCanvas(canvasRef.current, walletAddress, {
  width: 192,
  margin: 2,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  },
  errorCorrectionLevel: 'M'
});
```

## File Structure

```
components/
├── OnboardingFlow.tsx          # Main onboarding modal
├── SmartWalletCard.tsx         # Smart wallet balance display
├── ui/
│   ├── modal.tsx              # Existing modal component
│   └── qr-code.tsx            # New QR code generator
app/
└── dashboard/
    └── page.tsx               # Updated dashboard with onboarding integration
```

## Future Enhancements

1. **Balance Monitoring**: Real-time WebSocket monitoring for incoming PYUSD deposits
2. **Multi-Network Support**: Extend beyond Sepolia to mainnet and other networks
3. **Enhanced Error Handling**: Better error messages and retry mechanisms
4. **Progress Indicators**: Visual progress through onboarding steps
5. **Analytics**: Track onboarding completion rates and drop-off points
6. **Wallet Balance Aggregation**: Show combined balance from multiple sources

## Testing Considerations

1. **First-Time User Flow**: Test with fresh localStorage (clear `onboarding_completed`)
2. **Smart Wallet Integration**: Verify smart wallet creation and balance fetching
3. **QR Code Generation**: Test QR code scanning with mobile wallets
4. **Network Connectivity**: Test behavior with RPC failures
5. **Wallet Connection**: Test external wallet linking via Privy

This implementation provides a smooth, user-friendly onboarding experience that guides users through setting up their PyInvest account regardless of their current PYUSD storage solution.
