import { serve } from "@hono/node-server";
import "dotenv/config";
import app from "./app";

const port = Number(process.env.PORT || 8000);

serve({
  fetch: app.fetch,
  port,
});

console.log(`🚀 API server listening on http://localhost:${port}`);
