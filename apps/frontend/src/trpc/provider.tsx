import { HydrationBoundary, QueryClientProvider, type DehydratedState, type QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { type ReactNode } from "react";
import { trpc } from "./react";

export interface TrpcProviderProps {
  queryClient: QueryClient;
  trpcClient: ReturnType<typeof trpc.createClient>;
  dehydratedState?: DehydratedState;
  children: ReactNode;
}

export const TrpcProvider = ({ queryClient, trpcClient, dehydratedState, children }: TrpcProviderProps) => (
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>{children}</HydrationBoundary>
      {typeof window !== "undefined" ? <ReactQueryDevtools buttonPosition="bottom-right" initialIsOpen={false} /> : null}
    </QueryClientProvider>
  </trpc.Provider>
);
