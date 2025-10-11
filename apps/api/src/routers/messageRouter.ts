import messageService from "../services/message.service";
import { createTRPCRouter, publicProcedure } from "../trpc/trpc";
import { confirmMessageValidation, createMessageTransactionValidation, getEstimatedFeeValidation, getMessageByTxSignatureValidation, getMessagesByWalletValidation, getMessagesOverviewValidation, validateAddressValidation } from "../validations/message.validation";

export const messageRouter = createTRPCRouter({
  validateAddress: publicProcedure.input(validateAddressValidation).query(async ({ input }) => {
    console.log(`Validating ${input.blockchain} address:`, input.address);
    return await messageService.validateAddress(input.address, input.blockchain);
  }),

  getEstimatedFee: publicProcedure.input(getEstimatedFeeValidation).query(async ({ input }) => {
    const fee = await messageService.getEstimatedFee(input.blockchain);
    return { fee };
  }),

  createMessageTransaction: publicProcedure.input(createMessageTransactionValidation).mutation(async ({ input }) => {
    return await messageService.createMessageTransaction(input);
  }),

  confirmMessage: publicProcedure.input(confirmMessageValidation).mutation(async ({ input }) => {
    return await messageService.confirmMessage(input);
  }),

  getMessagesOverview: publicProcedure.input(getMessagesOverviewValidation).query(async ({ input }) => {
    return await messageService.getMessagesOverview(input.walletAddress, input.recentLimit);
  }),

  getSentMessages: publicProcedure.input(getMessagesByWalletValidation).query(async ({ input }) => {
    return await messageService.getSentMessages(input.walletAddress, input.limit);
  }),

  getReceivedMessages: publicProcedure.input(getMessagesByWalletValidation).query(async ({ input }) => {
    return await messageService.getReceivedMessages(input.walletAddress, input.limit);
  }),

  getAllMessages: publicProcedure.input(getMessagesByWalletValidation).query(async ({ input }) => {
    const messages = await messageService.getAllMessages(input.walletAddress, input.limit);
    return { messages };
  }),

  getMessageByTxSignature: publicProcedure.input(getMessageByTxSignatureValidation).query(async ({ input }) => {
    return await messageService.getMessageByTxSignature(input.txSignature);
  }),
});
