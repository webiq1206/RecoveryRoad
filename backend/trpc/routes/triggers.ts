import * as z from "zod";
import { createTRPCRouter, publicProcedure, authenticatedProcedure } from "../create-context";
import { db } from "../../db/client";

export const triggersRouter = createTRPCRouter({
  create: authenticatedProcedure
    .input(z.object({
      id: z.string(),
      userId: z.string(),
      name: z.string(),
      category: z.enum(["emotional", "environmental", "social", "physical", "cognitive"]),
      intensity: z.number().min(1).max(10),
      copingStrategies: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      const now = new Date().toISOString();
      return db.create("triggers", {
        ...input,
        frequency: 0,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }),

  getByUserId: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return db.query("triggers", { userId: input.userId, isActive: true });
    }),

  recordTriggerEvent: authenticatedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const existing = await db.getById("triggers", input.id);
      if (!existing) throw new Error("Trigger not found");
      const currentFreq = (existing as Record<string, unknown>).frequency as number || 0;
      return db.update("triggers", input.id, {
        frequency: currentFreq + 1,
        lastTriggeredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }),

  update: authenticatedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      intensity: z.number().min(1).max(10).optional(),
      copingStrategies: z.array(z.string()).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.update("triggers", id, { ...data, updatedAt: new Date().toISOString() });
    }),
});
