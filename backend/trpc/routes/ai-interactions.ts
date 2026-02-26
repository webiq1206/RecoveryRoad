import * as z from "zod";
import { createTRPCRouter, publicProcedure, authenticatedProcedure } from "../create-context";
import { db } from "../../db/client";

export const aiInteractionsRouter = createTRPCRouter({
  log: authenticatedProcedure
    .input(z.object({
      id: z.string(),
      userId: z.string(),
      sessionId: z.string(),
      type: z.enum(["companion_chat", "crisis_support", "check_in_analysis", "risk_assessment", "stage_evaluation"]),
      prompt: z.string(),
      response: z.string(),
      tone: z.enum(["encouraging", "supportive", "urgent", "crisis", "celebratory"]),
      contextData: z.string().optional(),
      isEncrypted: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      return db.create("ai_interactions", {
        ...input,
        createdAt: new Date().toISOString(),
      });
    }),

  rate: authenticatedProcedure
    .input(z.object({
      id: z.string(),
      feedbackRating: z.number().min(1).max(5),
    }))
    .mutation(async ({ input }) => {
      return db.update("ai_interactions", input.id, {
        feedbackRating: input.feedbackRating,
      });
    }),

  getBySession: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      return db.query("ai_interactions", { sessionId: input.sessionId }, {
        orderBy: "createdAt",
        order: "asc",
      });
    }),

  getByUserId: publicProcedure
    .input(z.object({
      userId: z.string(),
      type: z.enum(["companion_chat", "crisis_support", "check_in_analysis", "risk_assessment", "stage_evaluation"]).optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const filters: Record<string, unknown> = { userId: input.userId };
      if (input.type) filters.type = input.type;
      return db.query("ai_interactions", filters, {
        limit: input.limit,
        orderBy: "createdAt",
        order: "desc",
      });
    }),
});
