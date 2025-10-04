import { createTRPCRouter, publicProcedure } from "../trpc/trpc";

export const healthRouter = createTRPCRouter({
  ping: publicProcedure.query(() => ({
    status: "ok",
    message: "solMessage API is up and running",
    timestamp: new Date().toISOString(),
  })),
});
