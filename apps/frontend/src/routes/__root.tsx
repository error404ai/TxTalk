import { createRootRoute, Outlet } from "@tanstack/react-router";
import { RouterDevtools } from "../components/providers/RouterDevtools";
import { SolanaWalletProvider } from "../components/providers/SolanaWalletProvider";

const RootLayout = () => {
  return (
    <SolanaWalletProvider>
      <Outlet />
      <RouterDevtools />
    </SolanaWalletProvider>
  );
};

export const Route = createRootRoute({
  component: RootLayout,
});
