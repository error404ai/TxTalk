import { createTRPCRouter } from "../trpc/trpc";
import { healthRouter } from "./health";
import { messageRouter } from "./message";

export const appRouter = createTRPCRouter({
  health: healthRouter,
  message: messageRouter,
});

export type AppRouter = typeof appRouter;
