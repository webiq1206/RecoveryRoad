import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

app.use("*", cors());

app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  }),
);

app.get("/", (c) => {
  return c.json({ status: "ok", message: "Recovery Companion API is running" });
});

app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    tables: [
      "users", "recovery_profiles", "check_ins", "stability_scores",
      "triggers", "relapse_risk_history", "emotional_trends", "habits",
      "goals", "crisis_sessions", "ai_interactions", "connection_groups",
      "accountability_contracts", "compliance_logs", "therapist_access",
      "notifications", "stage_history", "journal_entries", "audit_logs",
    ],
  });
});

export default app;
