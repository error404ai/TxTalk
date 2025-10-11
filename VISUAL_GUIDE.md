# Visual Guide - BNB Integration

## UI Changes

### Header - Chain Switcher

```
Before:
[Logo] TxTalk          [SOL Price] [Connect Wallet]

After:
[Logo] TxTalk    [Solana|BNB] [SOL/BNB Price] [Connect Wallet]
                     ↑
                 NEW: Chain Switcher!
```

### Message Sending

```
1. Select blockchain: Solana or BNB
2. Type your message
3. Paste wallet address (auto-detects format)
   - Solana: Base58 (e.g., 7Xm...abc)
   - BNB: Hex (e.g., 0x123...def)
4. Click Send
5. Sign with appropriate wallet
6. Message sent on selected chain!
```

### Message History

```
Each message now shows:
- Message content
- Sender/Receiver addresses
- Blockchain type (Solana/BNB)
- Explorer link (Solscan or BscScan)
```

## Code Structure

### Backend Flow

```
API Request with blockchain parameter
    ↓
messageRouter.ts
    ↓
message.service.ts (checks blockchain type)
    ↓
    ├─→ solana.service.ts (if Solana)
    └─→ bnb.service.ts (if BNB)
    ↓
Database (saves with blockchain field)
```

### Frontend Flow

```
User selects blockchain
    ↓
BlockchainProvider updates context
    ↓
    ├─→ SolanaWalletProvider (if Solana)
    └─→ BnbWalletProvider (if BNB)
    ↓
User connects wallet
    ↓
User sends message
    ↓
tRPC call with blockchain parameter
    ↓
Transaction signed and sent
```

## Database Schema

### messages Table

```sql
CREATE TABLE messages (
  id VARCHAR(36) PRIMARY KEY,
  blockchain VARCHAR(20) DEFAULT 'solana',  -- NEW!
  sender VARCHAR(100),
  receiver VARCHAR(100),
  message TEXT,
  txSignature VARCHAR(150),  -- Increased from 100
  tokenAddress VARCHAR(100) NULLABLE,
  feePaid DECIMAL(20,9),
  createdAt TIMESTAMP
);
```

## Transaction Comparison

### Solana Message Transaction

```
1. Create new SPL token mint
2. Add metadata with message
3. Send 1 token to receiver
4. Total: ~0.001-0.002 SOL
```

### BNB Message Transaction

```
1. Send small BNB amount (0.0001 BNB)
2. Include message in transaction data field
3. Total: ~0.0002-0.0005 BNB (gas + transfer)
```

## Wallet Support Matrix

| Chain  | Wallets Supported                                         |
| ------ | --------------------------------------------------------- |
| Solana | Phantom, Solflare, Slope, Backpack, etc.                  |
| BNB    | MetaMask, TrustWallet, Coinbase Wallet, via WalletConnect |

## API Endpoints (Updated)

All message endpoints now accept `blockchain` parameter:

```typescript
// Validate address
POST /validateAddress
Body: { address: string, blockchain: "solana" | "bnb" }

// Get fee estimate
GET /getEstimatedFee?blockchain=solana
GET /getEstimatedFee?blockchain=bnb

// Create transaction
POST /createMessageTransaction
Body: {
  senderPublicKey: string,
  receiverAddress: string,
  message: string,
  blockchain: "solana" | "bnb"
}

// Confirm message
POST /confirmMessage
Body: {
  senderPublicKey: string,
  receiverAddress: string,
  message: string,
  signedTransaction: string,
  blockchain: "solana" | "bnb",
  tokenAddress?: string  // Only for Solana
}

// Get messages (filters both chains by default)
GET /getMessagesOverview?walletAddress=xxx
GET /getAllMessages?walletAddress=xxx
```

## Environment Variables Reference

### Development

```bash
# API
BNB_NETWORK=testnet
BNB_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545

# Frontend
VITE_BNB_NETWORK=testnet
VITE_BNB_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
```

### Production

```bash
# API
BNB_NETWORK=mainnet
BNB_RPC_URL=https://bsc-dataseed1.binance.org

# Frontend
VITE_BNB_NETWORK=mainnet
VITE_BNB_RPC_URL=https://bsc-dataseed1.binance.org
```

## Error Handling

The system handles:

- ✅ Invalid addresses (per blockchain)
- ✅ Insufficient funds
- ✅ Network errors
- ✅ User rejection
- ✅ Transaction failures
- ✅ Wallet not connected

All errors show user-friendly messages!

## Performance

### Message Loading

- Fetches from both chains simultaneously
- Merged and sorted by timestamp
- Efficient database queries

### Wallet Switching

- Instant UI update
- Auto-disconnects previous wallet
- Preserves user preferences

## Security

- ✅ Client-side transaction signing (never sends private keys)
- ✅ Address validation before sending
- ✅ Fee estimation before confirmation
- ✅ Transaction hash verification
- ✅ Type-safe API with Zod validation
- ✅ No server-side key storage required

---

**That's it!** Your app now supports multi-chain messaging with a beautiful, unified interface!
