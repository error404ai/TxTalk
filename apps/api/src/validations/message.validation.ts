import { z } from "zod";

export const walletAddressSchema = z
  .string()
  .min(32, "Wallet address must be at least 32 characters")
  .max(44, "Wallet address must be at most 44 characters")
  .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "Invalid base58 character in wallet address");

export const messageContentSchema = z.string().min(1, "Message cannot be empty").max(500, "Message must be at most 500 characters");

export const txSignatureSchema = z.string().min(1, "Transaction signature is required");

export const validateAddressInput = z.object({
  address: walletAddressSchema,
});

export const createMessageTransactionInput = z.object({
  senderPublicKey: walletAddressSchema,
  receiverAddress: walletAddressSchema,
  message: messageContentSchema,
});

export const confirmMessageInput = z.object({
  senderPublicKey: walletAddressSchema,
  receiverAddress: walletAddressSchema,
  message: messageContentSchema,
  signedTransaction: z.string().min(1, "Signed transaction is required"),
  tokenAddress: walletAddressSchema,
});

export const getMessagesByWalletInput = z.object({
  walletAddress: walletAddressSchema,
});

export const getMessageByTxSignatureInput = z.object({
  txSignature: txSignatureSchema,
});
