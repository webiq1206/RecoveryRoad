import { initTRPC } from "@trpc/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const authHeader = opts.req.headers.get("authorization");
  const userId = opts.req.headers.get("x-user-id");
  const isAnonymous = opts.req.headers.get("x-anonymous-mode") === "true";

  return {
    req: opts.req,
    userId: userId || null,
    isAnonymous,
    authToken: authHeader?.replace("Bearer ", "") || null,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const authenticatedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new Error("Authentication required");
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});
