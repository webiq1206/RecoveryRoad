import * as z from "zod";
import { createTRPCRouter, publicProcedure, authenticatedProcedure } from "../create-context";
import { db } from "../../db/client";

export const stabilityScoresRouter = createTRPCRouter({
  create: authenticatedProcedure
    .input(z.object({
      id: z.string(),
      userId: z.string(),
      score: z.number(),
      emotionalScore: z.number(),
      behavioralScore: z.number(),
      socialScore: z.number(),
      physicalScore: z.number(),
      trend: z.enum(["rising", "stable", "falling"]),
      factors: z.string(),
    }))
    .mutation(async ({ input }) => {
      const record = { ...input, calculatedAt: new Date().toISOString() };
      return db.create("stability_scores", record);
    }),

  getHistory: publicProcedure
    .input(z.object({
      userId: z.string(),
      limit: z.number().default(90),
    }))
    .query(async ({ input }) => {
      return db.query("stability_scores", { userId: input.userId }, {
        limit: input.limit,
        orderBy: "calculatedAt",
        order: "desc",
      });
    }),

  getLatest: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const results = await db.query("stability_scores", { userId: input.userId }, {
        limit: 1,
        orderBy: "calculatedAt",
        order: "desc",
      });
      return results[0] || null;
    }),
});
