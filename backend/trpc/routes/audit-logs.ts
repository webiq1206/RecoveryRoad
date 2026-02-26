import * as z from "zod";
import { createTRPCRouter, publicProcedure, authenticatedProcedure } from "../create-context";
import { db } from "../../db/client";

export const auditLogsRouter = createTRPCRouter({
  log: publicProcedure
    .input(z.object({
      id: z.string(),
      userId: z.string(),
      action: z.string(),
      details: z.string(),
      ipHash: z.string().optional(),
      sessionId: z.string().optional(),
      success: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      return db.create("audit_logs", {
        ...input,
        timestamp: new Date().toISOString(),
      });
    }),

  getByUserId: authenticatedProcedure
    .input(z.object({
      userId: z.string(),
      limit: z.number().default(100),
      action: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const filters: Record<string, unknown> = { userId: input.userId };
      if (input.action) filters.action = input.action;
      return db.query("audit_logs", filters, {
        limit: input.limit,
        orderBy: "timestamp",
        order: "desc",
      });
    }),
});
