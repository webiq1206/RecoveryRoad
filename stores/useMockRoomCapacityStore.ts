import { create } from "zustand";

import {
  MAX_ROOM_USERS,
  getCatalogOccupancyByRoomId,
} from "../constants/recoveryPathRooms";

type MockRoomCapacityState = {
  countsByRoomId: Record<string, number>;
  /** Room id the local user is counted in, if any */
  activeRoomId: string | null;
  /** Returns false when room is already at max (join blocked). */
  enterRoom: (roomId: string) => boolean;
  leaveRoom: (roomId: string) => void;
  resetToCatalog: () => void;
};

function catalog(): Record<string, number> {
  return getCatalogOccupancyByRoomId();
}

export const useMockRoomCapacityStore = create<MockRoomCapacityState>((set, get) => ({
  countsByRoomId: catalog(),
  activeRoomId: null,

  enterRoom: (roomId) => {
    const base = catalog();
    if (!(roomId in base)) return false;
    const s = get();
    if (s.activeRoomId === roomId) return true;

    const cur = s.countsByRoomId[roomId] ?? base[roomId] ?? 0;
    if (cur >= MAX_ROOM_USERS) return false;

    const next = { ...s.countsByRoomId };
    if (s.activeRoomId) {
      const pid = s.activeRoomId;
      const pCur = next[pid] ?? base[pid] ?? 0;
      next[pid] = Math.max(base[pid] ?? 0, pCur - 1);
    }
    next[roomId] = cur + 1;
    set({ countsByRoomId: next, activeRoomId: roomId });
    return true;
  },

  leaveRoom: (roomId) => {
    const base = catalog();
    if (!(roomId in base)) return;
    set((s) => {
      if (s.activeRoomId !== roomId) return s;
      const cur = s.countsByRoomId[roomId] ?? base[roomId] ?? 0;
      const nextCount = Math.max(base[roomId] ?? 0, cur - 1);
      return {
        countsByRoomId: { ...s.countsByRoomId, [roomId]: nextCount },
        activeRoomId: null,
      };
    });
  },

  resetToCatalog: () => set({ countsByRoomId: catalog(), activeRoomId: null }),
}));
