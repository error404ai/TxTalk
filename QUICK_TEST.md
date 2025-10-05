# 🧪 Quick Test Setup (Free)

## Enable Test Mode - No Real Money Needed!

1. **Update your `.env` file** in `apps/api/`:

```bash
# Copy from .env.example if needed
cp apps/api/.env.example apps/api/.env
```

2. **Make sure these are set**:

```bash
TEST_MODE=true
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
```

3. **Get FREE devnet SOL** (test money):

Visit: **https://faucet.solana.com/**

- Enter your wallet address
- Select "Devnet"
- Get 1-2 SOL (completely free, unlimited airdrops)

4. **Switch your wallet to Devnet**:

- Open Phantom/Solflare
- Settings → Network → **Devnet**

5. **Start testing**:

```bash
pnpm dev
```

## What You Get in Test Mode:

✅ **No NFT.Storage costs** - uploads are mocked  
✅ **Free devnet SOL** - unlimited from faucet  
✅ **Zero real money spent** - test forever!  
✅ **Full features** - everything works the same  
✅ **Transaction history** - view on devnet explorer

## View Your Test Transactions:

- Solscan Devnet: `https://solscan.io/tx/YOUR_TX?cluster=devnet`
- Solana Explorer: `https://explorer.solana.com/?cluster=devnet`

---

For detailed testing guide, see `TESTING.md`
