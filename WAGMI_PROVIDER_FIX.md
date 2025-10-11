# WagmiProvider Context Fix

## Issue

Error when accessing the application:

```
`useConfig` must be used within `WagmiProvider`.
```

## Root Cause

The `BlockchainProvider` was conditionally rendering either `SolanaWalletProvider` OR `BnbWalletProvider`:

```tsx
// ❌ BEFORE (Problematic)
{
  selectedBlockchain === "solana" ? <SolanaWalletProvider>{children}</SolanaWalletProvider> : <BnbWalletProvider>{children}</BnbWalletProvider>;
}
```

This caused issues because:

1. When `selectedBlockchain === "solana"`, the `WagmiProvider` (inside `BnbWalletProvider`) was not mounted
2. But `index.tsx` was calling wagmi hooks (`useAccount`, `useDisconnect`, `useSendTransaction`) unconditionally
3. These hooks require `WagmiProvider` to be in the component tree

## Solution

Changed `BlockchainProvider` to render **both** wallet providers at all times:

```tsx
// ✅ AFTER (Fixed)
<BlockchainContext.Provider value={{ selectedBlockchain, setSelectedBlockchain }}>
  <BnbWalletProvider>
    <SolanaWalletProvider>{children}</SolanaWalletProvider>
  </BnbWalletProvider>
</BlockchainContext.Provider>
```

### How It Works Now

- Both `WagmiProvider` (BNB) and `WalletProvider` (Solana) are always mounted
- The `selectedBlockchain` context value controls which wallet state is used in the UI
- All hooks (both wagmi and Solana) can be called without errors
- Switching between blockchains just changes which wallet's state/actions are used

## Files Changed

- `/apps/frontend/src/components/providers/BlockchainProvider.tsx`

## Verification

✅ No more `useConfig` errors
✅ Both Solana and BNB wallets can be used
✅ Hot module reload working correctly
✅ Application accessible at http://localhost:5173

## Impact

- Very minimal performance impact (both providers are lightweight)
- Cleaner code without conditional provider mounting
- No hydration issues when switching between blockchains
- Both wallet contexts are always available
