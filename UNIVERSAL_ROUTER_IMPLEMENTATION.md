# Universal Router Implementation Fix

## Issue Identified
The previous implementation was failing because we were using the wrong Uniswap router contract. Analysis of the user's successful transaction revealed:

**❌ Previous (Failing)**: SwapRouter02 (`0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E`)
**✅ Working**: Universal Router (`0x3A9D48AB9751398BbFa63ad67599Bb04e4BdF98b`)

## Root Cause Analysis

### Successful Transaction Analysis
From the user's working transaction: [0x26c9ef813961cb81f8c8941d9de273ffdf13f984919a0b293ef78c338bf9f3d0](https://sepolia.etherscan.io/tx/0x26c9ef813961cb81f8c8941d9de273ffdf13f984919a0b293ef78c338bf9f3d0)

**Key Insights:**
- **Router Contract**: `0x3A9D48AB9751398BbFa63ad67599Bb04e4BdF98b` (Universal Router)
- **Function Used**: `execute(bytes commands, bytes[] inputs, uint256 deadline)`
- **Token Addresses**: Confirmed the original addresses were correct
- **Result**: 1 PYUSD → 0.994448 USDC (successful swap)

## Changes Made

### 1. Updated Router Contract
```typescript
// BEFORE (failing)
export const UNISWAP_V3_ROUTER_ADDRESS = '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E'; // SwapRouter02

// AFTER (working)
export const UNISWAP_V3_ROUTER_ADDRESS = '0x3A9D48AB9751398BbFa63ad67599Bb04e4BdF98b'; // Universal Router
```

### 2. Updated Router ABI
```typescript
// BEFORE: SwapRouter02 ABI with exactInputSingle
export const UNISWAP_V3_ROUTER_ABI = [
  {
    name: 'exactInputSingle',
    inputs: [{ components: [...], name: 'params', type: 'tuple' }],
    // ...
  },
];

// AFTER: Universal Router ABI with execute
export const UNISWAP_V3_ROUTER_ABI = [
  {
    name: 'execute',
    inputs: [
      { name: 'commands', type: 'bytes' },
      { name: 'inputs', type: 'bytes[]' },
      { name: 'deadline', type: 'uint256' },
    ],
    // ...
  },
];
```

### 3. Updated Swap Implementation
```typescript
// BEFORE: SwapRouter02 exactInputSingle approach
const swapCalldata = encodeFunctionData({
  abi: UNISWAP_V3_ROUTER_ABI,
  functionName: 'exactInputSingle',
  args: [swapParams],
});

// AFTER: Universal Router execute approach
const commands = '0x00'; // V3_SWAP_EXACT_IN command
const swapInput = encodeAbiParameters([...], [...]);
const executeCalldata = encodeFunctionData({
  abi: UNISWAP_V3_ROUTER_ABI,
  functionName: 'execute',
  args: [commands, [swapInput], deadline],
});
```

### 4. Fixed Token Configuration
- **PYUSD**: `0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9` (6 decimals)
- **USDC**: `0x1c7d4b196cb0c7b01d743fbc6116a902379c7238` (6 decimals)
- **Pool**: `0x1eA26f380A71E15E75E61c6D66B4242c1f652FEd` (0.3% fee)

## Implementation Details

### Universal Router Command Structure
- **Command `0x00`**: `V3_SWAP_EXACT_IN` - Exact input swap on Uniswap V3
- **Parameters**:
  - `recipient`: Where to send output tokens
  - `amountIn`: Input token amount
  - `amountOutMinimum`: Minimum output with slippage protection
  - `path`: Encoded token path (token0 + fee + token1)
  - `payerIsUser`: Whether user pays input tokens directly

### Path Encoding
```typescript
// Uniswap V3 packed path format: token0 + fee + token1
const path = `0x${PYUSD_TOKEN.address.slice(2)}${PYUSD_USDC_POOL.fee.toString(16).padStart(6, '0')}${USDC_TOKEN.address.slice(2)}`;
```

## Quality Assurance
- ✅ **TypeScript**: No type errors
- ✅ **ESLint**: No linting warnings
- ✅ **Build**: Production build successful
- ✅ **Router**: Updated to working Universal Router
- ✅ **Token Addresses**: Confirmed with successful transaction
- ✅ **Slippage Protection**: 5% tolerance implemented

## Expected Behavior
The swap should now work correctly because:
1. Using the correct Universal Router contract that's actually deployed on Sepolia
2. Using the correct `execute` function interface
3. Proper command encoding for V3_SWAP_EXACT_IN
4. Correct token addresses that have an active pool
5. Proper slippage protection

## Next Steps
1. Test the swap functionality with a small amount (1 PYUSD)
2. Monitor console logs for detailed debugging information
3. Verify successful transaction on Sepolia Etherscan
4. If successful, the same approach can be applied to liquidity addition

## Technical Notes
- Universal Router is Uniswap's newer, more flexible routing contract
- It uses a command-based system that can execute multiple operations in one transaction
- Commands are encoded as bytes, with each command type having a specific number
- The router supports both V2 and V3 swaps, as well as other DeFi operations
