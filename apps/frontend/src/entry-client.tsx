import { createRouter, RouterProvider } from "@tanstack/react-router";
import { hydrate as hydrateRouter } from "@tanstack/react-router/ssr/client";
import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

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
  const app = (
    <StrictMode>
      <RouterProvider router={router} />
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
