import type { ToolUsageEvent } from '../types';

/**
 * A Connect history entry needs only the action method. Contact numbers are
 * needed by the user-triggered phone/message handoff, not by recovery history.
 * Apply this on both new events and older stored events read after an upgrade.
 */
export function minimizeContactToolUsage(event: ToolUsageEvent): ToolUsageEvent {
  if (event.toolId !== 'connect' || !event.meta) return event;

  const method = event.meta.method;
  if (method === 'call' || method === 'text' || method === 'sms') {
    const keys = Object.keys(event.meta);
    if (keys.length === 1 && keys[0] === 'method') return event;
    return { ...event, meta: { method } };
  }

  const { meta: _meta, ...history } = event;
  return history;
}

export function minimizeStoredContactToolUsage(events: ToolUsageEvent[]): ToolUsageEvent[] {
  const minimized = events.map(minimizeContactToolUsage);
  return minimized.some((event, index) => event !== events[index]) ? minimized : events;
}
