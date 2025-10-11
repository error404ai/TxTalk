import { FC, ReactNode, createContext, useContext, useState } from "react";
import { BnbWalletProvider } from "./BnbWalletProvider";
import { SolanaWalletProvider } from "./SolanaWalletProvider";

type BlockchainType = "solana" | "bnb";

interface BlockchainContextType {
  selectedBlockchain: BlockchainType;
  setSelectedBlockchain: (blockchain: BlockchainType) => void;
}

const BlockchainContext = createContext<BlockchainContextType | undefined>(undefined);

export const useBlockchain = () => {
  const context = useContext(BlockchainContext);
  if (!context) {
    throw new Error("useBlockchain must be used within BlockchainProvider");
  }
  return context;
};

interface BlockchainProviderProps {
  children: ReactNode;
}

export const BlockchainProvider: FC<BlockchainProviderProps> = ({ children }) => {
  const [selectedBlockchain, setSelectedBlockchain] = useState<BlockchainType>("solana");

  return (
    <BlockchainContext.Provider value={{ selectedBlockchain, setSelectedBlockchain }}>
      <BnbWalletProvider>
        <SolanaWalletProvider>{children}</SolanaWalletProvider>
      </BnbWalletProvider>
    </BlockchainContext.Provider>
  );
};
