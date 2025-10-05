# Testing Guide - Free Testing Setup

This guide explains how to test the solMessage application **without spending real money** by using Solana's devnet and test mode.

## Quick Start for Testing

### 1. Enable Test Mode

Add or update these environment variables in your `.env` file:

```bash
# Use Solana devnet (free test network)
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
```

### 2. Get Free Devnet SOL

You need devnet SOL (fake SOL for testing) in your wallet:

**Option A: Using Solana CLI**

```bash
solana airdrop 2 YOUR_WALLET_ADDRESS --url devnet
```

**Option B: Using Web Faucet**

1. Visit: https://faucet.solana.com/
2. Enter your wallet address
3. Select "Devnet"
4. Click "Confirm Airdrop"
5. You'll receive 1-2 devnet SOL (completely free)

**Option C: Using solana-faucet.com**

1. Visit: https://solana-faucet.com/
2. Select "Devnet" network
3. Enter your wallet address
4. Complete CAPTCHA
5. Receive free devnet SOL

### 3. Configure Your Wallet

In your Solana wallet (Phantom, Solflare, etc.):

1. Go to Settings
2. Change network to **Devnet**
3. Your wallet address stays the same, but now uses test network

### 4. Start Testing

```bash
# Start the application
cd /home/skmiraj/projects/solMessage
pnpm dev
```

## Testing on Devnet

✅ **Low-cost testing on devnet**

- Use devnet SOL (zero real value)
- Test all features with minimal fees
- View transactions on: https://explorer.solana.com/?cluster=devnet

✅ **Full feature testing**

- Create message tokens
- Send to any devnet wallet
- View on Solscan devnet: https://solscan.io/tx/YOUR_TX?cluster=devnet

## Example Test Flow

1. **Get devnet SOL** from faucet (free)
2. **Switch wallet to devnet** network
3. **Send a test message**:
   - Message will be created as a token
   - Fee: ~0.002 devnet SOL (very low cost)
   - Metadata uses dummy URI
4. **View on explorer**: Check transaction on Solscan devnet
5. **Repeat as many times as needed** - very low cost!

## Switching to Production

When ready to use real mainnet:

```bash
# .env changes
SOLANA_NETWORK=mainnet-beta
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
# Or use a paid RPC like Helius/QuickNode for better reliability
```

⚠️ **Production costs**:

- SOL transaction fees: ~0.00001-0.0001 SOL per message (~$0.002-$0.02)
- Token creation: ~0.002-0.004 SOL (~$0.40-$0.80)

## Troubleshooting

### "Insufficient funds" error

- Get more devnet SOL from faucet
- Wait a few seconds between airdrops

### Transaction failing

- Check you're on devnet in wallet
- Verify `SOLANA_NETWORK=devnet` in `.env`
- Try a different devnet RPC: `https://devnet.helius-rpc.com/`

### Metadata not showing

- This is normal in test mode - metadata upload is mocked
- Check console logs to see the metadata payload
- In production with real NFT.Storage key, metadata will upload

## Test Mode Features

✅ All features work exactly like production
✅ No real money spent
✅ Unlimited testing
✅ Console logging for debugging
✅ Can test with multiple wallets
✅ Full transaction history on devnet explorer

## Quick Commands

```bash
# Check devnet balance
solana balance YOUR_ADDRESS --url devnet

# Request airdrop (max 2 SOL per request)
solana airdrop 2 YOUR_ADDRESS --url devnet

# View recent transactions
solana confirm -v TRANSACTION_SIGNATURE --url devnet
```

## Notes

- Devnet can occasionally reset (rare)
- Devnet SOL has zero real value
- Test mode skips external API calls
- Production performance may vary slightly
