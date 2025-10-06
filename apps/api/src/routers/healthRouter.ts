import { createTRPCRouter, publicProcedure } from "../trpc/trpc";

export const healthRouter = createTRPCRouter({
  ping: publicProcedure.query(() => ({
    status: "ok",
    message: "txtalk API is up and running",
    timestamp: new Date().toISOString(),
  })),
});
