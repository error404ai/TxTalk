import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient as defaultQueryClient, trpcClient as defaultTrpcClient, trpc, type TrpcClient } from "../../trpc/trpc";

interface TrpcProviderProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  trpcClient?: TrpcClient;
  showDevtools?: boolean;
}

export function TrpcProvider({ children, queryClient, trpcClient, showDevtools }: TrpcProviderProps) {
  const activeQueryClient = queryClient ?? defaultQueryClient;
  const activeTrpcClient = trpcClient ?? defaultTrpcClient;
  const shouldShowDevtools = showDevtools ?? typeof window !== "undefined";

  return (
    <QueryClientProvider client={activeQueryClient}>
      <trpc.Provider client={activeTrpcClient} queryClient={activeQueryClient}>
        {children}
      </trpc.Provider>
      {shouldShowDevtools ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}
