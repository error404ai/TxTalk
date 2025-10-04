import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Link } from "@tanstack/react-router";
import { trpc } from "../trpc/react";

export function MessagesDashboard() {
  const { publicKey } = useWallet();

  const { data: messagesData, isLoading } = trpc.message.getAllMessages.useQuery({ walletAddress: publicKey?.toBase58() || "" }, { enabled: !!publicKey });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Messages Dashboard</h1>
            <Link to="/" className="text-blue-400 hover:text-blue-300">
              ← Back to Send Message
            </Link>
          </div>
          <WalletMultiButton />
        </div>

        {!publicKey ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-xl mb-4">Connect your wallet to view messages</p>
            <p className="text-gray-400">View all messages you've sent and received on Solana.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Sent Messages */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Sent Messages ({messagesData?.sent.length || 0})</h2>
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                {isLoading ? (
                  <div className="p-8 text-center text-gray-400">Loading...</div>
                ) : messagesData?.sent.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">No messages sent yet</div>
                ) : (
                  <div className="divide-y divide-gray-700">
                    {messagesData?.sent.map((msg) => (
                      <div key={msg.id} className="p-6 hover:bg-gray-750 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="text-sm text-gray-400 mb-1">To: {msg.receiver}</p>
                            <p className="text-lg">{msg.message}</p>
                          </div>
                          <span className="text-sm text-gray-500">{new Date(msg.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="text-sm text-gray-500">
                            <span className="mr-4">Fee: {msg.feePaid} SOL</span>
                            {msg.tokenAddress && <span className="mr-4">Token: {msg.tokenAddress.substring(0, 8)}...</span>}
                          </div>
                          <a href={msg.solscanLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm">
                            View on Solscan →
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Received Messages */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Received Messages ({messagesData?.received.length || 0})</h2>
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                {isLoading ? (
                  <div className="p-8 text-center text-gray-400">Loading...</div>
                ) : messagesData?.received.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">No messages received yet</div>
                ) : (
                  <div className="divide-y divide-gray-700">
                    {messagesData?.received.map((msg) => (
                      <div key={msg.id} className="p-6 hover:bg-gray-750 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="text-sm text-gray-400 mb-1">From: {msg.sender}</p>
                            <p className="text-lg">{msg.message}</p>
                          </div>
                          <span className="text-sm text-gray-500">{new Date(msg.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="text-sm text-gray-500">{msg.tokenAddress && <span className="mr-4">Token: {msg.tokenAddress.substring(0, 8)}...</span>}</div>
                          <a href={msg.solscanLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm">
                            View on Solscan →
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
