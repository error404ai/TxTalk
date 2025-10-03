import { createRouter } from "@tanstack/react-router";
import { createRequestHandler, RouterServer } from "@tanstack/react-router/ssr/server";
import { renderToString } from "react-dom/server";
import { routeTree } from "./routeTree.gen";

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
  const handler = createRequestHandler({ request, createRouter: createAppRouter });

  const response = await handler(async ({ responseHeaders, router }) => {
    const appHtml = renderToString(<RouterServer router={router} />);

    router.serverSsr?.setRenderFinished();
    const injectedHtml = router.serverSsr ? await Promise.all(router.serverSsr.injectedHtml).then((chunks) => chunks.join("")) : "";

    const payload: RenderPayload = {
      status: router.state.statusCode ?? 200,
      head: "",
      html: appHtml,
      scripts: injectedHtml,
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
