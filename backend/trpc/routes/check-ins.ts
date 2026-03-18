import * as z from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  authenticatedProcedure,
} from "../create-context";
import { db } from "../../db/client";

export const checkInsRouter = createTRPCRouter({
  create: authenticatedProcedure
    .input(
      z.object({
        id: z.string(),
        userId: z.string(),
        date: z.string().min(1, "date is required"),
        mood: z.number().min(1).max(10),
        cravingLevel: z.number().min(1).max(10),
        stress: z.number().min(1).max(10),
        sleepQuality: z.number().min(1).max(10),
        environment: z.number().min(1).max(10),
        emotionalState: z.number().min(1).max(10),
        stabilityScore: z.number(),
        reflection: z.string().optional(),
        emotionalTags: z.array(z.string()).max(3).optional(),
        isEncrypted: z.boolean().default(false),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (input.userId !== ctx.auth.userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot create check-in for another user" });
      }

      const checkIn = { ...input, completedAt: new Date().toISOString() };

      try {
        return await db.create("check_ins", checkIn);
      } catch (error) {
        console.error("[CheckIns] Failed to create check-in:", {
          id: checkIn.id,
          userId: checkIn.userId,
          error,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to save check-in right now. Please try again.",
        });
      }
    }),

  getByUserId: publicProcedure
    .input(z.object({
      userId: z.string(),
      limit: z.number().default(30),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      return db.query("check_ins", { userId: input.userId }, {
        limit: input.limit,
        offset: input.offset,
        orderBy: "date",
        order: "desc",
      });
    }),

  getByDateRange: publicProcedure
    .input(z.object({
      userId: z.string(),
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ input }) => {
      const allCheckIns = await db.query("check_ins", { userId: input.userId });
      return allCheckIns.filter((ci: Record<string, unknown>) => {
        const date = ci.date as string;
        return date >= input.startDate && date <= input.endDate;
      });
    }),

  getLatest: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const results = await db.query("check_ins", { userId: input.userId }, {
        limit: 1,
        orderBy: "date",
        order: "desc",
      });
      return results[0] || null;
    }),
});
