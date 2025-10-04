import { createTRPCRouter } from "../trpc/trpc.js";
import { healthRouter } from "./health.js";
import { messagesRouter } from "./messages.js";

export const appRouter = createTRPCRouter({
  health: healthRouter,
  messages: messagesRouter,
});

export type AppRouter = typeof appRouter;
