import * as z from "zod";
import { createTRPCRouter, publicProcedure, authenticatedProcedure } from "../create-context";
import { db } from "../../db/client";

export const goalsRouter = createTRPCRouter({
  create: authenticatedProcedure
    .input(z.object({
      id: z.string(),
      userId: z.string(),
      title: z.string(),
      description: z.string(),
      category: z.enum(["career", "health", "relationships", "learning", "personal"]),
      targetDate: z.string(),
      milestoneSteps: z.string(),
    }))
    .mutation(async ({ input }) => {
      const now = new Date().toISOString();
      return db.create("goals", {
        ...input,
        progress: 0,
        isCompleted: false,
        createdAt: now,
        updatedAt: now,
      });
    }),

  getByUserId: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return db.query("goals", { userId: input.userId });
    }),

  updateProgress: authenticatedProcedure
    .input(z.object({
      id: z.string(),
      progress: z.number().min(0).max(100),
      milestoneSteps: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const isCompleted = input.progress >= 100;
      return db.update("goals", id, {
        ...data,
        isCompleted,
        completedAt: isCompleted ? new Date().toISOString() : undefined,
        updatedAt: new Date().toISOString(),
      });
    }),

  delete: authenticatedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return db.delete("goals", input.id);
    }),
});
