import * as z from "zod";
import { createTRPCRouter, publicProcedure, authenticatedProcedure } from "../create-context";
import { db } from "../../db/client";

export const notificationsRouter = createTRPCRouter({
  create: authenticatedProcedure
    .input(z.object({
      id: z.string(),
      userId: z.string(),
      type: z.enum([
        "check_in_reminder", "risk_alert", "milestone_reached", "streak_warning",
        "crisis_followup", "compliance_due", "therapist_message",
        "community_activity", "encouragement", "stage_change",
      ]),
      title: z.string(),
      message: z.string(),
      severity: z.enum(["info", "caution", "warning", "critical"]).default("info"),
      route: z.string().optional(),
      scheduledAt: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return db.create("notifications", {
        ...input,
        isRead: false,
        isDismissed: false,
        sentAt: new Date().toISOString(),
      });
    }),

  getByUserId: publicProcedure
    .input(z.object({
      userId: z.string(),
      unreadOnly: z.boolean().default(false),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const filters: Record<string, unknown> = { userId: input.userId };
      if (input.unreadOnly) filters.isRead = false;
      return db.query("notifications", filters, {
        limit: input.limit,
        orderBy: "sentAt",
        order: "desc",
      });
    }),

  markRead: authenticatedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return db.update("notifications", input.id, {
        isRead: true,
        readAt: new Date().toISOString(),
      });
    }),

  markAllRead: authenticatedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      const unread = await db.query("notifications", { userId: input.userId, isRead: false });
      const now = new Date().toISOString();
      await Promise.all(
        unread.map((n: Record<string, unknown>) =>
          db.update("notifications", n.id as string, { isRead: true, readAt: now })
        )
      );
      return { updated: unread.length };
    }),

  dismiss: authenticatedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return db.update("notifications", input.id, { isDismissed: true });
    }),

  getUnreadCount: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const unread = await db.query("notifications", { userId: input.userId, isRead: false });
      return { count: unread.length };
    }),
});
