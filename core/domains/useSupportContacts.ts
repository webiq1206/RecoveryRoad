import { useMemo } from 'react';
import { useHydrateSupportContactsStore, useSupportContactsStore } from '../../features/supportContacts/state/useSupportContactsStore';
import type { SupportContactsDomain } from '../contracts/supportContacts';

export function useSupportContacts(): SupportContactsDomain {
  useHydrateSupportContactsStore();
  const emergencyContacts = useSupportContactsStore.use.emergencyContacts();
  const saveEmergencyContact = useSupportContactsStore.use.saveEmergencyContact();
  const deleteEmergencyContact = useSupportContactsStore.use.deleteEmergencyContact();

  return useMemo(
    () => ({
      emergencyContacts,
      saveEmergencyContact,
      deleteEmergencyContact,
    }),
    [emergencyContacts, saveEmergencyContact, deleteEmergencyContact],
  );
}

