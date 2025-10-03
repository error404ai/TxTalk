import express from "express";
import fs from "node:fs/promises";

// Constants
const isProduction = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || "/";

// Cached production assets
const templateHtml = isProduction ? await fs.readFile("./dist/client/index.html", "utf-8") : "";

// Create http server
const app = express();

// Add Vite or respective production middlewares
/** @type {import('vite').ViteDevServer | undefined} */
let vite;
if (!isProduction) {
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    base,
  });
  app.use(vite.middlewares);
} else {
  const compression = (await import("compression")).default;
  const sirv = (await import("sirv")).default;
  app.use(compression());
  app.use(base, sirv("./dist/client", { extensions: [] }));
}

const createRequestFromExpress = (req) => {
  const origin = `${req.protocol}://${req.get("host")}`;
  const fullUrl = new URL(req.originalUrl, origin);
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) {
        headers.append(key, v);
      }
    } else {
      headers.append(key, value);
    }
  }

  return new Request(fullUrl, {
    method: req.method,
    headers,
  });
};

// Serve HTML
app.use("*all", async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "");

    /** @type {string} */
    let template;
    /** @type {import('./src/entry-server.ts').render} */
    let render;
    if (!isProduction) {
      // Always read fresh template in development
      template = await fs.readFile("./index.html", "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("/src/entry-server.tsx")).render;
    } else {
      template = templateHtml;
      render = (await import("./dist/server/entry-server.js")).render;
    }

    const request = createRequestFromExpress(req);
    const rendered = await render(request);

    if (rendered.headers) {
      for (const [key, value] of rendered.headers) {
        const lower = key.toLowerCase();
        if (lower === "content-type") continue;
        if (lower === "set-cookie") {
          res.append(key, value);
          continue;
        }
        if (lower === "location") {
          res.setHeader(key, value);
          continue;
        }
        res.setHeader(key, value);
      }
    }

    const status = rendered.status ?? 200;
    const locationHeader = rendered.headers?.find?.(([key]) => key.toLowerCase() === "location")?.[1];

    if (locationHeader && status >= 300 && status < 400) {
      res.redirect(status, locationHeader);
      return;
    }

    const html = template
      .replace(`<!--app-head-->`, rendered.head ?? "")
      .replace(`<!--app-html-->`, rendered.html ?? "")
      .replace(`<!--app-scripts-->`, rendered.scripts ?? "");

    res.status(status).set({ "Content-Type": "text/html" }).send(html);
  } catch (e) {
    vite?.ssrFixStacktrace(e);
    console.log(e.stack);
    res.status(500).end(e.stack);
  }
});

// Start http server
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
