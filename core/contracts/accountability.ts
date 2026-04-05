import type { AccountabilityData, AccountabilityPartner, CommitmentContract } from '../../types';

export interface AccountabilityDomainState {
  accountabilityData: AccountabilityData;
}

export interface AccountabilityDomainCommands {
  addContract: (contract: CommitmentContract) => void;
  updateContract: (id: string, updates: Partial<CommitmentContract>) => void;
  deleteContract: (id: string) => void;
  checkInContract: (contractId: string, honored: boolean, note?: string) => void;

  addPartner: (partner: AccountabilityPartner) => void;
  deletePartner: (id: string) => void;

  useStreakProtection: () => void;
}

export type AccountabilityDomain = AccountabilityDomainState & AccountabilityDomainCommands;

