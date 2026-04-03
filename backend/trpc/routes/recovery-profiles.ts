import * as z from "zod";
import { createTRPCRouter, publicProcedure, authenticatedProcedure } from "../create-context";
import { db } from "../../db/client";

export const recoveryProfilesRouter = createTRPCRouter({
  upsert: authenticatedProcedure
    .input(z.object({
      id: z.string(),
      userId: z.string(),
      recoveryStage: z.enum(["crisis", "stabilize", "rebuild", "maintain"]),
      struggleLevel: z.number().min(1).max(5),
      relapseCount: z.number().default(0),
      soberDate: z.string(),
      addictions: z.array(z.string()),
      triggers: z.array(z.string()),
      sleepQuality: z.enum(["poor", "fair", "good", "excellent"]),
      supportAvailability: z.enum(["none", "limited", "moderate", "strong"]),
      goals: z.array(z.string()),
      riskScore: z.number().default(0),
      interventionIntensity: z.enum(["low", "moderate", "high", "critical"]),
      baselineStabilityScore: z.number().default(50),
      dailySavings: z.number().default(0),
      timeSpentDaily: z.number().optional(),
      motivation: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const now = new Date().toISOString();
      const existing = await db.getById("recovery_profiles", input.id);
      if (existing) {
        return db.update("recovery_profiles", input.id, { ...input, updatedAt: now });
      }
      return db.create("recovery_profiles", { ...input, createdAt: now, updatedAt: now });
    }),

  getByUserId: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const results = await db.query("recovery_profiles", { userId: input.userId });
      return results[0] || null;
    }),

  updateStage: authenticatedProcedure
    .input(z.object({
      id: z.string(),
      recoveryStage: z.enum(["crisis", "stabilize", "rebuild", "maintain"]),
      riskScore: z.number().optional(),
      interventionIntensity: z.enum(["low", "moderate", "high", "critical"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.update("recovery_profiles", id, { ...data, updatedAt: new Date().toISOString() });
    }),
});
