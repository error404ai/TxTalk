import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Transaction } from "@solana/web3.js";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Clock, Github, History, MessageSquare, Send, Shuffle, Twitter, Wallet, X, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { trpc } from "../trpc/trpc";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { publicKey, signTransaction, disconnect } = useWallet();
  const [message, setMessage] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [isWalletMode, setIsWalletMode] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number; duration: number }>>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [solPrice, setSolPrice] = useState<{ usd: number; change24h: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txResult, setTxResult] = useState<{ txSignature: string; solscanLink: string } | null>(null);
  const [copiedTx, setCopiedTx] = useState(false);
  const [isValidAddress, setIsValidAddress] = useState<boolean | null>(null);
  const [historyFilter, setHistoryFilter] = useState<"recent" | "all">("recent");

  const { setVisible: setWalletModalVisible } = useWalletModal();
  const walletBase58 = publicKey?.toBase58();

  // tRPC hooks
  const { data: feeData } = trpc.messages.getEstimatedFee.useQuery();
  const {
    data: overviewData,
    refetch: refetchOverview,
    isFetching: isFetchingOverview,
  } = trpc.messages.getMessagesOverview.useQuery(
    { walletAddress: walletBase58 || "", recentLimit: 5 },
    {
      enabled: !!publicKey,
    }
  );
  const {
    data: allMessagesData,
    refetch: refetchAllMessages,
    isFetching: isFetchingAllMessages,
  } = trpc.messages.getAllMessages.useQuery(
    { walletAddress: walletBase58 || "" },
    {
      enabled: false,
      refetchOnWindowFocus: false,
    }
  );
  const createTxMutation = trpc.messages.createMessageTransaction.useMutation();
  const confirmMutation = trpc.messages.confirmMessage.useMutation();
  const { data: validationResult } = trpc.messages.validateAddress.useQuery({ address: walletAddress }, { enabled: walletAddress.length >= 32 && isWalletMode, retry: false });

  const recentMessages = overviewData?.recent ?? [];
  const totalSent = overviewData?.totals.sent ?? 0;
  const totalReceived = overviewData?.totals.received ?? 0;
  const totalCombined = overviewData?.totals.combined ?? 0;

  const allMessages = allMessagesData?.messages ?? [];

  const messagesForContacts = useMemo(() => (allMessages.length > 0 ? allMessages : recentMessages), [allMessages, recentMessages]);

  const displayedMessages = useMemo(() => (historyFilter === "all" ? allMessages : recentMessages), [allMessages, historyFilter, recentMessages]);

  const latestActivityMessage = useMemo(() => (messagesForContacts.length > 0 ? messagesForContacts[0] : null), [messagesForContacts]);

  const uniqueContacts = useMemo(() => {
    if (!publicKey) return 0;
    const wallet = publicKey.toBase58();
    const contacts = new Set<string>();
    messagesForContacts.forEach((msg) => {
      const counterparty = msg.sender === wallet ? msg.receiver : msg.sender;
      contacts.add(counterparty);
    });
    return contacts.size;
  }, [messagesForContacts, publicKey]);

  const hasMessageActivity = totalCombined > 0;

  const isFetchingMessages = historyFilter === "all" ? isFetchingAllMessages : isFetchingOverview;

  useEffect(() => {
    if (validationResult) {
      setIsValidAddress(validationResult.valid);
      if (!validationResult.valid && validationResult.error) {
        setError(validationResult.error);
      }
    }
  }, [validationResult]);

  useEffect(() => {
    if (historyFilter === "all" && publicKey) {
      refetchAllMessages();
    }
  }, [historyFilter, publicKey, refetchAllMessages]);

  useEffect(() => {
    const generateParticles = () => {
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 4,
        delay: Math.random() * 5,
        duration: 3 + Math.random() * 4,
      }));
      setParticles(newParticles);
    };

    generateParticles();
  }, []);

  useEffect(() => {
    const fetchSolPrice = async () => {
      try {
        const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true");
        const data = await response.json();
        if (data.solana) {
          setSolPrice({
            usd: data.solana.usd,
            change24h: data.solana.usd_24h_change,
          });
        }
      } catch (error) {
        console.error("Failed to fetch SOL price:", error);
      }
    };

    fetchSolPrice();
    const interval = setInterval(fetchSolPrice, 20000);

    return () => clearInterval(interval);
  }, []);

  const randomMessages = [
    "Hello good morning",
    "Thanks for the trade",
    "Great doing business",
    "Have a wonderful day",
    "Nice to meet you",
    "Lets work together",
    "Amazing wallet address",
    "Keep building strong",
    "Good luck out there",
    "Thanks so much friend",
    "Appreciate your time",
    "Hope you are well",
    "Great to connect today",
    "Thanks for your support",
    "Looking forward to more",
    "Happy to help you",
    "Best wishes to you",
    "Stay safe out there",
    "Thanks for trusting me",
    "Excited for the future",
    "Glad we could connect",
    "This was very helpful",
    "Much appreciated my friend",
    "Pleasure doing business together",
    "See you next time",
    "Thanks for being awesome",
    "Really enjoyed this trade",
    "Hope to collaborate again",
    "Wishing you great success",
    "Thanks for the opportunity",
  ];

  const handleRandom = () => {
    const randomMsg = randomMessages[Math.floor(Math.random() * randomMessages.length)];
    setMessage(randomMsg);
  };

  const handleDisconnectWallet = async () => {
    try {
      await disconnect();
      setShowWalletDropdown(false);
    } catch (err) {
      console.error("Failed to disconnect wallet:", err);
    }
  };

  const handleSend = () => {
    if (!message.trim() || !walletAddress.trim()) return;
    if (!publicKey) {
      alert("Please connect your wallet first");
      return;
    }
    if (isValidAddress === false) {
      alert("Please enter a valid wallet address");
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    if (!publicKey || !signTransaction) {
      setError("Please connect your wallet first");
      return;
    }

    const senderPublicKey = walletBase58;
    if (!senderPublicKey) {
      setError("Unable to determine wallet address");
      return;
    }

    setIsProcessingPayment(true);
    setError(null);
    setTxResult(null);

    try {
      // Step 1: Create unsigned transaction
      const txData = await createTxMutation.mutateAsync({
        senderPublicKey,
        receiverAddress: walletAddress,
        message: message,
      });

      // Step 2: Deserialize and sign transaction
      const transaction = Transaction.from(Buffer.from(txData.transaction, "base64"));
      const signedTransaction = await signTransaction(transaction);

      // Step 3: Serialize signed transaction
      const signedTxBase64 = signedTransaction.serialize().toString("base64");

      // Step 4: Confirm and save message
      const result = await confirmMutation.mutateAsync({
        senderPublicKey,
        receiverAddress: walletAddress,
        message: message,
        signedTransaction: signedTxBase64,
        tokenAddress: txData.mintKeypair.publicKey,
      });

      setTxResult({
        txSignature: result.txSignature,
        solscanLink: result.solscanLink,
      });

      // Refresh message data
      await refetchOverview();
      if (historyFilter === "all" || allMessages.length > 0) {
        await refetchAllMessages();
      }

      // Clear form
      setMessage("");
      setWalletAddress("");
      setIsWalletMode(false);
      setIsValidAddress(null);
      // keep the payment modal open so the user can view tx result / explorer link
      // Success handled in the UI (txResult / modal). No browser alert.
    } catch (err) {
      console.error("Payment failed:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
      alert("Payment failed. Please try again.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCopyTx = async () => {
    if (!txResult?.txSignature) return;
    try {
      await navigator.clipboard.writeText(txResult.txSignature);
      setCopiedTx(true);
      setTimeout(() => setCopiedTx(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setTxResult(null);
    setError(null);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setMessage(text);

    const words = text.split(/\s+/);
    const potentialWallet = words[words.length - 1];

    if (potentialWallet.length > 30 && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(potentialWallet)) {
      setWalletAddress(potentialWallet);
      setIsWalletMode(true);
      setMessage(words.slice(0, -1).join(" ").trim());
    }
  };

  const clearWallet = () => {
    setWalletAddress("");
    setIsWalletMode(false);
    setIsValidAddress(null);
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent_50%)]"></div>

        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-mesh"></div>
        <div className="absolute top-1/3 right-1/4 w-[32rem] h-[32rem] bg-teal-500/10 rounded-full blur-3xl animate-mesh" style={{ animationDelay: "5s" }}></div>
        <div className="absolute bottom-1/4 left-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-mesh" style={{ animationDelay: "10s" }}></div>

        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent animate-pulse-slow" style={{ animationDelay: "4s" }}></div>

        <div className="absolute top-1/2 left-10 w-2 h-2 bg-emerald-400/40 rounded-full animate-pulse-slow blur-sm"></div>
        <div className="absolute top-1/4 right-20 w-3 h-3 bg-teal-400/40 rounded-full animate-pulse-slow blur-sm" style={{ animationDelay: "2s" }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-cyan-400/40 rounded-full animate-pulse-slow blur-sm" style={{ animationDelay: "6s" }}></div>

        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-emerald-400/30 animate-float-particle blur-sm"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          />
        ))}
      </div>

      <header className="border-b border-white/5 backdrop-blur-sm bg-neutral-950/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-neutral-950" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-semibold tracking-tight">TxTalk</span>
          </div>

          <div className="flex items-center gap-3">
            {solPrice && (
              <div className="px-4 py-2 bg-neutral-900 border border-white/10 rounded-lg flex items-center gap-2 text-sm">
                <span className="font-semibold text-emerald-400">SOL</span>
                <span className="text-white font-medium">${solPrice.usd.toFixed(2)}</span>
                <span className={`flex items-center gap-0.5 font-medium ${solPrice.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {solPrice.change24h >= 0 ? "▲" : "▼"}
                  {Math.abs(solPrice.change24h).toFixed(2)}%
                </span>
              </div>
            )}
            <button className="px-5 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors">Get Token</button>
            {publicKey ? (
              <div className="relative">
                <button onClick={() => setShowWalletDropdown(!showWalletDropdown)} className="px-5 py-2 bg-white text-neutral-950 rounded-lg text-sm font-semibold hover:bg-neutral-100 transition-all flex items-center gap-2 shadow-sm">
                  <Wallet className="w-4 h-4" />
                  {walletBase58?.slice(0, 4)}...{walletBase58?.slice(-4)}
                </button>
                {showWalletDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-white/10 rounded-lg shadow-xl overflow-hidden z-50">
                    <button onClick={handleDisconnectWallet} className="w-full px-4 py-3 text-sm text-left hover:bg-neutral-800 transition-colors flex items-center gap-2 text-red-400 hover:text-red-300">
                      <X className="w-4 h-4" />
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => setWalletModalVisible(true)} className="px-5 py-2 bg-white text-neutral-950 rounded-lg text-sm font-semibold hover:bg-neutral-100 transition-all flex items-center gap-2 shadow-sm">
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 relative z-10">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-16 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-sm font-medium text-emerald-400 mb-6">
              <Zap className="w-4 h-4" />
              On-Chain Messaging
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
              Message any wallet
              <br />
              <span className="text-neutral-400">instantly on Solana</span>
            </h1>
            <p className="text-lg text-neutral-400 max-w-xl mx-auto">Send messages directly to any Solana wallet address. Fast, secure, and decentralized.</p>
          </div>

          <div className="bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-8">
              <label className="block text-sm font-medium text-neutral-400 mb-3">Your message</label>
              <textarea value={message} onChange={handleTextareaChange} placeholder="Type your message here..." className="w-full bg-neutral-800 text-white placeholder-neutral-500 rounded-xl px-4 py-3 resize-none outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-base min-h-[80px] animate-slideIn" rows={3} />

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button onClick={handleRandom} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-750 border border-white/10 rounded-lg text-sm font-medium transition-all flex items-center gap-2">
                  <Shuffle className="w-4 h-4" />
                  Random
                </button>

                {isWalletMode && walletAddress && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm animate-slideIn">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span className="text-neutral-400">To:</span>
                    <span className="font-mono text-emerald-400 font-medium">
                      {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                    </span>
                    {isValidAddress === true && <span className="text-emerald-400 text-xs">✓</span>}
                    {isValidAddress === false && <span className="text-red-400 text-xs">✗</span>}
                    <button onClick={clearWallet} className="ml-2 text-neutral-400 hover:text-white transition-colors text-lg leading-none">
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-white/5 p-6 flex items-center justify-between bg-neutral-900/50">
              <p className="text-sm text-neutral-500">{publicKey ? "Ready to send" : "Connect wallet to send"}</p>
              <button onClick={handleSend} disabled={!message.trim() || !walletAddress.trim() || !publicKey} className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-neutral-700 disabled:to-neutral-700 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg disabled:shadow-none">
                <Send className="w-4 h-4" />
                Send Message
              </button>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            <div className="p-6 bg-neutral-900/50 border border-white/5 rounded-xl">
              <div className="text-2xl font-bold text-emerald-400 mb-1">Instant</div>
              <div className="text-sm text-neutral-400">On-chain delivery</div>
            </div>
            <div className="p-6 bg-neutral-900/50 border border-white/5 rounded-xl">
              <div className="text-2xl font-bold text-emerald-400 mb-1">Secure</div>
              <div className="text-sm text-neutral-400">End-to-end encrypted</div>
            </div>
            <div className="p-6 bg-neutral-900/50 border border-white/5 rounded-xl">
              <div className="text-2xl font-bold text-emerald-400 mb-1">Simple</div>
              <div className="text-sm text-neutral-400">Just paste & send</div>
            </div>
          </div>

          {publicKey && (
            <section className="mt-16 space-y-10">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight">Your on-chain signal</h2>
                  <p className="text-neutral-400 mt-2 text-base">Track both your sent shout-outs and wallet inbox in one place.</p>
                </div>
                <div className="flex gap-2 bg-neutral-900/80 border border-white/10 rounded-xl p-2">
                  {[
                    { key: "recent" as const, label: "Recent 5" },
                    { key: "all" as const, label: "All" },
                  ].map((tab) => (
                    <button key={tab.key} onClick={() => setHistoryFilter(tab.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${historyFilter === tab.key ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white" : "text-neutral-400 hover:text-white"}`}>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-neutral-900/60 border border-white/5 rounded-2xl flex flex-col gap-3">
                  <span className="text-sm uppercase tracking-wide text-neutral-500">Sent messages</span>
                  <span className="text-4xl font-semibold text-white">{totalSent}</span>
                  <p className="text-sm text-neutral-500">
                    Delivered to {uniqueContacts} wallet{uniqueContacts === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="p-6 bg-neutral-900/60 border border-white/5 rounded-2xl flex flex-col gap-3">
                  <span className="text-sm uppercase tracking-wide text-neutral-500">Inbox</span>
                  <span className="text-4xl font-semibold text-white">{totalReceived}</span>
                  <p className="text-sm text-neutral-500">Incoming notes from your network</p>
                </div>
                <div className="p-6 bg-neutral-900/60 border border-white/5 rounded-2xl flex flex-col gap-3">
                  <span className="text-sm uppercase tracking-wide text-neutral-500">Latest activity</span>
                  <span className="text-4xl font-semibold text-white">{latestActivityMessage ? formatDate(latestActivityMessage.createdAt) : "—"}</span>
                  <p className="text-sm text-neutral-500">{historyFilter === "recent" ? `Showing up to ${recentMessages.length} recent message${recentMessages.length === 1 ? "" : "s"}` : `Showing ${displayedMessages.length} total message${displayedMessages.length === 1 ? "" : "s"}`}</p>
                </div>
              </div>

              {hasMessageActivity ? (
                <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6 space-y-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-xl font-semibold text-white">{historyFilter === "recent" ? "Recent 5 messages" : "All messages"}</h3>
                    <span className="text-sm text-neutral-500">{historyFilter === "recent" ? `Last ${displayedMessages.length} message${displayedMessages.length === 1 ? "" : "s"}` : `${displayedMessages.length} total message${displayedMessages.length === 1 ? "" : "s"}`}</span>
                  </div>

                  {isFetchingMessages && displayedMessages.length === 0 ? (
                    <p className="text-neutral-500 text-sm">Loading messages...</p>
                  ) : displayedMessages.length === 0 ? (
                    <p className="text-neutral-500 text-sm">Your history is loading. Try again in a moment.</p>
                  ) : (
                    <div className="space-y-4">
                      {displayedMessages.map((item) => {
                        const isSender = item.sender === walletBase58;
                        const counterparty = isSender ? item.receiver : item.sender;
                        return (
                          <div key={item.id} className="bg-neutral-900 border border-white/5 rounded-xl p-4 space-y-3">
                            <div className="flex items-center gap-2 text-xs text-neutral-500">
                              <Clock className="w-3 h-3" />
                              {formatDate(item.createdAt)}
                            </div>
                            <p className="text-sm text-white leading-relaxed break-words">{item.message}</p>
                            <div className="flex items-center gap-2 text-xs text-neutral-400">
                              <span className="text-neutral-500">{isSender ? "To:" : "From:"}</span>
                              <span className="font-mono">
                                {counterparty.slice(0, 6)}...{counterparty.slice(-4)}
                              </span>
                              <ArrowRight className="w-3 h-3" />
                              <a href={item.solscanLink} target="_blank" rel="noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                                Explorer
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-10 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-neutral-800 flex items-center justify-center">
                    <MessageSquare className="w-7 h-7 text-neutral-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">No activity yet</h3>
                  <p className="text-neutral-500 text-sm max-w-md mx-auto">Send your first message or wait for a wallet to reach out. Both your sent and received conversations will show up here instantly.</p>
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-slideIn">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Confirm Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-neutral-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-neutral-800 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">From</span>
                  <span className="font-mono text-emerald-400">
                    {walletBase58?.slice(0, 4)}...{walletBase58?.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">To</span>
                  <span className="font-mono text-emerald-400">
                    {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                  </span>
                </div>
                <div className="border-t border-white/5 pt-3 flex justify-between">
                  <span className="text-neutral-400">Message Fee</span>
                  <span className="text-xl font-bold text-white">{feeData ? `~${feeData.fee} SOL` : "Loading..."}</span>
                </div>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                <p className="text-sm text-emerald-400">
                  <strong>Your message:</strong> {message}
                </p>
              </div>
              {error && <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}
              {txResult ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                    <p className="font-semibold text-emerald-200">Message delivered successfully!</p>
                    <p className="text-emerald-100 text-xs mt-2 break-words">{txResult.txSignature}</p>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={handleCopyTx} className="flex-1 px-4 py-3 bg-neutral-800 border border-white/10 rounded-lg text-sm font-medium hover:bg-neutral-800/90 transition-all">
                      {copiedTx ? "Copied" : "Copy Tx"}
                    </button>
                    <a href={txResult.solscanLink} target="_blank" rel="noopener noreferrer" className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-semibold text-white transition-colors">
                      View on Explorer
                    </a>
                  </div>

                  <button onClick={handleClosePaymentModal} className="w-full px-6 py-3 bg-gradient-to-r from-neutral-700 to-neutral-600 hover:from-neutral-650 hover:to-neutral-550 text-white rounded-xl font-semibold transition-all">
                    Done
                  </button>
                </div>
              ) : (
                <button onClick={handlePayment} disabled={isProcessingPayment} className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-neutral-700 disabled:to-neutral-700 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg disabled:shadow-none">
                  {isProcessingPayment ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Confirm & Send
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-white/5 py-8 bg-neutral-950/80 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-neutral-500">
          <div>© 2025 TxTalk. Built on Solana.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">
              Documentation
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Support
            </a>
            <a href="#" className="hover:text-white transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </footer>

      <div className="fixed left-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-40">
        <a href="https://x.com/TxTalkdotfun" target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 transition-all hover:scale-110 animate-float-x group">
          <Twitter className="w-6 h-6 text-white" />
          <span className="absolute left-full ml-3 px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Follow on X</span>
        </a>

        <a href="https://github.com/error404ai/TxTalk" target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-neutral-800 hover:bg-neutral-700 rounded-full flex items-center justify-center shadow-lg shadow-neutral-800/50 transition-all hover:scale-110 animate-float-x group">
          <Github className="w-6 h-6 text-white" />
          <span className="absolute left-full ml-3 px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">View on GitHub</span>
        </a>

        {publicKey && (
          <button onClick={() => setShowHistoryModal(true)} className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all hover:scale-110 animate-float-x group">
            <History className="w-6 h-6 text-white" />
            <span className="absolute left-full ml-3 px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Message History</span>
          </button>
        )}
      </div>

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Message History</h2>
                <p className="text-sm text-neutral-400 mt-1">
                  {walletBase58?.slice(0, 6)}...{walletBase58?.slice(-4)}
                </p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <div className="px-6 pt-4 flex items-center justify-between border-b border-white/10">
              <div className="flex gap-2 bg-neutral-900/80 border border-white/10 rounded-xl p-1">
                {[
                  { key: "recent" as const, label: "Recent 5" },
                  { key: "all" as const, label: "All" },
                ].map((tab) => (
                  <button key={tab.key} onClick={() => setHistoryFilter(tab.key)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${historyFilter === tab.key ? "bg-emerald-500/20 text-emerald-300" : "text-neutral-400 hover:text-white"}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
              <span className="text-xs text-neutral-500">{isFetchingMessages ? "Refreshing..." : historyFilter === "recent" ? `Showing ${displayedMessages.length} recent message${displayedMessages.length === 1 ? "" : "s"}` : `Showing ${displayedMessages.length} total message${displayedMessages.length === 1 ? "" : "s"}`}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {displayedMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                    <Clock className="w-8 h-8 text-neutral-600" />
                  </div>
                  <p className="text-neutral-400 text-lg">{isFetchingMessages ? "Loading your history..." : totalCombined === 0 ? "No messages yet" : "No messages for this view right now"}</p>
                  <p className="text-neutral-500 text-sm mt-2">{isFetchingMessages ? "Pulling the latest messages from the network." : totalCombined === 0 ? "Send or receive a message to populate your history." : "Switch tabs or try again shortly."}</p>
                </div>
              ) : (
                displayedMessages.map((item) => {
                  const isSender = item.sender === walletBase58;
                  const counterparty = isSender ? item.receiver : item.sender;

                  return (
                    <div key={item.id} className="bg-neutral-800/50 border border-white/5 rounded-xl p-4 hover:bg-neutral-800 transition-all">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
                            <Clock className="w-3 h-3" />
                            {formatDate(item.createdAt)}
                          </div>
                          <p className="text-white text-sm leading-relaxed break-words">{item.message}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 pt-3 border-t border-white/5">
                        <span className="text-neutral-500">{isSender ? "To" : "From"}:</span>
                        <span className={`font-mono ${isSender ? "text-emerald-300" : "text-teal-300"}`}>
                          {counterparty.slice(0, 6)}...{counterparty.slice(-4)}
                        </span>
                        <ArrowRight className="w-3 h-3" />
                        <a href={item.solscanLink} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
                          View on Explorer
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
