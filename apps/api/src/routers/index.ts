import { createTRPCRouter } from "../trpc/trpc.js";
import { healthRouter } from "./health.js";
import { messageRouter } from "./message.js";

export const appRouter = createTRPCRouter({
  health: healthRouter,
  message: messageRouter,
});

export type AppRouter = typeof appRouter;
