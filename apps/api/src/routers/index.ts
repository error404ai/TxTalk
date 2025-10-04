import { createTRPCRouter } from "../trpc/trpc.js";
import { healthRouter } from "./health.js";

export const appRouter = createTRPCRouter({
  health: healthRouter,
});

export type AppRouter = typeof appRouter;
