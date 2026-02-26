import * as z from "zod";
import { createTRPCRouter, publicProcedure, authenticatedProcedure } from "../create-context";
import { db } from "../../db/client";

export const habitsRouter = createTRPCRouter({
  create: authenticatedProcedure
    .input(z.object({
      id: z.string(),
      userId: z.string(),
      oldTrigger: z.string(),
      newHabit: z.string(),
      category: z.enum(["physical", "mental", "social", "creative", "spiritual"]),
    }))
    .mutation(async ({ input }) => {
      const now = new Date().toISOString();
      return db.create("habits", {
        ...input,
        streak: 0,
        longestStreak: 0,
        completionCount: 0,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }),

  getByUserId: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return db.query("habits", { userId: input.userId, isActive: true });
    }),

  complete: authenticatedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const existing = await db.getById("habits", input.id);
      if (!existing) throw new Error("Habit not found");
      const record = existing as Record<string, unknown>;
      const newStreak = (record.streak as number || 0) + 1;
      const longestStreak = Math.max(newStreak, record.longestStreak as number || 0);
      return db.update("habits", input.id, {
        streak: newStreak,
        longestStreak,
        completionCount: (record.completionCount as number || 0) + 1,
        lastCompleted: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }),

  update: authenticatedProcedure
    .input(z.object({
      id: z.string(),
      newHabit: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.update("habits", id, { ...data, updatedAt: new Date().toISOString() });
    }),
});
