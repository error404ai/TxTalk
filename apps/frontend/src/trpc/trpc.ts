import { type AppRouter } from "@solmessage/api/router";
import { QueryClient } from "@tanstack/react-query";
import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>({});
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      transformer: superjson,
      url: `${import.meta.env.VITE_API_URL}/trpc`, // Use relative URL for Vite proxy
      headers() {
        const storedToken = typeof window !== "undefined" ? localStorage.getItem("solmessage_token") : null;
        return storedToken
          ? {
              authorization: `Bearer ${storedToken}`,
            }
          : {};
      },
    }),
  ],
});
