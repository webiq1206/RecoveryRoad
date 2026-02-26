import * as z from "zod";
import { createTRPCRouter, publicProcedure, authenticatedProcedure } from "../create-context";
import { db } from "../../db/client";

export const journalsRouter = createTRPCRouter({
  create: authenticatedProcedure
    .input(z.object({
      id: z.string(),
      userId: z.string(),
      date: z.string(),
      title: z.string(),
      content: z.string(),
      mood: z.number().min(1).max(5),
      tags: z.array(z.string()).optional(),
      isEncrypted: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const now = new Date().toISOString();
      return db.create("journal_entries", {
        ...input,
        createdAt: now,
        updatedAt: now,
      });
    }),

  getByUserId: publicProcedure
    .input(z.object({
      userId: z.string(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      return db.query("journal_entries", { userId: input.userId }, {
        limit: input.limit,
        offset: input.offset,
        orderBy: "date",
        order: "desc",
      });
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.getById("journal_entries", input.id);
    }),

  update: authenticatedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().optional(),
      content: z.string().optional(),
      mood: z.number().min(1).max(5).optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.update("journal_entries", id, { ...data, updatedAt: new Date().toISOString() });
    }),

  delete: authenticatedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return db.delete("journal_entries", input.id);
    }),
});
