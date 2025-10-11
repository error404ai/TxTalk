import { z } from "zod";

// Blockchain type
export const blockchainSchema = z.enum(["solana", "bnb"]);

// Solana wallet address (base58)
export const solanaAddressSchema = z
  .string()
  .min(32, "Solana address must be at least 32 characters")
  .max(44, "Solana address must be at most 44 characters")
  .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "Invalid base58 character in Solana address");

// BNB/Ethereum wallet address (hex)
export const bnbAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid BNB/Ethereum address format");

// Flexible wallet address (either Solana or BNB)
export const walletAddressSchema = z.string().min(32, "Wallet address is required");

export const messageContentSchema = z.string().min(1, "Message cannot be empty").max(500, "Message must be at most 500 characters");

export const txSignatureSchema = z.string().min(1, "Transaction signature is required");

export const validateAddressValidation = z.object({
  address: walletAddressSchema,
  blockchain: blockchainSchema,
});

export const getEstimatedFeeValidation = z.object({
  blockchain: blockchainSchema,
});

export const createMessageTransactionValidation = z.object({
  senderPublicKey: walletAddressSchema,
  receiverAddress: walletAddressSchema,
  message: messageContentSchema,
  blockchain: blockchainSchema,
});

export const confirmMessageValidation = z.object({
  senderPublicKey: walletAddressSchema,
  receiverAddress: walletAddressSchema,
  message: messageContentSchema,
  signedTransaction: z.string().min(1, "Signed transaction is required"),
  tokenAddress: walletAddressSchema.optional(),
  blockchain: blockchainSchema,
});

export const getMessagesByWalletValidation = z.object({
  walletAddress: walletAddressSchema,
  limit: z.number().int().min(1).max(100).optional(),
  blockchain: blockchainSchema.optional(),
});

export const getMessagesOverviewValidation = z.object({
  walletAddress: walletAddressSchema,
  recentLimit: z.number().int().min(1).max(100).default(5),
  blockchain: blockchainSchema.optional(),
});

export const getMessageByTxSignatureValidation = z.object({
  txSignature: txSignatureSchema,
});
