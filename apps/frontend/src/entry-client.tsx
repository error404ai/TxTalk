import type { DehydratedState } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { hydrate as hydrateRouter } from "@tanstack/react-router/ssr/client";
import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";

// Import the generated route tree
import { getBrowserApiBaseUrl } from "./config";
import { routeTree } from "./routeTree.gen";
import { createTrpcClient } from "./trpc/client";
import { TrpcProvider } from "./trpc/provider";
import { createQueryClient } from "./trpc/queryClient";

import "./index.css";

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Failed to find the root element for hydration.");
}

const renderApp = (element: HTMLElement, hydrate: boolean) => {
  const queryClient = createQueryClient();
  const trpcClient = createTrpcClient({
    url: `${getBrowserApiBaseUrl()}/trpc`,
    headers: () => {
      const headers: Record<string, string> = {};
      const storedToken = typeof window !== "undefined" ? localStorage.getItem("solmessage_token") : null;
      if (storedToken) {
        headers.authorization = `Bearer ${storedToken}`;
      }
      return headers;
    },
  });

  const dehydratedState = (window.__REACT_QUERY_STATE__ ?? undefined) as DehydratedState | undefined;
  delete window.__REACT_QUERY_STATE__;

  const app = (
    <StrictMode>
      <TrpcProvider queryClient={queryClient} trpcClient={trpcClient} dehydratedState={dehydratedState}>
        <RouterProvider router={router} />
      </TrpcProvider>
    </StrictMode>
  );

  if (hydrate) {
    hydrateRoot(element, app);
  } else {
    const root = createRoot(element);
    root.render(app);
  }
};

const start = async () => {
  const shouldHydrate = rootElement.hasChildNodes();

  if (shouldHydrate && (window as { $_TSR?: unknown }).$_TSR) {
    await hydrateRouter(router);
  }

  renderApp(rootElement, shouldHydrate);
};

start().catch((error) => {
  console.error("Failed to bootstrap the client application", error);
});
