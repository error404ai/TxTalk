import { useWallet as useSolanaWallet } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import { useBlockchain } from "../components/providers/BlockchainProvider";

export interface UnifiedWalletHook {
  blockchain: "solana" | "bnb";
  address: string | null;
  isConnected: boolean;
  disconnect: () => Promise<void>;
  // Solana specific
  solanaPublicKey: any;
  solanaSignTransaction: any;
  // BNB specific
  bnbAddress: string | undefined;
  bnbSignMessage: any;
}

export const useUnifiedWallet = (): UnifiedWalletHook => {
  const { selectedBlockchain } = useBlockchain();
  const solanaWallet = useSolanaWallet();
  const bnbAccount = useAccount();
  const { disconnect: disconnectBnb } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const address = useMemo(() => {
    if (selectedBlockchain === "solana") {
      return solanaWallet.publicKey?.toBase58() || null;
    } else {
      return bnbAccount.address || null;
    }
  }, [selectedBlockchain, solanaWallet.publicKey, bnbAccount.address]);

  const isConnected = useMemo(() => {
    if (selectedBlockchain === "solana") {
      return !!solanaWallet.publicKey;
    } else {
      return bnbAccount.isConnected;
    }
  }, [selectedBlockchain, solanaWallet.publicKey, bnbAccount.isConnected]);

  const disconnect = async () => {
    if (selectedBlockchain === "solana") {
      await solanaWallet.disconnect();
    } else {
      disconnectBnb();
    }
  };

  return {
    blockchain: selectedBlockchain,
    address,
    isConnected,
    disconnect,
    solanaPublicKey: solanaWallet.publicKey,
    solanaSignTransaction: solanaWallet.signTransaction,
    bnbAddress: bnbAccount.address,
    bnbSignMessage: signMessageAsync,
  };
};
