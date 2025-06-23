# Uniswap V3 Swap Parameter Fixes

## Issue

The swap transactions were failing with "execution reverted" due to incorrect parameters being passed to the `exactInputSingle` function.

## Root Cause Analysis

Comparing the failed implementation with a successful transaction ([0x905248a12a212181b10063b0742d75d0fdea0d5ba1b0f9f88969c61dd433e63e](https://sepolia.etherscan.io/tx/0x905248a12a212181b10063b0742d75d0fdea0d5ba1b0f9f88969c61dd433e63e)), the issues were:

### ❌ Before (Failing Parameters)

```javascript
const swapParams = {
  tokenIn: PYUSD_TOKEN.address,
  tokenOut: USDC_TOKEN.address,
  fee: 3000,
  recipient: metamaskWallet.address,
  deadline: deadline,
  amountIn: swapAmountWei,
  amountOutMinimum: 0n, // ⚠️ DANGEROUS: No slippage protection
  sqrtPriceLimitX96: 0n, // ⚠️ MAY CAUSE ISSUES
};
```

### ✅ After (Fixed Parameters)

```javascript
// Calculate minimum output with 5% slippage tolerance
const estimatedOutputWei = swapAmountWei / 70n; // Based on PYUSD/USDC ratio
const slippageToleranceBps = 500n; // 5% = 500 basis points
const amountOutMinimum =
  (estimatedOutputWei * (10000n - slippageToleranceBps)) / 10000n;

const swapParams = {
  tokenIn: PYUSD_TOKEN.address,
  tokenOut: USDC_TOKEN.address,
  fee: 3000,
  recipient: metamaskWallet.address,
  deadline: deadline,
  amountIn: swapAmountWei,
  amountOutMinimum: amountOutMinimum, // ✅ Proper slippage protection
  sqrtPriceLimitX96: 0n, // ✅ No price limit (acceptable)
};
```

## Key Fixes

### 1. Added Slippage Protection

- **Problem**: `amountOutMinimum: 0n` meant accepting ANY output amount, including extremely unfavorable swaps
- **Solution**: Calculate minimum expected output based on rough price ratio with 5% slippage tolerance
- **Formula**: `minOutput = (estimatedOutput * (10000 - slippageBps)) / 10000`

### 2. Improved Price Estimation

- **Analysis**: From successful transactions, PYUSD/USDC ratio is approximately 70:1
- **Implementation**: `estimatedOutputWei = swapAmountWei / 70n`
- **Note**: This is a rough estimate; in production, use a price oracle or quote function

### 3. Enhanced Debugging

- Added detailed parameter validation logging
- Added specific error message parsing
- Added wei-to-token conversion logging for easier debugging

## Parameter Comparison

### Successful Transaction Example

```
Function: exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))
- tokenIn: 0x2d5fA65fd978E4533FE6876cc19A26A285e81f72
- tokenOut: 0x703bd35f91bc3947aaC70B4b0c560Bee5F06F84c
- fee: 3000
- recipient: 0xd4A17363D89212598F66eC5aBF9ceE8bA0159Ce7
- amountIn: 4299000000000000000000 (4299 tokens)
- amountOutMinimum: 61627706 (61.627706 tokens) ✅ Has slippage protection
- sqrtPriceLimitX96: 9371054011052314060078 ✅ Has price limit
```

### Our Fixed Implementation

```
- tokenIn: 0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9 (PYUSD)
- tokenOut: 0x1c7d4b196cb0c7b01d743fbc6116a902379c7238 (USDC)
- fee: 3000 (0.3%)
- recipient: [user address]
- amountIn: [user specified amount in wei]
- amountOutMinimum: [calculated with 5% slippage] ✅ Now has protection
- sqrtPriceLimitX96: 0 (no limit)
```

## Testing Steps

1. Ensure proper token approvals to the router
2. Check sufficient PYUSD balance for the swap amount
3. Monitor console logs for detailed parameter validation
4. Verify transaction success with proper slippage protection

## Notes

- The price estimation (70:1 ratio) is rough and based on historical transaction analysis
- In production, use Uniswap's quoter contract or a price oracle for accurate estimates
- The 5% slippage tolerance can be adjusted based on user preferences
- Consider implementing dynamic slippage based on market volatility
