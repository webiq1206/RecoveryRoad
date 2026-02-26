import * as z from "zod";
import { createTRPCRouter, publicProcedure, authenticatedProcedure } from "../create-context";
import { db } from "../../db/client";

export const stageHistoryRouter = createTRPCRouter({
  record: authenticatedProcedure
    .input(z.object({
      id: z.string(),
      userId: z.string(),
      fromStage: z.enum(["crisis", "stabilize", "rebuild", "maintain"]).optional(),
      toStage: z.enum(["crisis", "stabilize", "rebuild", "maintain"]),
      reason: z.string(),
      signals: z.string(),
      stabilityScoreAtTransition: z.number(),
      isAutomatic: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      return db.create("stage_history", {
        ...input,
        triggeredAt: new Date().toISOString(),
      });
    }),

  getByUserId: publicProcedure
    .input(z.object({
      userId: z.string(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      return db.query("stage_history", { userId: input.userId }, {
        limit: input.limit,
        orderBy: "triggeredAt",
        order: "desc",
      });
    }),

  acknowledge: authenticatedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return db.update("stage_history", input.id, {
        acknowledgedAt: new Date().toISOString(),
      });
    }),

  getCurrentStage: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const results = await db.query("stage_history", { userId: input.userId }, {
        limit: 1,
        orderBy: "triggeredAt",
        order: "desc",
      });
      return results[0] || null;
    }),
});
