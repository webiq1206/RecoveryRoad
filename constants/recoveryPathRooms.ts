import type { RecoveryPathId } from "./recoveryPaths";

/** Demo room shape — replace with API data later */
export type RoomStatusBadge = "live" | "open";

export type DemoRoom = {
  id: string;
  name: string;
  description: string;
  activeUsers: number;
  status: RoomStatusBadge;
  /** When `activeUsers` >= MAX_ROOM_USERS, UI offers navigation here */
  overflowRoomId?: string;
};

export const MAX_ROOM_USERS = 20;

export const PATH_DEMO_ROOMS: Record<RecoveryPathId, readonly DemoRoom[]> = {
  stabilize: [
    {
      id: "stabilize-dawn-checkin",
      name: "Dawn check-in",
      description: "Short grounding before the day starts—no advice, just presence.",
      activeUsers: 20,
      status: "live",
      overflowRoomId: "stabilize-dawn-overflow",
    },
    {
      id: "stabilize-dawn-overflow",
      name: "Dawn check-in (overflow)",
      description: "Same rhythm as the main room when it’s at capacity.",
      activeUsers: 9,
      status: "open",
    },
    {
      id: "stabilize-sleep-reset",
      name: "Sleep reset lab",
      description: "Wind-down scripts and screen-off wins for early recovery nights.",
      activeUsers: 14,
      status: "open",
    },
  ],
  build_control: [
    {
      id: "build-urge-skills",
      name: "Urge skills floor",
      description: "Practice STOP, surf, and replacement actions with timed reps.",
      activeUsers: 17,
      status: "live",
    },
    {
      id: "build-pattern-review",
      name: "Pattern review",
      description: "Weekly review of triggers, slips, and what actually worked.",
      activeUsers: 20,
      status: "open",
      overflowRoomId: "build-pattern-overflow",
    },
    {
      id: "build-pattern-overflow",
      name: "Pattern review (overflow)",
      description: "Overflow space when the main review room is full.",
      activeUsers: 6,
      status: "open",
    },
  ],
  repair_life: [
    {
      id: "repair-trust-window",
      name: "Trust repair window",
      description: "Small, honest steps after harm—boundaries without performance.",
      activeUsers: 11,
      status: "live",
    },
    {
      id: "repair-money-clarity",
      name: "Money clarity hour",
      description: "Practical planning without shame—bills, income, next right size.",
      activeUsers: 8,
      status: "open",
    },
  ],
  heal_deep: [
    {
      id: "deep-nervous-system",
      name: "Nervous system circle",
      description: "Body-first language; pacing and consent are non-negotiable.",
      activeUsers: 20,
      status: "live",
      overflowRoomId: "deep-nervous-overflow",
    },
    {
      id: "deep-nervous-overflow",
      name: "Nervous system (overflow)",
      description: "Parallel circle when the main room reaches capacity.",
      activeUsers: 12,
      status: "open",
    },
  ],
  grow_forward: [
    {
      id: "grow-purpose-studio",
      name: "Purpose studio",
      description: "Identity beyond survival—values, roles, and meaningful next steps.",
      activeUsers: 15,
      status: "open",
    },
    {
      id: "grow-momentum-lab",
      name: "Momentum lab",
      description: "Accountability for long-arc goals without hustle toxicity.",
      activeUsers: 19,
      status: "live",
    },
  ],
  give_back: [
    {
      id: "give-mentor-guild",
      name: "Mentor guild",
      description: "Share experience carefully—boundaries, humility, and self-care.",
      activeUsers: 20,
      status: "live",
      overflowRoomId: "give-mentor-overflow",
    },
    {
      id: "give-mentor-overflow",
      name: "Mentor guild (overflow)",
      description: "Overflow mentor space with the same agreements.",
      activeUsers: 4,
      status: "open",
    },
    {
      id: "give-service-design",
      name: "Service design",
      description: "Sustainable volunteering and leadership without burnout.",
      activeUsers: 10,
      status: "open",
    },
  ],
};

export function getDemoRoomsForPath(pathId: RecoveryPathId | null | undefined): DemoRoom[] {
  if (!pathId) return [];
  return [...PATH_DEMO_ROOMS[pathId]];
}

export function findDemoRoomById(roomId: string | undefined): DemoRoom | null {
  if (!roomId) return null;
  for (const path of Object.keys(PATH_DEMO_ROOMS) as RecoveryPathId[]) {
    const hit = PATH_DEMO_ROOMS[path].find((r) => r.id === roomId);
    if (hit) return hit;
  }
  return null;
}

export function isRoomFull(room: DemoRoom): boolean {
  return room.activeUsers >= MAX_ROOM_USERS;
}
