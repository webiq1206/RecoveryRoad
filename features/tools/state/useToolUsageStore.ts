import { useEffect } from 'react';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { STORAGE_KEYS, loadStorageItem, saveStorageItem } from '../../../core/persistence';
import { createSelectors } from '../../../stores/zustand/createSelectors';
import type { ToolContext, ToolId, ToolUsageEvent } from '../types';
import { minimizeContactToolUsage, minimizeStoredContactToolUsage } from './contactToolUsagePrivacy';

type ToolsUsageState = {
  events: ToolUsageEvent[];
  isLoading: boolean;
  hasHydrated: boolean;

  hydrate: () => Promise<void>;
  reset: () => void;
  logToolUsage: (input: { toolId: ToolId; context: ToolContext; action: ToolUsageEvent['action']; meta?: ToolUsageEvent['meta'] }) => void;
};

const baseUseToolUsageStore = create<ToolsUsageState>()(
  subscribeWithSelector((set, get) => ({
    events: [],
    isLoading: true,
    hasHydrated: false,

    hydrate: async () => {
      if (get().hasHydrated) return;
      set({ isLoading: true });
      const stored = await loadStorageItem<ToolUsageEvent[]>(STORAGE_KEYS.TOOLS_USAGE, []);
      if (get().hasHydrated) return;
      const cleanStored = minimizeStoredContactToolUsage(stored);
      const pending = get().events;
      const events = pending.length ? [...pending, ...cleanStored].slice(0, 500) : cleanStored;
      if (events !== stored) {
        // Retry on the next hydration if the local rewrite fails. Never log its contents.
        void saveStorageItem(STORAGE_KEYS.TOOLS_USAGE, events).catch(() => undefined);
      }
      set({ events, isLoading: false, hasHydrated: true });
    },

    reset: () => {
      set({ events: [], isLoading: false, hasHydrated: true });
    },

    logToolUsage: ({ toolId, context, action, meta }) => {
      const event = minimizeContactToolUsage({
        id: `${toolId}-${Date.now()}`,
        toolId,
        context,
        action,
        timestamp: new Date().toISOString(),
        meta,
      });
      const updated = [event, ...get().events].slice(0, 500);
      set({ events: updated });
      if (get().hasHydrated) {
        void saveStorageItem(STORAGE_KEYS.TOOLS_USAGE, updated);
      } else {
        // Do not overwrite persisted milestones if a user acts before hydration.
        void get().hydrate();
      }
    },
  }))
);

export const useToolUsageStore = createSelectors(baseUseToolUsageStore);

export function useHydrateToolUsageStore() {
  const hydrate = useToolUsageStore.use.hydrate();
  const hasHydrated = useToolUsageStore.use.hasHydrated();

  useEffect(() => {
    if (!hasHydrated) void hydrate();
  }, [hasHydrated, hydrate]);
}

