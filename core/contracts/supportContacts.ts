import type { EmergencyContact } from '../../types';

export interface SupportContactsDomainState {
  emergencyContacts: EmergencyContact[];
}

export interface SupportContactsDomainCommands {
  saveEmergencyContact: (contact: EmergencyContact) => void;
  deleteEmergencyContact: (id: string) => void;
}

export type SupportContactsDomain = SupportContactsDomainState & SupportContactsDomainCommands;

