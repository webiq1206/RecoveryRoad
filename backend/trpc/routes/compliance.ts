import * as z from "zod";
import { createTRPCRouter, publicProcedure, authenticatedProcedure } from "../create-context";
import { db } from "../../db/client";

export const complianceRouter = createTRPCRouter({
  createLog: authenticatedProcedure
    .input(z.object({
      id: z.string(),
      userId: z.string(),
      requirementId: z.string(),
      type: z.enum(["checkin", "breath_test", "location_verify", "meeting_attendance", "curfew"]),
      status: z.enum(["completed", "missed", "pending", "excused"]),
      scheduledAt: z.string(),
      note: z.string().optional(),
      verificationData: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return db.create("compliance_logs", {
        ...input,
        completedAt: input.status === "completed" ? new Date().toISOString() : undefined,
        isEncrypted: true,
      });
    }),

  getLogs: publicProcedure
    .input(z.object({
      userId: z.string(),
      limit: z.number().default(100),
    }))
    .query(async ({ input }) => {
      return db.query("compliance_logs", { userId: input.userId }, {
        limit: input.limit,
        orderBy: "scheduledAt",
        order: "desc",
      });
    }),

  updateStatus: authenticatedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(["completed", "missed", "pending", "excused"]),
      note: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.update("compliance_logs", id, {
        ...data,
        completedAt: input.status === "completed" ? new Date().toISOString() : undefined,
      });
    }),

  getComplianceRate: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const logs = await db.query("compliance_logs", { userId: input.userId });
      if (logs.length === 0) return { rate: 100, total: 0, completed: 0, missed: 0 };
      const completed = logs.filter((l: Record<string, unknown>) => l.status === "completed").length;
      const missed = logs.filter((l: Record<string, unknown>) => l.status === "missed").length;
      const rate = logs.length > 0 ? Math.round((completed / logs.length) * 100) : 100;
      return { rate, total: logs.length, completed, missed };
    }),
});
