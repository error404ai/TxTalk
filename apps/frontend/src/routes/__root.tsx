import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { SolanaWalletProvider } from "../providers/SolanaWalletProvider";

const RootLayout = () => (
  <SolanaWalletProvider>
    <Outlet />
    {typeof window !== "undefined" ? <TanStackRouterDevtools /> : null}
  </SolanaWalletProvider>
);

const NotFound = () => (
  <div className="p-4 space-y-2">
    <h1 className="text-xl font-semibold">Page not found</h1>
    <p>We couldn't find that page. Use the navigation above to get back on track.</p>
    <Link to="/" className="text-blue-600 hover:underline">
      Go home
    </Link>
  </div>
);

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
});
