import * as z from "zod";
import { createTRPCRouter, publicProcedure, authenticatedProcedure } from "../create-context";
import { db } from "../../db/client";

export const therapistAccessRouter = createTRPCRouter({
  grantAccess: authenticatedProcedure
    .input(z.object({
      id: z.string(),
      userId: z.string(),
      providerId: z.string(),
      providerName: z.string(),
      providerRole: z.enum(["therapist", "counselor", "case_manager", "peer_specialist", "psychiatrist"]),
      providerOrganization: z.string().optional(),
      consentScope: z.string(),
    }))
    .mutation(async ({ input }) => {
      return db.create("therapist_access", {
        ...input,
        consentStatus: "granted" as const,
        connectedAt: new Date().toISOString(),
      });
    }),

  revokeAccess: authenticatedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return db.update("therapist_access", input.id, {
        consentStatus: "revoked",
        revokedAt: new Date().toISOString(),
      });
    }),

  getByUserId: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return db.query("therapist_access", { userId: input.userId });
    }),

  getActiveByUserId: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const all = await db.query("therapist_access", { userId: input.userId });
      return all.filter((a: Record<string, unknown>) => a.consentStatus === "granted");
    }),

  logAccess: authenticatedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return db.update("therapist_access", input.id, {
        lastAccessedAt: new Date().toISOString(),
      });
    }),

  updateScope: authenticatedProcedure
    .input(z.object({
      id: z.string(),
      consentScope: z.string(),
    }))
    .mutation(async ({ input }) => {
      return db.update("therapist_access", input.id, {
        consentScope: input.consentScope,
      });
    }),
});
