import { AppDataSource } from "../database";
import { Message } from "../entities/Message";
import bnbService from "./bnb.service";
import solanaService from "./solana.service";

export interface CreateMessageTransactionParams {
  senderPublicKey: string;
  receiverAddress: string;
  message: string;
  blockchain: "solana" | "bnb";
}

export interface ConfirmMessageParams {
  senderPublicKey: string;
  receiverAddress: string;
  message: string;
  signedTransaction: string;
  tokenAddress?: string;
  blockchain: "solana" | "bnb";
}

export interface MessageSummary {
  id: string;
  blockchain: string;
  sender: string;
  receiver: string;
  message: string;
  txSignature: string;
  tokenAddress: string | null;
  feePaid: number;
  createdAt: Date;
  explorerLink: string;
}

class MessageService {
  private messageRepository = AppDataSource.getRepository(Message);

  private mapToSummary(message: Message): MessageSummary {
    const explorerLink = message.blockchain === "bnb" ? bnbService.getBscScanLink(message.txSignature) : solanaService.getSolscanLink(message.txSignature);

    return {
      id: message.id,
      blockchain: message.blockchain,
      sender: message.sender,
      receiver: message.receiver,
      message: message.message,
      txSignature: message.txSignature,
      tokenAddress: message.tokenAddress ?? null,
      feePaid: message.feePaid,
      createdAt: message.createdAt,
      explorerLink,
    };
  }

  /**
   * Validate wallet address for a specific blockchain
   */
  async validateAddress(address: string, blockchain: "solana" | "bnb"): Promise<{ valid: boolean; error?: string }> {
    console.log(`Validating ${blockchain} address:`, address);

    let isValid = false;
    if (blockchain === "solana") {
      isValid = await solanaService.validateWalletAddress(address);
    } else if (blockchain === "bnb") {
      isValid = await bnbService.validateWalletAddress(address);
    }

    if (!isValid) {
      return { valid: false, error: `Invalid ${blockchain === "solana" ? "Solana" : "BNB"} wallet address` };
    }
    return { valid: true };
  }

  /**
   * Get estimated fee for sending message on a specific blockchain
   */
  async getEstimatedFee(blockchain: "solana" | "bnb"): Promise<number> {
    if (blockchain === "solana") {
      return await solanaService.estimateFee();
    } else {
      return await bnbService.estimateFee();
    }
  }

  /**
   * Create unsigned transaction for message sending
   * Returns the transaction for client-side signing
   */
  async createMessageTransaction(params: CreateMessageTransactionParams): Promise<any> {
    const { senderPublicKey, receiverAddress, message, blockchain } = params;

    // Validate inputs
    if (!message || message.trim().length === 0) {
      throw new Error("Message cannot be empty");
    }

    if (message.length > 500) {
      throw new Error("Message is too long (max 500 characters)");
    }

    // Validate receiver address
    const receiverValidation = await this.validateAddress(receiverAddress, blockchain);
    if (!receiverValidation.valid) {
      throw new Error(receiverValidation.error || "Invalid receiver address");
    }

    // Validate sender address
    const senderValidation = await this.validateAddress(senderPublicKey, blockchain);
    if (!senderValidation.valid) {
      throw new Error("Invalid sender address");
    }

    // Get estimated fee
    const estimatedFee = await this.getEstimatedFee(blockchain);

    if (blockchain === "solana") {
      // Create Solana transaction
      const { transaction, mintKeypair, metadataUri } = await solanaService.createMessageTransaction({
        senderPublicKey,
        receiverAddress,
        message,
      });

      return {
        transaction,
        mintKeypair,
        metadataUri,
        estimatedFee,
        blockchain: "solana",
      };
    } else {
      // Create BNB transaction
      const { transaction, messageHash } = await bnbService.createMessageTransaction({
        senderAddress: senderPublicKey,
        receiverAddress,
        message,
      });

      return {
        transaction,
        messageHash,
        estimatedFee,
        blockchain: "bnb",
      };
    }
  }

  /**
   * Confirm and save message after transaction is signed and sent
   */
  async confirmMessage(params: ConfirmMessageParams): Promise<MessageSummary> {
    const { senderPublicKey, receiverAddress, message, signedTransaction, tokenAddress, blockchain } = params;

    let txSignature: string;
    let feePaid: number;

    if (blockchain === "solana") {
      // Send Solana transaction
      const result = await solanaService.sendSignedTransaction(signedTransaction);
      txSignature = result.txSignature;
      feePaid = result.feePaid;
    } else {
      // Send BNB transaction
      const result = await bnbService.sendSignedTransaction(signedTransaction);
      txSignature = result.txHash;
      feePaid = result.feePaid;
    }

    // Save to database
    const messageEntity = this.messageRepository.create({
      blockchain,
      sender: senderPublicKey,
      receiver: receiverAddress,
      message,
      txSignature,
      tokenAddress: tokenAddress || null,
      feePaid,
    });

    await this.messageRepository.save(messageEntity);

    return this.mapToSummary(messageEntity);
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
