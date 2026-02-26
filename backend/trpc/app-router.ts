import { createTRPCRouter } from "./create-context";
import { usersRouter } from "./routes/users";
import { recoveryProfilesRouter } from "./routes/recovery-profiles";
import { checkInsRouter } from "./routes/check-ins";
import { stabilityScoresRouter } from "./routes/stability-scores";
import { triggersRouter } from "./routes/triggers";
import { relapseRiskRouter } from "./routes/relapse-risk";
import { emotionalTrendsRouter } from "./routes/emotional-trends";
import { habitsRouter } from "./routes/habits";
import { goalsRouter } from "./routes/goals";
import { crisisSessionsRouter } from "./routes/crisis-sessions";
import { aiInteractionsRouter } from "./routes/ai-interactions";
import { connectionGroupsRouter } from "./routes/connection-groups";
import { accountabilityRouter } from "./routes/accountability";
import { complianceRouter } from "./routes/compliance";
import { therapistAccessRouter } from "./routes/therapist-access";
import { notificationsRouter } from "./routes/notifications";
import { stageHistoryRouter } from "./routes/stage-history";
import { journalsRouter } from "./routes/journals";
import { auditLogsRouter } from "./routes/audit-logs";

export const appRouter = createTRPCRouter({
  users: usersRouter,
  recoveryProfiles: recoveryProfilesRouter,
  checkIns: checkInsRouter,
  stabilityScores: stabilityScoresRouter,
  triggers: triggersRouter,
  relapseRisk: relapseRiskRouter,
  emotionalTrends: emotionalTrendsRouter,
  habits: habitsRouter,
  goals: goalsRouter,
  crisisSessions: crisisSessionsRouter,
  aiInteractions: aiInteractionsRouter,
  connectionGroups: connectionGroupsRouter,
  accountability: accountabilityRouter,
  compliance: complianceRouter,
  therapistAccess: therapistAccessRouter,
  notifications: notificationsRouter,
  stageHistory: stageHistoryRouter,
  journals: journalsRouter,
  auditLogs: auditLogsRouter,
});

export type AppRouter = typeof appRouter;
