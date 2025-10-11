import { ethers } from "ethers";
import envConfig from "../config/envConfig";

export interface SendBnbMessageParams {
  senderAddress: string;
  receiverAddress: string;
  message: string;
  signedTransaction: string;
}

export interface CreateBnbTransactionResult {
  transaction: {
    to: string;
    value: string;
    data: string;
    gasLimit: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
  };
  messageHash: string;
}

class BnbService {
  private provider: ethers.JsonRpcProvider;
  private readonly MESSAGE_FEE_BNB = "0.0001"; // Small fee in BNB

  constructor() {
    this.provider = new ethers.JsonRpcProvider(envConfig.BNB_RPC_URL);
  }

  /**
   * Validates if a given string is a valid BNB/Ethereum wallet address
   */
  async validateWalletAddress(address: string): Promise<boolean> {
    try {
      return ethers.isAddress(address);
    } catch (error) {
      console.error("Error validating BNB address:", error);
      return false;
    }
  }

  /**
   * Estimates the fee for sending a message on BNB Chain
   */
  async estimateFee(): Promise<number> {
    try {
      const feeData = await this.provider.getFeeData();
      const gasLimit = 21000n + 5000n; // Base transfer + extra for data

      let estimatedFee = 0n;

      if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        // EIP-1559 transaction
        estimatedFee = (feeData.maxFeePerGas + feeData.maxPriorityFeePerGas) * gasLimit;
      } else if (feeData.gasPrice) {
        // Legacy transaction
        estimatedFee = feeData.gasPrice * gasLimit;
      }

      // Add the message fee
      const messageFee = ethers.parseEther(this.MESSAGE_FEE_BNB);
      estimatedFee += messageFee;

      // Convert to BNB (as a number)
      return parseFloat(ethers.formatEther(estimatedFee));
    } catch (error) {
      console.error("Error estimating BNB fee:", error);
      // Return a default estimate
      return 0.001;
    }
  }

  /**
   * Creates unsigned transaction for client-side signing
   */
  async createMessageTransaction(params: { senderAddress: string; receiverAddress: string; message: string }): Promise<CreateBnbTransactionResult> {
    const { senderAddress, receiverAddress, message } = params;

    // Validate addresses
    if (!ethers.isAddress(senderAddress)) {
      throw new Error("Invalid sender address");
    }
    if (!ethers.isAddress(receiverAddress)) {
      throw new Error("Invalid receiver address");
    }

    // Encode message in transaction data
    const messageData = ethers.hexlify(ethers.toUtf8Bytes(message));

    // Get current gas prices
    const feeData = await this.provider.getFeeData();

    // Create transaction object
    const transaction: CreateBnbTransactionResult["transaction"] = {
      to: receiverAddress,
      value: ethers.parseEther(this.MESSAGE_FEE_BNB).toString(),
      data: messageData,
      gasLimit: "26000", // 21000 base + ~5000 for data
    };

    // Add EIP-1559 fields if supported
    if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
      transaction.maxFeePerGas = feeData.maxFeePerGas.toString();
      transaction.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas.toString();
    }

    // Create a hash of the message for verification
    const messageHash = ethers.keccak256(ethers.toUtf8Bytes(message));

    return {
      transaction,
      messageHash,
    };
  }

  /**
   * Sends a pre-signed transaction to the network
   */
  async sendSignedTransaction(signedTransactionHex: string): Promise<{
    txHash: string;
    feePaid: number;
  }> {
    try {
      // Send the signed transaction
      const txResponse = await this.provider.broadcastTransaction(signedTransactionHex);

      // Wait for confirmation
      const receipt = await txResponse.wait();

      if (!receipt) {
        throw new Error("Transaction receipt is null");
      }

      // Calculate actual fee paid
      const gasUsed = receipt.gasUsed;
      const effectiveGasPrice = receipt.gasPrice || 0n;
      const gasFee = gasUsed * effectiveGasPrice;

      // Add the message fee (value transferred)
      const messageFee = ethers.parseEther(this.MESSAGE_FEE_BNB);
      const totalFee = gasFee + messageFee;

      const feePaid = parseFloat(ethers.formatEther(totalFee));

      return {
        txHash: receipt.hash,
        feePaid,
      };
    } catch (error) {
      console.error("Error sending signed BNB transaction:", error);
      throw new Error(`Failed to send BNB transaction: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get transaction details from hash
   */
  async getTransactionDetails(txHash: string) {
    try {
      const tx = await this.provider.getTransaction(txHash);
      return tx;
    } catch (error) {
      console.error("Error getting BNB transaction details:", error);
      return null;
    }
  }

  /**
   * Decode message from transaction data
   */
  decodeMessageFromTx(data: string): string | null {
    try {
      if (!data || data === "0x") return null;
      return ethers.toUtf8String(data);
    } catch (error) {
      console.error("Error decoding message from BNB transaction:", error);
      return null;
    }
  }

  /**
   * Get BscScan link for transaction
   */
  getBscScanLink(txHash: string): string {
    const network = envConfig.BNB_NETWORK || "testnet";
    if (network === "mainnet") {
      return `https://bscscan.com/tx/${txHash}`;
    }
    return `https://testnet.bscscan.com/tx/${txHash}`;
  }

  /**
   * Get provider instance
   */
  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  /**
   * Get current BNB price in USD (optional, for display)
   */
  async getBnbPrice(): Promise<{ usd: number; change24h: number } | null> {
    try {
      const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd&include_24hr_change=true");
      const data = await response.json();
      if (data.binancecoin) {
        return {
          usd: data.binancecoin.usd,
          change24h: data.binancecoin.usd_24h_change,
        };
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch BNB price:", error);
      return null;
    }
  }
}

export default new BnbService();
