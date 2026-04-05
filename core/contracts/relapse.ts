import type { RelapsePlan, TimelineEvent, UserProfile } from '../../types';

export type LogRelapseDetails = Partial<
  Pick<
    TimelineEvent,
    | 'whatHappenedLabel'
    | 'whenLabel'
    | 'whereLabel'
    | 'wereYouLabel'
    | 'triggerLabel'
    | 'thinkingLabel'
    | 'happenedDuringLabel'
    | 'afterHaveYouLabel'
    | 'emotionalStateLabel'
  >
>;

export interface RelapseDomainState {
  relapsePlan: RelapsePlan | null;
  timelineEvents: TimelineEvent[];
}

export interface RelapseDomainCommands {
  saveRelapsePlan: (plan: RelapsePlan) => void;
  logRelapse: (details?: LogRelapseDetails) => void;

  /**
   * Records that Crisis Mode was activated.
   * This is intentionally separate from UI so multiple entry points can log it consistently.
   */
  logCrisisActivation?: () => void;
}

export type RelapseDomain = RelapseDomainState & RelapseDomainCommands;

export function selectHasRelapsePlan(relapsePlan: RelapsePlan | null): boolean {
  return relapsePlan != null;
}

/**
 * Compatibility selector: prefer profile counter if present, otherwise derive from timeline.
 * This lets us transition to event-derived counts later without breaking callers.
 */
export function selectRelapseCount(profile: UserProfile, timelineEvents: TimelineEvent[]): number {
  const count = profile.recoveryProfile?.relapseCount;
  if (typeof count === 'number') return count;
  return timelineEvents.filter((e) => e.type === 'relapse').length;
}

