import { trpcServer } from "@hono/trpc-server";
import type { Context as HonoContext } from "hono";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { AppDataSource, initializeDatabase } from "./database.js";
import { appRouter } from "./routers/index.js";
import { createContext } from "./trpc/trpc.js";

const app = new Hono();
let dbInitPromise: Promise<void> | null = null;

async function ensureDatabaseInitialized(): Promise<void> {
  if (AppDataSource.isInitialized) return;
  if (!dbInitPromise) {
    dbInitPromise = initializeDatabase().then(() => {
      console.log("✅ Database connection established successfully!");
    });
  }
  await dbInitPromise;
}

const corsOrigins = (process.env.CORS_ORIGINS || process.env.VITE_APP_URL || "http://localhost:5173")
  .split(",")
  .map((origin: string) => origin.trim())
  .filter(Boolean);

app.use(
  "*",
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);

app.get("/", async (c: HonoContext) => {
  await ensureDatabaseInitialized();
  return c.json({
    status: "ok",
    message: "solMessage Hono + tRPC server is running",
    database: AppDataSource.isInitialized ? "connected" : "disconnected",
    endpoints: {
      trpc: "/trpc",
      health: "/",
    },
  });
});

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    endpoint: "/trpc",
    createContext,
  })
);

await ensureDatabaseInitialized();

export default app;
export type { AppRouter } from "./routers/index.js";
