import * as z from "zod";
import { createTRPCRouter, publicProcedure, authenticatedProcedure } from "../create-context";
import { db } from "../../db/client";

export const relapseRiskRouter = createTRPCRouter({
  record: authenticatedProcedure
    .input(z.object({
      id: z.string(),
      userId: z.string(),
      overallRisk: z.number(),
      emotionalRisk: z.number(),
      behavioralRisk: z.number(),
      triggerRisk: z.number(),
      stabilityRisk: z.number(),
      trend: z.enum(["rising", "stable", "falling"]),
      confidence: z.number(),
      predictiveFactors: z.string(),
      interventionSuggested: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return db.create("relapse_risk_history", {
        ...input,
        generatedAt: new Date().toISOString(),
      });
    }),

  getHistory: publicProcedure
    .input(z.object({
      userId: z.string(),
      limit: z.number().default(60),
    }))
    .query(async ({ input }) => {
      return db.query("relapse_risk_history", { userId: input.userId }, {
        limit: input.limit,
        orderBy: "generatedAt",
        order: "desc",
      });
    }),

  getLatest: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const results = await db.query("relapse_risk_history", { userId: input.userId }, {
        limit: 1,
        orderBy: "generatedAt",
        order: "desc",
      });
      return results[0] || null;
    }),

  getTrend: publicProcedure
    .input(z.object({
      userId: z.string(),
      days: z.number().default(30),
    }))
    .query(async ({ input }) => {
      const records = await db.query("relapse_risk_history", { userId: input.userId }, {
        limit: input.days,
        orderBy: "generatedAt",
        order: "desc",
      });
      return records;
    }),
});
