import { useEffect } from 'react';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import type { MediaItem } from '@/types';
import { STORAGE_KEYS, loadStorageItem, saveStorageItem } from '@/core/persistence';
import { createSelectors } from '@/stores/zustand/createSelectors';

type MediaState = {
  media: MediaItem[];
  isLoading: boolean;
  hasHydrated: boolean;

  hydrate: () => Promise<void>;
  reset: () => void;
  addMedia: (item: MediaItem) => void;
  addMultipleMedia: (items: MediaItem[]) => void;
  deleteMedia: (id: string) => void;
};

const baseUseMediaStore = create<MediaState>()(
  subscribeWithSelector((set, get) => ({
    media: [],
    isLoading: true,
    hasHydrated: false,

    hydrate: async () => {
      if (get().hasHydrated) return;
      set({ isLoading: true });
      const media = await loadStorageItem<MediaItem[]>(STORAGE_KEYS.MEDIA, []);
      set({ media, isLoading: false, hasHydrated: true });
    },

    reset: () => {
      set({ media: [], isLoading: false, hasHydrated: true });
    },

    addMedia: (item) => {
      const updated = [item, ...get().media];
      set({ media: updated });
      void saveStorageItem(STORAGE_KEYS.MEDIA, updated);
    },

    addMultipleMedia: (items) => {
      const updated = [...items, ...get().media];
      set({ media: updated });
      void saveStorageItem(STORAGE_KEYS.MEDIA, updated);
    },

    deleteMedia: (id) => {
      const updated = get().media.filter((m) => m.id !== id);
      set({ media: updated });
      void saveStorageItem(STORAGE_KEYS.MEDIA, updated);
    },
  }))
);

export const useMediaStore = createSelectors(baseUseMediaStore);

export function useHydrateMediaStore() {
  const hydrate = useMediaStore.use.hydrate();
  const hasHydrated = useMediaStore.use.hasHydrated();

  useEffect(() => {
    if (!hasHydrated) void hydrate();
  }, [hasHydrated, hydrate]);
}

