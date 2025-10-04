import messageService from "../services/message.service";
import { createTRPCRouter, publicProcedure } from "../trpc/trpc";
import { confirmMessageValidation, createMessageTransactionValidation, getMessageByTxSignatureValidation, getMessagesByWalletValidation, validateAddressValidation } from "../validations/message.validation";

export const messageRouter = createTRPCRouter({
  validateAddress: publicProcedure.input(validateAddressValidation).query(async ({ input }) => {
    return await messageService.validateAddress(input.address);
  }),

  getEstimatedFee: publicProcedure.query(async () => {
    const fee = await messageService.getEstimatedFee();
    return { fee };
  }),

  createMessageTransaction: publicProcedure.input(createMessageTransactionValidation).mutation(async ({ input }) => {
    return await messageService.createMessageTransaction(input);
  }),

  confirmMessage: publicProcedure.input(confirmMessageValidation).mutation(async ({ input }) => {
    return await messageService.confirmMessage(input);
  }),

  getSentMessages: publicProcedure.input(getMessagesByWalletValidation).query(async ({ input }) => {
    return await messageService.getSentMessages(input.walletAddress);
  }),

  getReceivedMessages: publicProcedure.input(getMessagesByWalletValidation).query(async ({ input }) => {
    return await messageService.getReceivedMessages(input.walletAddress);
  }),

  getAllMessages: publicProcedure.input(getMessagesByWalletValidation).query(async ({ input }) => {
    return await messageService.getAllMessages(input.walletAddress);
  }),

  getMessageByTxSignature: publicProcedure.input(getMessageByTxSignatureValidation).query(async ({ input }) => {
    return await messageService.getMessageByTxSignature(input.txSignature);
  }),
});
