import * as z from "zod";
import { createTRPCRouter, publicProcedure, authenticatedProcedure } from "../create-context";
import { db } from "../../db/client";

export const crisisSessionsRouter = createTRPCRouter({
  start: authenticatedProcedure
    .input(z.object({
      id: z.string(),
      userId: z.string(),
      triggerDescription: z.string().optional(),
      cravingLevelStart: z.number(),
    }))
    .mutation(async ({ input }) => {
      return db.create("crisis_sessions", {
        ...input,
        startedAt: new Date().toISOString(),
        techniquesUsed: [],
        contactedSupport: false,
        isEncrypted: false,
      });
    }),

  end: authenticatedProcedure
    .input(z.object({
      id: z.string(),
      cravingLevelEnd: z.number(),
      techniquesUsed: z.array(z.string()),
      contactedSupport: z.boolean(),
      outcome: z.enum(["resolved", "escalated", "ongoing", "relapsed"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.update("crisis_sessions", id, {
        ...data,
        endedAt: new Date().toISOString(),
      });
    }),

  getByUserId: publicProcedure
    .input(z.object({
      userId: z.string(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      return db.query("crisis_sessions", { userId: input.userId }, {
        limit: input.limit,
        orderBy: "startedAt",
        order: "desc",
      });
    }),

  getActive: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const sessions = await db.query("crisis_sessions", { userId: input.userId });
      return sessions.filter((s: Record<string, unknown>) => !s.endedAt);
    }),
});
