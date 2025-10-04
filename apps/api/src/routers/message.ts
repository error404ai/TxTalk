import { z } from "zod";
import messageService from "../services/message.service.js";
import { createTRPCRouter, publicProcedure } from "../trpc/trpc.js";

export const messageRouter = createTRPCRouter({
  /**
   * Validate a Solana wallet address
   */
  validateAddress: publicProcedure
    .input(
      z.object({
        address: z.string().min(32).max(44),
      })
    )
    .mutation(async ({ input }) => {
      return await messageService.validateAddress(input.address);
    }),

  /**
   * Get estimated fee for sending a message
   */
  getEstimatedFee: publicProcedure.query(async () => {
    const fee = await messageService.getEstimatedFee();
    return { fee };
  }),

  /**
   * Create an unsigned transaction for message sending
   * Client will sign this transaction with their wallet
   */
  createMessageTransaction: publicProcedure
    .input(
      z.object({
        senderPublicKey: z.string().min(32).max(44),
        receiverAddress: z.string().min(32).max(44),
        message: z.string().min(1).max(500),
      })
    )
    .mutation(async ({ input }) => {
      return await messageService.createMessageTransaction(input);
    }),

  /**
   * Confirm and save message after transaction is signed
   */
  confirmMessage: publicProcedure
    .input(
      z.object({
        senderPublicKey: z.string().min(32).max(44),
        receiverAddress: z.string().min(32).max(44),
        message: z.string().min(1).max(500),
        signedTransaction: z.string(),
        tokenAddress: z.string().min(32).max(44),
      })
    )
    .mutation(async ({ input }) => {
      return await messageService.confirmMessage(input);
    }),

  /**
   * Get messages sent by a wallet
   */
  getSentMessages: publicProcedure
    .input(
      z.object({
        walletAddress: z.string().min(32).max(44),
      })
    )
    .query(async ({ input }) => {
      return await messageService.getSentMessages(input.walletAddress);
    }),

  /**
   * Get messages received by a wallet
   */
  getReceivedMessages: publicProcedure
    .input(
      z.object({
        walletAddress: z.string().min(32).max(44),
      })
    )
    .query(async ({ input }) => {
      return await messageService.getReceivedMessages(input.walletAddress);
    }),

  /**
   * Get all messages for a wallet (sent and received)
   */
  getAllMessages: publicProcedure
    .input(
      z.object({
        walletAddress: z.string().min(32).max(44),
      })
    )
    .query(async ({ input }) => {
      return await messageService.getAllMessages(input.walletAddress);
    }),

  /**
   * Get message by transaction signature
   */
  getMessageByTxSignature: publicProcedure
    .input(
      z.object({
        txSignature: z.string(),
      })
    )
    .query(async ({ input }) => {
      return await messageService.getMessageByTxSignature(input.txSignature);
    }),
});
