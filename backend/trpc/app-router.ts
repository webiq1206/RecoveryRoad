/**
 * Minimal AppRouter for the Expo client. Extend with procedures when the API is wired.
 */
import { initTRPC } from '@trpc/server';
import superjson from 'superjson';

const t = initTRPC.create({
  transformer: superjson,
});

export const appRouter = t.router({});

export type AppRouter = typeof appRouter;
