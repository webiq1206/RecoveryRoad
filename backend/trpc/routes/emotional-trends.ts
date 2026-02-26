import * as z from "zod";
import { createTRPCRouter, publicProcedure, authenticatedProcedure } from "../create-context";
import { db } from "../../db/client";

export const emotionalTrendsRouter = createTRPCRouter({
  record: authenticatedProcedure
    .input(z.object({
      id: z.string(),
      userId: z.string(),
      date: z.string(),
      dominantEmotion: z.string(),
      emotionScores: z.string(),
      moodAverage: z.number(),
      volatility: z.number(),
      patternDetected: z.string().optional(),
      weekNumber: z.number(),
    }))
    .mutation(async ({ input }) => {
      return db.create("emotional_trends", {
        ...input,
        createdAt: new Date().toISOString(),
      });
    }),

  getByUserId: publicProcedure
    .input(z.object({
      userId: z.string(),
      limit: z.number().default(90),
    }))
    .query(async ({ input }) => {
      return db.query("emotional_trends", { userId: input.userId }, {
        limit: input.limit,
        orderBy: "date",
        order: "desc",
      });
    }),

  getWeeklyPatterns: publicProcedure
    .input(z.object({
      userId: z.string(),
      weeks: z.number().default(12),
    }))
    .query(async ({ input }) => {
      return db.query("emotional_trends", { userId: input.userId }, {
        limit: input.weeks * 7,
        orderBy: "date",
        order: "desc",
      });
    }),
});
