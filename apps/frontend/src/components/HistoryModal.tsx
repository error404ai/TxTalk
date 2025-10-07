import { ArrowRight, Clock, X } from "lucide-react";
import { MessageHistoryItem } from "../utils/messageHistory";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: MessageHistoryItem[];
  walletAddress: string;
}

export function HistoryModal({ isOpen, onClose, history, walletAddress }: HistoryModalProps) {
  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Message History</h2>
            <p className="text-sm text-neutral-400 mt-1">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-neutral-600" />
              </div>
              <p className="text-neutral-400 text-lg">No messages sent yet</p>
              <p className="text-neutral-500 text-sm mt-2">Your message history will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="bg-neutral-800/50 border border-white/5 rounded-xl p-4 hover:bg-neutral-800 transition-all">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
                        <Clock className="w-3 h-3" />
                        {formatDate(item.timestamp)}
                      </div>
                      <p className="text-white text-sm leading-relaxed break-words">{item.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-400 pt-3 border-t border-white/5">
                    <span className="text-neutral-500">To:</span>
                    <span className="font-mono">
                      {item.recipientAddress.slice(0, 6)}...{item.recipientAddress.slice(-4)}
                    </span>
                    <ArrowRight className="w-3 h-3" />
                    {item.signature && (
                      <a href={`https://explorer.solana.com/tx/${item.signature}`} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
                        View on Explorer
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
