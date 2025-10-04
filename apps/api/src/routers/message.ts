import messageService from "../services/message.service";
import { createTRPCRouter, publicProcedure } from "../trpc/trpc";
import { confirmMessageInput, createMessageTransactionInput, getMessageByTxSignatureInput, getMessagesByWalletInput, validateAddressInput } from "../validations/message.validation";

export const messageRouter = createTRPCRouter({
  validateAddress: publicProcedure.input(validateAddressInput).query(async ({ input }) => {
    return await messageService.validateAddress(input.address);
  }),

  getEstimatedFee: publicProcedure.query(async () => {
    const fee = await messageService.getEstimatedFee();
    return { fee };
  }),

  createMessageTransaction: publicProcedure.input(createMessageTransactionInput).mutation(async ({ input }) => {
    return await messageService.createMessageTransaction(input);
  }),

  confirmMessage: publicProcedure.input(confirmMessageInput).mutation(async ({ input }) => {
    return await messageService.confirmMessage(input);
  }),

  getSentMessages: publicProcedure.input(getMessagesByWalletInput).query(async ({ input }) => {
    return await messageService.getSentMessages(input.walletAddress);
  }),

  getReceivedMessages: publicProcedure.input(getMessagesByWalletInput).query(async ({ input }) => {
    return await messageService.getReceivedMessages(input.walletAddress);
  }),

  getAllMessages: publicProcedure.input(getMessagesByWalletInput).query(async ({ input }) => {
    return await messageService.getAllMessages(input.walletAddress);
  }),

  getMessageByTxSignature: publicProcedure.input(getMessageByTxSignatureInput).query(async ({ input }) => {
    return await messageService.getMessageByTxSignature(input.txSignature);
  }),
});
