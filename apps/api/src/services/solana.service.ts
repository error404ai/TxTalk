import { createCreateMetadataAccountV3Instruction, createSetTokenStandardInstruction, PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { createAssociatedTokenAccountInstruction, createInitializeMint2Instruction, createMintToInstruction, getAssociatedTokenAddress, getMinimumBalanceForRentExemptMint, MintLayout, TOKEN_PROGRAM_ID } from "@solana/spl-token";
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
  private static readonly METADATA_ACCOUNT_SIZE = 679;

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

    const mintRent = await getMinimumBalanceForRentExemptMint(this.connection);
    const tokenAccountRent = await this.connection.getMinimumBalanceForRentExemption(MintLayout.span);
    const metadataRent = await this.connection.getMinimumBalanceForRentExemption(SolanaService.METADATA_ACCOUNT_SIZE);
    const lamports = mintRent + tokenAccountRent + metadataRent;
    return lamports / LAMPORTS_PER_SOL;
  }

  /**
   * Creates unsigned transaction for client-side signing
   * This is the preferred method for web3 wallets
   */

  async createMessageTransaction(params: { senderPublicKey: string; receiverAddress: string; name: string }) {
    const { senderPublicKey, receiverAddress, name } = params;
    const sender = new PublicKey(senderPublicKey);
    const receiver = new PublicKey(receiverAddress);
    const payerKeypair = this.payerKeypair;
    const payerPublicKey = payerKeypair?.publicKey ?? sender;

    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;

    const receiverTokenAccount = await getAssociatedTokenAddress(mint, receiver);

    const { blockhash } = await this.connection.getLatestBlockhash();
    const lamports = await this.connection.getMinimumBalanceForRentExemption(MintLayout.span);

    const transaction = new Transaction();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = payerPublicKey;

    // 1️⃣ Create mint
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: payerPublicKey,
        newAccountPubkey: mint,
        space: MintLayout.span,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      })
    );

    // 2️⃣ Initialize mint
    transaction.add(createInitializeMint2Instruction(mint, 0, sender, sender, TOKEN_PROGRAM_ID));

    // 3️⃣ Metadata
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
            data: { name, symbol: "TKN", uri: "", sellerFeeBasisPoints: 0, creators: null, collection: null, uses: null },
            isMutable: true,
            collectionDetails: null,
          },
        }
      )
    );

    // 4️⃣ Set token standard
    transaction.add(
      createSetTokenStandardInstruction({
        metadata: metadataPda,
        mint,
        updateAuthority: sender,
      })
    );

    // 5️⃣ Create receiver ATA
    transaction.add(createAssociatedTokenAccountInstruction(payerPublicKey, receiverTokenAccount, receiver, mint, TOKEN_PROGRAM_ID));

    // 6️⃣ Mint 1 token
    transaction.add(createMintToInstruction(mint, receiverTokenAccount, sender, 1));

    // Partial signing
    transaction.partialSign(mintKeypair);
    if (payerKeypair) transaction.partialSign(payerKeypair);

    const serializedTransaction = transaction.serialize({ requireAllSignatures: false, verifySignatures: false });

    return {
      transaction: serializedTransaction.toString("base64"),
      mintKeypair: { publicKey: mintKeypair.publicKey.toBase58(), secretKey: bs58.encode(mintKeypair.secretKey) },
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
