import { type AppRouter } from "@solmessage/api/router";
import { QueryClient, type DefaultOptions } from "@tanstack/react-query";
import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import superjson from "superjson";

const defaultQueryClientOptions: DefaultOptions = {
  queries: {
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: 1000 * 60 * 5,
  },
};

export const trpc = createTRPCReact<AppRouter>({});

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: defaultQueryClientOptions,
  });

export type TrpcClient = ReturnType<typeof trpc.createClient>;

export interface CreateTrpcClientOptions {
  url: string;
  headers?: () => Record<string, string>;
}

export const createTrpcClient = ({ url, headers }: CreateTrpcClientOptions): TrpcClient =>
  trpc.createClient({
    links: [
      httpBatchLink({
        url,
        headers,
        transformer: superjson,
      }),
    ],
  });

const resolveBrowserHeaders = (): Record<string, string> => {
  if (typeof window === "undefined") {
    return {};
  }

  const storedToken = localStorage.getItem("solmessage_token");
  if (!storedToken) {
    return {};
  }

  return {
    authorization: `Bearer ${storedToken}`,
  };
};

const defaultApiUrl = `${import.meta.env.VITE_API_URL}/trpc`;

export const queryClient = createQueryClient();
export const trpcClient = createTrpcClient({
  url: defaultApiUrl,
  headers: resolveBrowserHeaders,
});

export const extractRequestHeaders = (request: Request): Record<string, string> => {
  const headers = new Headers(request.headers);
  headers.delete("content-length");
  return Object.fromEntries(headers.entries());
};

export const createServerTrpcClient = ({ apiBaseUrl, request }: { apiBaseUrl: string; request: Request }): TrpcClient =>
  createTrpcClient({
    url: `${apiBaseUrl}/trpc`,
    headers: () => extractRequestHeaders(request),
  });
