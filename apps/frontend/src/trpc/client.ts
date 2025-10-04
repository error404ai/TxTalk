import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { trpc } from "./react";

interface CreateClientOptions {
  url: string;
  headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
  fetchImplementation?: typeof fetch;
}

export const createTrpcClient = ({ url, headers, fetchImplementation }: CreateClientOptions) =>
  trpc.createClient({
    transformer: superjson,
    links: [
      httpBatchLink({
        url,
        headers,
        fetch: fetchImplementation,
      }),
    ],
  });
