import * as z from "zod";
import { createTRPCRouter, publicProcedure, authenticatedProcedure } from "../create-context";
import { db } from "../../db/client";

export const connectionGroupsRouter = createTRPCRouter({
  create: authenticatedProcedure
    .input(z.object({
      id: z.string(),
      ownerId: z.string(),
      name: z.string(),
      description: z.string().optional(),
      type: z.enum(["safe_room", "private_group", "peer_chat", "recovery_room"]),
      topic: z.string().optional(),
      maxMembers: z.number().default(20),
      isAnonymous: z.boolean().default(true),
      rules: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      const now = new Date().toISOString();
      return db.create("connection_groups", {
        ...input,
        memberCount: 1,
        isActive: true,
        createdAt: now,
        lastActivity: now,
      });
    }),

  getAll: publicProcedure
    .input(z.object({
      type: z.enum(["safe_room", "private_group", "peer_chat", "recovery_room"]).optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const filters: Record<string, unknown> = { isActive: true };
      if (input.type) filters.type = input.type;
      return db.query("connection_groups", filters, { limit: input.limit });
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.getById("connection_groups", input.id);
    }),

  updateActivity: authenticatedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return db.update("connection_groups", input.id, {
        lastActivity: new Date().toISOString(),
      });
    }),

  updateMemberCount: authenticatedProcedure
    .input(z.object({ id: z.string(), delta: z.number() }))
    .mutation(async ({ input }) => {
      const group = await db.getById("connection_groups", input.id);
      if (!group) throw new Error("Group not found");
      const currentCount = (group as Record<string, unknown>).memberCount as number || 0;
      return db.update("connection_groups", input.id, {
        memberCount: Math.max(0, currentCount + input.delta),
      });
    }),
});
