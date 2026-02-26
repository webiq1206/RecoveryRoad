import * as z from "zod";
import { createTRPCRouter, publicProcedure, authenticatedProcedure } from "../create-context";
import { db } from "../../db/client";

export const accountabilityRouter = createTRPCRouter({
  createContract: authenticatedProcedure
    .input(z.object({
      id: z.string(),
      userId: z.string(),
      title: z.string(),
      description: z.string(),
      category: z.enum(["sobriety", "health", "relationships", "growth", "boundaries"]),
      partnerId: z.string().optional(),
      partnerName: z.string().optional(),
      expiresAt: z.string(),
    }))
    .mutation(async ({ input }) => {
      const now = new Date().toISOString();
      return db.create("accountability_contracts", {
        ...input,
        isActive: true,
        streakDays: 0,
        createdAt: now,
        updatedAt: now,
      });
    }),

  getContracts: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return db.query("accountability_contracts", { userId: input.userId, isActive: true });
    }),

  checkIn: authenticatedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const contract = await db.getById("accountability_contracts", input.id);
      if (!contract) throw new Error("Contract not found");
      const record = contract as Record<string, unknown>;
      return db.update("accountability_contracts", input.id, {
        streakDays: (record.streakDays as number || 0) + 1,
        lastCheckedIn: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }),

  deactivate: authenticatedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return db.update("accountability_contracts", input.id, {
        isActive: false,
        updatedAt: new Date().toISOString(),
      });
    }),
});
