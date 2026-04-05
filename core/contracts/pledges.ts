import type { Pledge } from '../../types';

export interface PledgesDomainState {
  pledges: Pledge[];
  todayPledge: Pledge | null;
  currentStreak: number;
}

export interface PledgesDomainCommands {
  addPledge: (pledge: Pledge) => void;
}

export type PledgesDomain = PledgesDomainState & PledgesDomainCommands;

