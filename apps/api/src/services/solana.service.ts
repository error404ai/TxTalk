import { createAssociatedTokenAccountInstruction, createInitializeMint2Instruction, createMintToInstruction, getAssociatedTokenAddress, getMinimumBalanceForRentExemptMint, getMintLen, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import bs58 from "bs58";
import envConfig from "../config/envConfig.js";

export interface MintMessageTokenResult {
  tokenAddress: string;
  txSignature: string;
  feePaid: number;
}

export interface SendMessageParams {
  senderPublicKey: string;
  receiverAddress: string;
  message: string;
  signedTransaction: string;
}

class SolanaService {
  private connection: Connection;
  private payerKeypair: Keypair | null = null;

  constructor() {
    this.connection = new Connection(envConfig.SOLANA_RPC_URL, "confirmed");

    // Initialize payer keypair if private key is provided (for server-side signing)
    if (envConfig.SOLANA_PAYER_PRIVATE_KEY) {
      try {
        const privateKeyArray = bs58.decode(envConfig.SOLANA_PAYER_PRIVATE_KEY);
        this.payerKeypair = Keypair.fromSecretKey(privateKeyArray);
      } catch (error) {
        console.warn("⚠️ Invalid SOLANA_PAYER_PRIVATE_KEY provided. Server-side signing disabled.");
      }
    }
  }

  /**
   * Validates if a given string is a valid Solana wallet address
   */
  async validateWalletAddress(address: string): Promise<boolean> {
    const publicKey = new PublicKey(address);
    return PublicKey.isOnCurve(publicKey.toBuffer());
  }

  /**
   * Estimates the fee for sending a message token
   */
  async estimateFee(): Promise<number> {
    const recentBlockhash = await this.connection.getLatestBlockhash();
    const estimatedFee = 0.002;

    return estimatedFee;
  }

  /**
   * Creates unsigned transaction for client-side signing
   * This is the preferred method for web3 wallets
   */
  async createMessageTransaction(params: { senderPublicKey: string; receiverAddress: string; message: string }): Promise<{
    transaction: string; // Base64 encoded transaction
    mintKeypair: { publicKey: string; secretKey: string };
  }> {
    const { senderPublicKey, receiverAddress, message } = params;

    // Validate addresses
    const isReceiverValid = await this.validateWalletAddress(receiverAddress);
    if (!isReceiverValid) {
      throw new Error("Invalid receiver wallet address");
    }

    const sender = new PublicKey(senderPublicKey);
    const receiver = new PublicKey(receiverAddress);

    // Generate a new keypair for the token mint
    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;

    // Get the associated token account address for the receiver
    const receiverTokenAccount = await getAssociatedTokenAddress(mint, receiver, false, TOKEN_PROGRAM_ID);

    // Get recent blockhash
    const { blockhash } = await this.connection.getLatestBlockhash();

    // Calculate rent exemption
    const mintLen = getMintLen([]);
    const lamports = await getMinimumBalanceForRentExemptMint(this.connection);

    const transaction = new Transaction();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = sender;

    // 1. Create mint account
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: sender,
        newAccountPubkey: mint,
        space: mintLen,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      })
    );

    // 2. Initialize mint (0 decimals, supply of 1)
    transaction.add(
      createInitializeMint2Instruction(
        mint,
        0, // 0 decimals
        sender, // mint authority
        sender, // freeze authority
        TOKEN_PROGRAM_ID
      )
    );

    // 3. Create associated token account for receiver
    transaction.add(
      createAssociatedTokenAccountInstruction(
        sender, // payer
        receiverTokenAccount, // associated token account
        receiver, // owner
        mint, // mint
        TOKEN_PROGRAM_ID
      )
    );

    // 4. Mint 1 token to receiver
    transaction.add(
      createMintToInstruction(
        mint,
        receiverTokenAccount,
        sender, // mint authority
        1, // amount (1 token with 0 decimals)
        [],
        TOKEN_PROGRAM_ID
      )
    );

    // Note: We're skipping metadata creation for simplicity
    // The token name in wallet explorers will show the mint address
    // The message is stored in our database for retrieval

    // Partial sign with mint keypair
    transaction.partialSign(mintKeypair);

    // Serialize transaction for client-side signing
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    return {
      transaction: serializedTransaction.toString("base64"),
      mintKeypair: {
        publicKey: mintKeypair.publicKey.toBase58(),
        secretKey: bs58.encode(mintKeypair.secretKey),
      },
    };
  }

  /**
   * Sends a pre-signed transaction to the network
   */
  async sendSignedTransaction(signedTransactionBase64: string): Promise<{
    txSignature: string;
    feePaid: number;
  }> {
    try {
      // Decode the signed transaction
      const signedTransaction = Transaction.from(Buffer.from(signedTransactionBase64, "base64"));

      // Send transaction
      const signature = await this.connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });

      // Confirm transaction
      await this.connection.confirmTransaction(signature, "confirmed");

      // Get transaction details to calculate actual fee
      const txDetails = await this.connection.getTransaction(signature, {
        commitment: "confirmed",
      });

      const feePaid = txDetails?.meta?.fee ? txDetails.meta.fee / LAMPORTS_PER_SOL : 0;

      return {
        txSignature: signature,
        feePaid,
      };
    } catch (error) {
      console.error("Error sending signed transaction:", error);
      throw new Error(`Failed to send transaction: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get transaction details from signature
   */
  async getTransactionDetails(signature: string) {
    try {
      const tx = await this.connection.getTransaction(signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      return tx;
    } catch (error) {
      console.error("Error getting transaction details:", error);
      return null;
    }
  }

  /**
   * Get Solscan link for transaction
   */
  getSolscanLink(signature: string): string {
    const network = envConfig.SOLANA_NETWORK === "mainnet-beta" ? "" : `?cluster=${envConfig.SOLANA_NETWORK}`;
    return `https://solscan.io/tx/${signature}${network}`;
  }

  /**
   * Get connection instance
   */
  getConnection(): Connection {
    return this.connection;
  }
}

export default new SolanaService();
