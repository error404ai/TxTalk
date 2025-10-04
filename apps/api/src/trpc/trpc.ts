import { initTRPC } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { Context as HonoContext } from "hono";
import superjson from "superjson";

export interface Context extends Record<string, unknown> {
  req?: Request;
  honoContext?: HonoContext;
}

export const createContext = ({ req }: FetchCreateContextFnOptions, honoContext?: HonoContext): Context => ({
  req,
  honoContext,
});

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const createTRPCRouter = t.router;
export const mergeTRPCRouters = t.mergeRouters;
export const publicProcedure = t.procedure;
