import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Transaction } from "@solana/web3.js";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { trpc } from "../trpc/trpc";

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
    metadataUri: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shouldValidate, setShouldValidate] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // tRPC queries and mutations
  const { data: feeData } = trpc.messages.getEstimatedFee.useQuery();

  // Validate address query - only enabled when we want to validate
  const { data: validationResult } = trpc.messages.validateAddress.useQuery(
    { address: receiverAddress },
    {
      enabled: shouldValidate && receiverAddress.length >= 32,
      retry: false,
    }
  );

  const createTxMutation = trpc.messages.createMessageTransaction.useMutation();
  const confirmMutation = trpc.messages.confirmMessage.useMutation();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const highlightBullets = ["Mint a unique on-chain artifact with every message", "Secure delivery with wallet-to-wallet encryption", "Instant activity tracking across the entire network"];

  const assuranceCards = [
    {
      title: "Why tokenized messages?",
      description: "Each message is minted as a collectible token, capturing context and provenance forever on Solana.",
    },
    {
      title: "Transparent fees",
      description: "Know your costs upfront. We calculate an estimated fee before you sign anything on-chain.",
    },
    {
      title: "Built for teams",
      description: "Switch between sending and analytics views in a click for a productive messaging workflow.",
    },
  ];

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
        metadataUri: txData.metadataUri,
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
    <section className="mx-auto max-w-7xl pb-16">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-10">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Solana native messaging</span>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">Mint a story with every message you send.</h1>
              <p className="max-w-xl text-lg text-slate-300">txtalk transforms simple wallet messages into collectible, verifiable moments. Compose your note, mint it as a token, and deliver it directly to any Solana wallet in seconds.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-slate-400">Estimated fee</p>
                <p className="mt-1 text-2xl font-semibold text-white">{feeData ? `~${feeData.fee} SOL` : "Loading..."}</p>
                <p className="mt-2 text-sm text-slate-400">Calculated dynamically before you sign.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-900/20 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-slate-400">Wallet status</p>
                <p className="mt-1 text-2xl font-semibold text-white">{publicKey ? `${publicKey.toBase58().slice(0, 4)}…${publicKey.toBase58().slice(-4)}` : "Not connected"}</p>
                <p className="mt-2 text-sm text-slate-400">Connect to unlock the compose experience.</p>
              </div>
            </div>

            <ul className="space-y-3 text-sm text-slate-300">
              {highlightBullets.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-cyan-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-4">
              <Link to="/messages" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-md shadow-white/20 transition hover:bg-slate-100">
                Explore dashboard
              </Link>
              {isClient ? (
                <WalletMultiButton className="!rounded-full !border !border-white/10 !bg-slate-900/60 !px-6 !py-3 !text-sm !font-semibold !text-white hover:!bg-slate-800" />
              ) : (
                <button className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/50 px-6 py-3 text-sm font-semibold text-white shadow-sm" type="button">
                  Select Wallet
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {assuranceCards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-relaxed text-slate-300 shadow-lg shadow-cyan-500/5 backdrop-blur">
                <h3 className="text-base font-semibold text-white">{card.title}</h3>
                <p className="mt-2 text-slate-300/90">{card.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-slate-900 to-slate-950 shadow-2xl shadow-cyan-500/10" />
          <div className="relative h-full rounded-3xl p-1">
            <div className="h-full rounded-[1.75rem] bg-slate-950/90 p-8 shadow-inner shadow-slate-900/70">
              <div className="flex flex-col gap-8">
                <div className="space-y-2 text-center">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Compose a message</p>
                  <h2 className="text-2xl font-semibold text-white">Finalize the details</h2>
                  <p className="text-sm text-slate-400">We handle serialization, minting, and confirmation behind the scenes.</p>
                </div>

                {!publicKey ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">
                    <h3 className="text-lg font-medium text-white">Connect your wallet to begin</h3>
                    <p className="mt-3 text-sm text-slate-400">Once connected, you can compose, sign, and dispatch your tokenized message instantly.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold uppercase tracking-wide text-slate-400">Receiver wallet address</label>
                      <input
                        type="text"
                        value={receiverAddress}
                        onChange={(e) => {
                          setReceiverAddress(e.target.value);
                          setIsValidAddress(null);
                        }}
                        onBlur={handleAddressBlur}
                        placeholder="Enter a Solana wallet address"
                        className={`w-full rounded-xl border bg-slate-900/80 px-4 py-3 text-sm text-white transition focus:outline-none focus:ring-2 focus:ring-cyan-400/60 ${isValidAddress === false ? "border-rose-500/60" : isValidAddress === true ? "border-emerald-500/60" : "border-white/10"}`}
                      />
                      {isValidAddress === true && <p className="text-sm text-emerald-400">✓ Address looks valid.</p>}
                      {isValidAddress === false && <p className="text-sm text-rose-400">✗ We couldn’t validate that address.</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold uppercase tracking-wide text-slate-400">Message</label>
                      <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Add context, instructions, or a heartfelt note..." rows={5} maxLength={500} className="w-full resize-none rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 transition focus:outline-none focus:ring-2 focus:ring-cyan-400/60" />
                      <p className="text-right text-xs text-slate-500">{message.length}/500 characters</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-300">
                      <div className="flex items-center justify-between text-slate-200">
                        <span>Estimated fee</span>
                        <span className="font-semibold text-cyan-300">{feeData ? `~${feeData.fee} SOL` : "Loading..."}</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">Fee includes transaction costs and token minting. Final amount is confirmed on-chain.</p>
                    </div>

                    {error && <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100">{error}</div>}

                    {txResult && (
                      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                        <p className="font-semibold text-emerald-200">Message delivered and minted successfully!</p>
                        <p className="mt-2 text-emerald-100/80">Transaction ID: {txResult.id}</p>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs font-medium">
                          <a href={txResult.solscanLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-500/20 px-4 py-2 text-emerald-50 transition hover:border-emerald-200">
                            View on Solscan
                          </a>
                          {txResult.metadataUri && (
                            <a href={txResult.metadataUri} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-500/20 px-4 py-2 text-emerald-50 transition hover:border-emerald-200">
                              View metadata
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    <button onClick={handleSendMessage} disabled={isSending || !receiverAddress || !message || isValidAddress === false} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-cyan-500/30 transition hover:from-cyan-300 hover:to-blue-400 disabled:cursor-not-allowed disabled:opacity-60">
                      {isSending ? "Sending message..." : "Sign & send on Solana"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
