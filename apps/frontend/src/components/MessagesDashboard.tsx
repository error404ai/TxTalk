import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { trpc } from "../trpc/trpc";

export function MessagesDashboard() {
  const { publicKey } = useWallet();
  const [isClient, setIsClient] = useState(false);

  const { data: messagesData, isLoading } = trpc.messages.getAllMessages.useQuery({ walletAddress: publicKey?.toBase58() || "" }, { enabled: !!publicKey });

  const messages = messagesData?.messages ?? [];

  const sentMessages = useMemo(() => {
    if (!publicKey) return [] as typeof messages;
    const wallet = publicKey.toBase58();
    return messages.filter((msg) => msg.sender === wallet);
  }, [messages, publicKey]);

  const receivedMessages = useMemo(() => {
    if (!publicKey) return [] as typeof messages;
    const wallet = publicKey.toBase58();
    return messages.filter((msg) => msg.receiver === wallet);
  }, [messages, publicKey]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const stats = useMemo(() => {
    const sent = sentMessages.length;
    const received = receivedMessages.length;
    const total = sent + received;
    const lastActivity = [...messages].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.createdAt;

    return {
      sent,
      received,
      total,
      lastActivity,
    };
  }, [messages, receivedMessages, sentMessages]);

  const formattedLastActivity = stats.lastActivity ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(stats.lastActivity)) : "—";

  const walletDisplay = publicKey ? `${publicKey.toBase58().slice(0, 4)}…${publicKey.toBase58().slice(-4)}` : "Not connected";

  return (
    <section className="mx-auto max-w-7xl pb-16">
      <div className="space-y-10">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-cyan-500/10 backdrop-blur">
          <div className="grid gap-8 border-b border-white/10 bg-gradient-to-br from-cyan-500/10 via-slate-900/60 to-slate-950 p-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Sentiment analytics</p>
              <h1 className="text-4xl font-semibold text-white">Your Solana messaging command center.</h1>
              <p className="max-w-2xl text-sm text-slate-300">Track every tokenized message you send or receive, monitor fees, and dive into immutable delivery proofs—all in one sophisticated dashboard.</p>
              <div className="flex flex-wrap items-center gap-3">
                <Link to="/" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow-sm shadow-white/20 transition hover:bg-slate-100">
                  ← Compose a new message
                </Link>
                {isClient ? (
                  <WalletMultiButton className="!rounded-full !border !border-white/20 !bg-slate-900/60 !px-5 !py-2 !text-sm !font-semibold !text-white hover:!bg-slate-800" />
                ) : (
                  <button className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/60 px-5 py-2 text-sm font-semibold text-white" type="button">
                    Select Wallet
                  </button>
                )}
              </div>
            </div>
            <div className="grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-300">Wallet</p>
                <p className="mt-2 text-lg font-semibold text-white">{walletDisplay}</p>
                <p className="mt-2 text-xs text-slate-400">Connect a Solana wallet to sync your message history.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-300">Last activity</p>
                <p className="mt-2 text-lg font-semibold text-white">{formattedLastActivity}</p>
                <p className="mt-2 text-xs text-slate-400">We keep your timeline up-to-date in real time.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total interactions", value: stats.total },
              { label: "Sent messages", value: stats.sent },
              { label: "Received messages", value: stats.received },
              { label: "Activity status", value: stats.total > 0 ? "Active" : "Awaiting" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
                <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{typeof item.value === "number" ? item.value : item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {!publicKey ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center text-slate-300 shadow-lg shadow-cyan-500/10">
            <h2 className="text-2xl font-semibold text-white">Connect a wallet to unlock your dashboard</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">We’ll securely load your sent and received messages once you authenticate with a Solana wallet.</p>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-2">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Sent messages</h2>
                <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-200">{stats.sent}</span>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 backdrop-blur">
                {isLoading ? (
                  <div className="grid gap-4 p-6 text-slate-400">
                    {[...Array(3)].map((_, idx) => (
                      <div key={idx} className="h-24 animate-pulse rounded-xl bg-white/5" />
                    ))}
                  </div>
                ) : sentMessages.length === 0 ? (
                  <div className="p-10 text-center text-sm text-slate-400">No messages sent yet. Compose one to get started!</div>
                ) : (
                  <ul className="divide-y divide-white/10">
                    {sentMessages.map((msg) => (
                      <li key={msg.id} className="flex flex-col gap-4 p-6 transition hover:bg-white/5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-2">
                            <p className="text-xs uppercase tracking-wide text-slate-500">To</p>
                            <p className="font-mono text-sm text-cyan-200">{msg.receiver}</p>
                          </div>
                          <span className="text-xs text-slate-400">{new Date(msg.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-slate-200">{msg.message}</p>
                        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
                          <div className="flex flex-wrap items-center gap-4">
                            <span className="rounded-full bg-white/5 px-3 py-1 font-semibold text-slate-200">Fee {msg.feePaid} SOL</span>
                            {msg.tokenAddress && <span className="font-mono text-slate-400">Token {msg.tokenAddress.substring(0, 8)}…</span>}
                          </div>
                          <a href={msg.solscanLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-cyan-300 hover:text-cyan-200">
                            View on Solscan →
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Received messages</h2>
                <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-200">{stats.received}</span>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 backdrop-blur">
                {isLoading ? (
                  <div className="grid gap-4 p-6 text-slate-400">
                    {[...Array(3)].map((_, idx) => (
                      <div key={idx} className="h-24 animate-pulse rounded-xl bg-white/5" />
                    ))}
                  </div>
                ) : receivedMessages.length === 0 ? (
                  <div className="p-10 text-center text-sm text-slate-400">No messages received yet. Share your wallet to collect on-chain notes.</div>
                ) : (
                  <ul className="divide-y divide-white/10">
                    {receivedMessages.map((msg) => (
                      <li key={msg.id} className="flex flex-col gap-4 p-6 transition hover:bg-white/5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-2">
                            <p className="text-xs uppercase tracking-wide text-slate-500">From</p>
                            <p className="font-mono text-sm text-purple-200">{msg.sender}</p>
                          </div>
                          <span className="text-xs text-slate-400">{new Date(msg.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-slate-200">{msg.message}</p>
                        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
                          <div className="flex flex-wrap items-center gap-4">{msg.tokenAddress && <span className="font-mono text-slate-400">Token {msg.tokenAddress.substring(0, 8)}…</span>}</div>
                          <a href={msg.solscanLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-purple-200 hover:text-purple-100">
                            View on Solscan →
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </section>
  );
}
