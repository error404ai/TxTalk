import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Transaction } from "@solana/web3.js";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { trpc } from "../trpc/react";

export function SendMessage() {
  const { publicKey, signTransaction } = useWallet();
  const [receiverAddress, setReceiverAddress] = useState("");
  const [message, setMessage] = useState("");
  const [isValidAddress, setIsValidAddress] = useState<boolean | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [txResult, setTxResult] = useState<{
    id: string;
    txSignature: string;
    solscanLink: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shouldValidate, setShouldValidate] = useState(false);

  // tRPC queries and mutations
  const { data: feeData } = trpc.message.getEstimatedFee.useQuery();

  // Validate address query - only enabled when we want to validate
  const { data: validationResult } = trpc.message.validateAddress.useQuery(
    { address: receiverAddress },
    {
      enabled: shouldValidate && receiverAddress.length >= 32,
      retry: false,
    }
  );

  const createTxMutation = trpc.message.createMessageTransaction.useMutation();
  const confirmMutation = trpc.message.confirmMessage.useMutation();

  // Handle validation result
  useEffect(() => {
    if (validationResult && shouldValidate) {
      setIsValidAddress(validationResult.valid);
      if (!validationResult.valid && validationResult.error) {
        setError(validationResult.error);
      } else {
        setError(null);
      }
      setShouldValidate(false);
    }
  }, [validationResult, shouldValidate]);

  // Validate address on blur
  const handleAddressBlur = async () => {
    if (receiverAddress.trim().length === 0) {
      setIsValidAddress(null);
      return;
    }

    if (receiverAddress.length < 32) {
      setIsValidAddress(false);
      setError("Address is too short");
      return;
    }

    setShouldValidate(true);
  };

  const handleSendMessage = async () => {
    if (!publicKey || !signTransaction) {
      setError("Please connect your wallet first");
      return;
    }

    if (!receiverAddress || !message) {
      setError("Please fill in all fields");
      return;
    }

    setIsSending(true);
    setError(null);
    setTxResult(null);

    try {
      // Step 1: Create unsigned transaction
      const txData = await createTxMutation.mutateAsync({
        senderPublicKey: publicKey.toBase58(),
        receiverAddress,
        message,
      });

      // Step 2: Deserialize and sign transaction with user's wallet
      const transaction = Transaction.from(Buffer.from(txData.transaction, "base64"));
      const signedTransaction = await signTransaction(transaction);

      // Step 3: Serialize signed transaction
      const signedTxBase64 = signedTransaction.serialize().toString("base64");

      // Step 4: Confirm and save message
      const result = await confirmMutation.mutateAsync({
        senderPublicKey: publicKey.toBase58(),
        receiverAddress,
        message,
        signedTransaction: signedTxBase64,
        tokenAddress: txData.mintKeypair.publicKey,
      });

      setTxResult({
        id: result.id,
        txSignature: result.txSignature,
        solscanLink: result.solscanLink,
      });

      // Clear form
      setReceiverAddress("");
      setMessage("");
      setIsValidAddress(null);
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Send Message to Solana Wallet</h1>
            <Link to="/messages" className="text-blue-400 hover:text-blue-300 text-sm">
              View Messages Dashboard →
            </Link>
          </div>
          <WalletMultiButton />
        </div>

        {!publicKey ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-xl mb-4">Connect your wallet to send messages</p>
            <p className="text-gray-400">Send messages to any Solana wallet by minting a unique token with your message.</p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-8">
            <div className="space-y-6">
              {/* Receiver Address Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Receiver Wallet Address</label>
                <input
                  type="text"
                  value={receiverAddress}
                  onChange={(e) => {
                    setReceiverAddress(e.target.value);
                    setIsValidAddress(null);
                  }}
                  onBlur={handleAddressBlur}
                  placeholder="Enter Solana wallet address..."
                  className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 ${isValidAddress === false ? "border-red-500 focus:ring-red-500" : isValidAddress === true ? "border-green-500 focus:ring-green-500" : "border-gray-600 focus:ring-blue-500"}`}
                />
                {isValidAddress === true && <p className="text-green-500 text-sm mt-1">✓ Valid address</p>}
                {isValidAddress === false && <p className="text-red-500 text-sm mt-1">✗ Invalid address</p>}
              </div>

              {/* Message Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Message ({message.length}/500)</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Enter your message..." rows={4} maxLength={500} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              {/* Estimated Fee */}
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Estimated Fee:</span>
                  <span className="text-lg font-semibold">{feeData ? `~${feeData.fee} SOL` : "Loading..."}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Fee includes transaction costs and token creation on Solana</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
                  <p className="text-red-200">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {txResult && (
                <div className="bg-green-900/50 border border-green-500 rounded-lg p-4">
                  <p className="text-green-200 font-semibold mb-2">✓ Message sent successfully!</p>
                  <p className="text-sm text-gray-300 mb-2">Transaction ID: {txResult.id}</p>
                  <a href={txResult.solscanLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline text-sm">
                    View on Solscan →
                  </a>
                </div>
              )}

              {/* Send Button */}
              <button onClick={handleSendMessage} disabled={isSending || !receiverAddress || !message || isValidAddress === false} className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors">
                {isSending ? "Sending Message..." : "Send Message"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
