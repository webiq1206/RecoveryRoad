import { useEffect } from 'react';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import type { EmergencyContact } from '../../../types';
import { STORAGE_KEYS, loadStorageItem, saveStorageItem } from '../../../core/persistence';
import { createSelectors } from '../../../stores/zustand/createSelectors';

type SupportContactsState = {
  emergencyContacts: EmergencyContact[];
  isLoading: boolean;
  hasHydrated: boolean;

  hydrate: () => Promise<void>;
  reset: () => void;
  saveEmergencyContact: (contact: EmergencyContact) => void;
  deleteEmergencyContact: (id: string) => void;
};

const baseUseSupportContactsStore = create<SupportContactsState>()(
  subscribeWithSelector((set, get) => ({
    emergencyContacts: [],
    isLoading: true,
    hasHydrated: false,

    hydrate: async () => {
      if (get().hasHydrated) return;
      set({ isLoading: true });
      const emergencyContacts = await loadStorageItem<EmergencyContact[]>(STORAGE_KEYS.EMERGENCY_CONTACTS, []);
      set({ emergencyContacts, isLoading: false, hasHydrated: true });
    },

    reset: () => {
      set({ emergencyContacts: [], isLoading: false, hasHydrated: true });
    },

    saveEmergencyContact: (contact) => {
      const existing = get().emergencyContacts;
      const idx = existing.findIndex((c) => c.id === contact.id);
      const updated = idx >= 0
        ? existing.map((c) => (c.id === contact.id ? contact : c))
        : [contact, ...existing];
      set({ emergencyContacts: updated });
      void saveStorageItem(STORAGE_KEYS.EMERGENCY_CONTACTS, updated);
    },

    deleteEmergencyContact: (id) => {
      const updated = get().emergencyContacts.filter((c) => c.id !== id);
      set({ emergencyContacts: updated });
      void saveStorageItem(STORAGE_KEYS.EMERGENCY_CONTACTS, updated);
    },
  }))
);

export const useSupportContactsStore = createSelectors(baseUseSupportContactsStore);

export function useHydrateSupportContactsStore() {
  const hydrate = useSupportContactsStore.use.hydrate();
  const hasHydrated = useSupportContactsStore.use.hasHydrated();

  useEffect(() => {
    if (!hasHydrated) void hydrate();
  }, [hasHydrated, hydrate]);
}

