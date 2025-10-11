# BNB Integration Setup

## WalletConnect Project ID

To enable BNB wallet connections, you need to get a WalletConnect Project ID:

1. Visit https://cloud.walletconnect.com
2. Sign up or log in
3. Create a new project
4. Copy your Project ID
5. Replace `YOUR_WALLETCONNECT_PROJECT_ID` in `/apps/frontend/src/components/providers/BnbWalletProvider.tsx` with your actual Project ID

## Environment Variables

Make sure you have the following environment variables set in both `/apps/api/.env` and `/apps/frontend/.env`:

### API (.env)

```
BNB_NETWORK=testnet
BNB_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
```

For mainnet:

```
BNB_NETWORK=mainnet
BNB_RPC_URL=https://bsc-dataseed1.binance.org
```

### Frontend (.env)

```
VITE_BNB_NETWORK=testnet
VITE_BNB_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
```

## Database Migration

The database schema has been updated to include a `blockchain` column in the `messages` table. If you have an existing database, you may need to run migrations or manually update the schema.

The new field:

- `blockchain` VARCHAR(20) DEFAULT 'solana'

## Testing

1. Switch between Solana and BNB using the chain switcher in the header
2. Connect your wallet (Phantom/Solflare for Solana, MetaMask/TrustWallet for BNB)
3. Send a test message
4. Verify the transaction on the respective block explorer (Solscan for Solana, BscScan for BNB)
