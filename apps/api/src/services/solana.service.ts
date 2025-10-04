import { createCreateMetadataAccountV3Instruction, PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { createAssociatedTokenAccountInstruction, createInitializeMint2Instruction, createMintToInstruction, getAssociatedTokenAddress, getMinimumBalanceForRentExemptMint, getMintLen, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import bs58 from "bs58";
import envConfig from "../config/envConfig";

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
  private static readonly METADATA_NAME_BYTE_LIMIT = 32;

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
    if (this.payerKeypair) {
      return 0;
    }

    await this.connection.getLatestBlockhash();
    return 0.002;
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
    const payerKeypair = this.payerKeypair;
    const payerPublicKey = payerKeypair?.publicKey ?? sender;

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
    transaction.feePayer = payerPublicKey;

    // 1. Create mint account
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: payerPublicKey,
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

    // 3. Attach metadata so the token name reflects the message
    const [metadataPda] = PublicKey.findProgramAddressSync([Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()], TOKEN_METADATA_PROGRAM_ID);

    transaction.add(
      createCreateMetadataAccountV3Instruction(
        {
          metadata: metadataPda,
          mint,
          mintAuthority: sender,
          payer: payerPublicKey,
          updateAuthority: sender,
        },
        {
          createMetadataAccountArgsV3: {
            data: {
              name: this.buildMetadataName(message),
              symbol: "MSG",
              uri: "",
              sellerFeeBasisPoints: 0,
              creators: null,
              collection: null,
              uses: null,
            },
            isMutable: true,
            collectionDetails: null,
          },
        }
      )
    );

    // 4. Create associated token account for receiver
    transaction.add(
      createAssociatedTokenAccountInstruction(
        payerPublicKey, // payer
        receiverTokenAccount, // associated token account
        receiver, // owner
        mint, // mint
        TOKEN_PROGRAM_ID
      )
    );

    // 5. Mint 1 token to receiver
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

    // Partial sign with mint keypair
    transaction.partialSign(mintKeypair);

    // If server-side payer is configured, have the server cover rent and fees
    if (payerKeypair) {
      transaction.partialSign(payerKeypair);
    }

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

  private buildMetadataName(message: string): string {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return "Message";
    }

    const limit = SolanaService.METADATA_NAME_BYTE_LIMIT;
    if (Buffer.byteLength(trimmedMessage, "utf8") <= limit) {
      return trimmedMessage;
    }

    const ellipsis = "…";
    let candidate = trimmedMessage;

    // Reserve space for ellipsis when truncating
    while (candidate.length > 0 && Buffer.byteLength(candidate, "utf8") > limit - Buffer.byteLength(ellipsis, "utf8")) {
      candidate = candidate.slice(0, -1);
    }

    if (!candidate) {
      return trimmedMessage.slice(0, limit);
    }

    let truncated = `${candidate}${ellipsis}`;
    while (Buffer.byteLength(truncated, "utf8") > limit && candidate.length > 0) {
      candidate = candidate.slice(0, -1);
      truncated = `${candidate}${ellipsis}`;
    }

    return truncated;
  }
}

export default new SolanaService();
