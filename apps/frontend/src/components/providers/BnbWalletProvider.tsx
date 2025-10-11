import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { FC, ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { bsc, bscTestnet } from "wagmi/chains";

interface BnbWalletProviderProps {
  children: ReactNode;
}

const queryClient = new QueryClient();

const config = getDefaultConfig({
  appName: "TxTalk",
  projectId: "YOUR_WALLETCONNECT_PROJECT_ID", // Get from https://cloud.walletconnect.com
  chains: [import.meta.env.VITE_BNB_NETWORK === "mainnet" ? bsc : bscTestnet],
  ssr: false,
});

export const BnbWalletProvider: FC<BnbWalletProviderProps> = ({ children }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
