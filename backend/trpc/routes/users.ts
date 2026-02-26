import * as z from "zod";
import { createTRPCRouter, publicProcedure, authenticatedProcedure } from "../create-context";
import { db } from "../../db/client";
import { UserSchema } from "../../db/schema";

export const usersRouter = createTRPCRouter({
  create: publicProcedure
    .input(UserSchema.omit({ updatedAt: true, lastActiveAt: true }).partial({ 
      anonymousId: true, 
      isAnonymous: true,
      consentDataSharing: true,
      consentAnalytics: true,
      consentTherapistAccess: true,
      authMethod: true,
      securityLevel: true,
      isDeleted: true,
    }))
    .mutation(async ({ input }) => {
      const now = new Date().toISOString();
      const user = {
        ...input,
        anonymousId: input.anonymousId || `anon_${Date.now()}`,
        isAnonymous: input.isAnonymous ?? true,
        consentDataSharing: input.consentDataSharing ?? false,
        consentAnalytics: input.consentAnalytics ?? false,
        consentTherapistAccess: input.consentTherapistAccess ?? false,
        authMethod: input.authMethod ?? ("none" as const),
        securityLevel: input.securityLevel ?? ("standard" as const),
        isDeleted: input.isDeleted ?? false,
        updatedAt: now,
        lastActiveAt: now,
      };
      console.log("[Users] Creating user:", user.id);
      return db.create("users", user);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.getById("users", input.id);
    }),

  update: authenticatedProcedure
    .input(z.object({
      id: z.string(),
      data: UserSchema.partial().omit({ id: true }),
    }))
    .mutation(async ({ input }) => {
      const updateData = { ...input.data, updatedAt: new Date().toISOString() };
      return db.update("users", input.id, updateData);
    }),

  updateConsent: authenticatedProcedure
    .input(z.object({
      id: z.string(),
      consentDataSharing: z.boolean().optional(),
      consentAnalytics: z.boolean().optional(),
      consentTherapistAccess: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...consentData } = input;
      return db.update("users", id, { ...consentData, updatedAt: new Date().toISOString() });
    }),

  softDelete: authenticatedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return db.update("users", input.id, { isDeleted: true, updatedAt: new Date().toISOString() });
    }),

  updateActivity: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return db.update("users", input.id, { lastActiveAt: new Date().toISOString() });
    }),
});
