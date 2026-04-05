import type { JournalEntry } from '../../types';

export interface JournalDomainState {
  journal: JournalEntry[];
}

export interface JournalDomainCommands {
  addJournalEntry: (entry: JournalEntry) => void;
  deleteJournalEntry: (id: string) => void;
}

export type JournalDomain = JournalDomainState & JournalDomainCommands;

