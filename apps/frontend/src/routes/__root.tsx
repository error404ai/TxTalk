import { createRootRoute, Outlet } from "@tanstack/react-router";
import { BlockchainProvider } from "../components/providers/BlockchainProvider";
import { RouterDevtools } from "../components/providers/RouterDevtools";

const RootLayout = () => {
  return (
    <BlockchainProvider>
      <Outlet />
      <RouterDevtools />
    </BlockchainProvider>
  );
};

export const Route = createRootRoute({
  component: RootLayout,
});
