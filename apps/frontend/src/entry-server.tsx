import { dehydrate } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { createRequestHandler, RouterServer } from "@tanstack/react-router/ssr/server";
import { renderToString } from "react-dom/server";
import { getServerApiBaseUrl } from "./config";
import { routeTree } from "./routeTree.gen";
import { createTrpcClient } from "./trpc/client";
import { TrpcProvider } from "./trpc/provider";
import { createQueryClient } from "./trpc/queryClient";

type HeaderTuple = [string, string];

export interface RenderResult {
  status: number;
  headers: HeaderTuple[];
  head: string;
  html: string;
  scripts: string;
}

interface RenderPayload extends RenderResult {}

const createAppRouter = () => createRouter({ routeTree });

const toRequest = (input: Request | string): Request => {
  if (typeof input !== "string") {
    return input;
  }

  const url = new URL(input, "http://localhost");
  return new Request(url);
};

// Render the app for the given Request or URL string.
// The project's server (see `server.js`) calls `render(url)` with a path
// (e.g. "/about"). We accept either a Request or a string and normalize
// to a Request so `createRequestHandler` can create a server history for us.
export async function render(requestOrUrl: Request | string): Promise<RenderResult> {
  const request = toRequest(requestOrUrl);
  const queryClient = createQueryClient();
  const apiBaseUrl = getServerApiBaseUrl();
  const trpcClient = createTrpcClient({
    url: `${apiBaseUrl}/trpc`,
    headers: () => {
      const headers = new Headers(request.headers);
      headers.delete("content-length");
      return Object.fromEntries(headers.entries());
    },
  });

  const handler = createRequestHandler({ request, createRouter: createAppRouter });

  const response = await handler(async ({ responseHeaders, router }) => {
    const app = (
      <TrpcProvider queryClient={queryClient} trpcClient={trpcClient}>
        <RouterServer router={router} />
      </TrpcProvider>
    );

    const appHtml = renderToString(app);

    router.serverSsr?.setRenderFinished();
    const injectedHtml = router.serverSsr ? await Promise.all(router.serverSsr.injectedHtml).then((chunks) => chunks.join("")) : "";

    const dehydratedState = dehydrate(queryClient);

    const serialize = (value: unknown) => JSON.stringify(value ?? null).replace(/</g, "\\u003c");

    const hydrationScripts = [`<script>window.__REACT_QUERY_STATE__ = ${serialize(dehydratedState)};</script>`, `<script>window.__SOLMESSAGE_API_URL__ = ${serialize(apiBaseUrl)};</script>`].join("");

    const payload: RenderPayload = {
      status: router.state.statusCode ?? 200,
      head: "",
      html: appHtml,
      scripts: `${injectedHtml}${hydrationScripts}`,
      headers: Array.from(responseHeaders.entries()),
    };

    return new Response(JSON.stringify(payload), {
      status: payload.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  });

  const payload = (await response.json()) as RenderPayload;

  return {
    status: payload.status ?? response.status ?? 200,
    head: payload.head ?? "",
    html: payload.html ?? "",
    scripts: payload.scripts ?? "",
    headers: payload.headers ?? [],
  };
}
