import { AppDataSource } from "../database";
import { Message } from "../entities/Message";
import solanaService from "./solana.service";

export interface CreateMessageTransactionParams {
  senderPublicKey: string;
  receiverAddress: string;
  message: string;
}

export interface ConfirmMessageParams {
  senderPublicKey: string;
  receiverAddress: string;
  message: string;
  signedTransaction: string;
  tokenAddress: string;
}

export interface MessageSummary {
  id: string;
  sender: string;
  receiver: string;
  message: string;
  txSignature: string;
  tokenAddress: string | null;
  feePaid: number;
  createdAt: Date;
  solscanLink: string;
}

class MessageService {
  private messageRepository = AppDataSource.getRepository(Message);

  private mapToSummary(message: Message): MessageSummary {
    return {
      id: message.id,
      sender: message.sender,
      receiver: message.receiver,
      message: message.message,
      txSignature: message.txSignature,
      tokenAddress: message.tokenAddress ?? null,
      feePaid: message.feePaid,
      createdAt: message.createdAt,
      solscanLink: solanaService.getSolscanLink(message.txSignature),
    };
  }

  /**
   * Validate wallet address
   */
  async validateAddress(address: string): Promise<{ valid: boolean; error?: string }> {
    console.log("Validating address:", address);
    const isValid = await solanaService.validateWalletAddress(address);
    if (!isValid) {
      return { valid: false, error: "Invalid Solana wallet address" };
    }
    return { valid: true };
  }

  /**
   * Get estimated fee for sending message
   */
  async getEstimatedFee(): Promise<number> {
    return await solanaService.estimateFee();
  }

  /**
   * Create unsigned transaction for message sending
   * Returns the transaction for client-side signing
   */
  async createMessageTransaction(params: CreateMessageTransactionParams): Promise<{
    transaction: string;
    mintKeypair: { publicKey: string; secretKey: string };
    metadataUri: string | null;
    estimatedFee: number;
  }> {
    const { senderPublicKey, receiverAddress, message } = params;

    // Validate inputs
    if (!message || message.trim().length === 0) {
      throw new Error("Message cannot be empty");
    }

    if (message.length > 500) {
      throw new Error("Message is too long (max 500 characters)");
    }

    // Validate receiver address
    const receiverValidation = await this.validateAddress(receiverAddress);
    if (!receiverValidation.valid) {
      throw new Error(receiverValidation.error || "Invalid receiver address");
    }

    // Validate sender address
    const senderValidation = await this.validateAddress(senderPublicKey);
    if (!senderValidation.valid) {
      throw new Error("Invalid sender address");
    }

    // Create transaction
    const { transaction, mintKeypair, metadataUri } = await solanaService.createMessageTransaction({
      senderPublicKey,
      receiverAddress,
      message,
    });

    // Get estimated fee
    const estimatedFee = await this.getEstimatedFee();

    return {
      transaction,
      mintKeypair,
      metadataUri,
      estimatedFee,
    };
  }

  /**
   * Confirm and save message after transaction is signed and sent
   */
  async confirmMessage(params: ConfirmMessageParams): Promise<MessageSummary> {
    const { senderPublicKey, receiverAddress, message, signedTransaction, tokenAddress } = params;

    // Send the signed transaction
    const { txSignature, feePaid } = await solanaService.sendSignedTransaction(signedTransaction);

    // Save to database
    const messageEntity = this.messageRepository.create({
      sender: senderPublicKey,
      receiver: receiverAddress,
      message,
      txSignature,
      tokenAddress,
      feePaid,
    });

    await this.messageRepository.save(messageEntity);

    // Return summary
    return {
      id: messageEntity.id,
      sender: messageEntity.sender,
      receiver: messageEntity.receiver,
      message: messageEntity.message,
      txSignature: messageEntity.txSignature,
      tokenAddress: messageEntity.tokenAddress ?? null,
      feePaid: messageEntity.feePaid,
      createdAt: messageEntity.createdAt,
      solscanLink: solanaService.getSolscanLink(txSignature),
    };
  }

  /**
   * Get messages sent by a wallet
   */
  async getSentMessages(walletAddress: string, limit?: number): Promise<MessageSummary[]> {
    const findOpts: any = {
      where: { sender: walletAddress },
      order: { createdAt: "DESC" },
    };
    if (limit) findOpts.take = limit;
    const messages = await this.messageRepository.find(findOpts);

    return messages.map((msg) => this.mapToSummary(msg));
  }

  /**
   * Get messages received by a wallet
   */
  async getReceivedMessages(walletAddress: string, limit?: number): Promise<MessageSummary[]> {
    const findOpts: any = {
      where: { receiver: walletAddress },
      order: { createdAt: "DESC" },
    };
    if (limit) findOpts.take = limit;
    const messages = await this.messageRepository.find(findOpts);

    return messages.map((msg) => this.mapToSummary(msg));
  }

  /**
   * Get all messages for a wallet (sent and received)
   */
  async getAllMessages(walletAddress: string, limit?: number): Promise<MessageSummary[]> {
    const findOpts: any = {
      where: [{ sender: walletAddress }, { receiver: walletAddress }],
      order: { createdAt: "DESC" },
    };
    if (limit) findOpts.take = limit;

    const messages = await this.messageRepository.find(findOpts);

    return messages.map((msg) => this.mapToSummary(msg));
  }

  async getMessagesOverview(
    walletAddress: string,
    recentLimit: number
  ): Promise<{
    recent: MessageSummary[];
    totals: { sent: number; received: number; combined: number };
  }> {
    const [recentMessages, sentCount, receivedCount] = await Promise.all([this.getAllMessages(walletAddress, recentLimit), this.messageRepository.count({ where: { sender: walletAddress } }), this.messageRepository.count({ where: { receiver: walletAddress } })]);

    return {
      recent: recentMessages,
      totals: {
        sent: sentCount,
        received: receivedCount,
        combined: sentCount + receivedCount,
      },
    };
  }

  /**
   * Get message by transaction signature
   */
  async getMessageByTxSignature(txSignature: string): Promise<MessageSummary | null> {
    const message = await this.messageRepository.findOne({
      where: { txSignature },
    });

    if (!message) {
      return null;
    }

    return this.mapToSummary(message);
  }
}

export default new MessageService();
