import { createTRPCRouter } from "../trpc/trpc";
import { healthRouter } from "./healthRouter";
import { messageRouter } from "./messageRouter";

export const appRouter = createTRPCRouter({
  health: healthRouter,
  messages: messageRouter,
});

export type AppRouter = typeof appRouter;
