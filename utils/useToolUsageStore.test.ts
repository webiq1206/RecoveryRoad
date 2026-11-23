import { afterEach, expect, mock, test } from 'bun:test';
import type { ToolUsageEvent } from '../features/tools/types';

const historyKey = 'recovery_tools_usage';
const contactsKey = 'recovery_emergency_contacts';
const syntheticPhone = '+12025550123';
const savedBefore = JSON.stringify([{ id: 'saved-contact-42', name: 'Synthetic', phone: syntheticPhone }]);
const disk = new Map<string, unknown>([[contactsKey, JSON.parse(savedBefore)]]);
const writes: string[] = [];

mock.module('../core/persistence', () => ({
  STORAGE_KEYS: { TOOLS_USAGE: historyKey },
  loadStorageItem: async (key: string, fallback: unknown) => structuredClone(disk.get(key) ?? fallback),
  saveStorageItem: async (key: string, data: unknown) => {
    writes.push(key);
    disk.set(key, structuredClone(data));
  },
}));

const { useToolUsageStore } = await import('../features/tools/state/useToolUsageStore');

afterEach(() => {
  useToolUsageStore.setState({ events: [], isLoading: true, hasHydrated: false });
  writes.length = 0;
  disk.delete(historyKey);
});

test('first upgrade hydration rewrites only the tool history key and retains prior milestones', async () => {
  const older: ToolUsageEvent = {
    id: 'connect-import',
    toolId: 'connect',
    context: 'crisis',
    action: 'completed',
    timestamp: '2026-10-01T12:00:00.000Z',
    meta: { method: 'call', phone: syntheticPhone },
  };
  const journal: ToolUsageEvent = {
    ...older, id: 'journal-import', toolId: 'journal-prompt', meta: { wordCount: 13 },
  };
  disk.set(historyKey, [older, journal]);

  await Promise.all([useToolUsageStore.getState().hydrate(), useToolUsageStore.getState().hydrate()]);
  expect(useToolUsageStore.getState().events).toEqual([{ ...older, meta: { method: 'call' } }, journal]);
  expect(JSON.stringify(disk.get(historyKey))).not.toContain(syntheticPhone);
  expect(JSON.stringify(disk.get(contactsKey))).toBe(savedBefore);
  expect(writes).toEqual([historyKey]);

  // Reloading an already migrated store does not churn persistent storage.
  useToolUsageStore.setState({ events: [], isLoading: true, hasHydrated: false });
  await useToolUsageStore.getState().hydrate();
  expect(writes).toEqual([historyKey]);
});

test('even a legacy caller cannot record a selected number into new tool history', async () => {
  await useToolUsageStore.getState().hydrate();
  useToolUsageStore.getState().logToolUsage({
    toolId: 'connect', context: 'daily_guidance', action: 'completed',
    meta: { method: 'sms', phone: syntheticPhone },
  });
  expect(useToolUsageStore.getState().events[0]?.meta).toEqual({ method: 'sms' });
  expect(JSON.stringify(disk.get(historyKey))).not.toContain(syntheticPhone);
  expect(JSON.stringify(disk.get(contactsKey))).toBe(savedBefore);
  expect(writes).toEqual([historyKey]);
});

test('a quick action before hydration preserves the saved history and stays redacted', async () => {
  const older: ToolUsageEvent = {
    id: 'connect-previous-day',
    toolId: 'connect',
    context: 'crisis',
    action: 'completed',
    timestamp: '2026-10-01T12:00:00.000Z',
    meta: { method: 'call', phone: syntheticPhone },
  };
  disk.set(historyKey, [older]);

  useToolUsageStore.getState().logToolUsage({
    toolId: 'connect', context: 'daily_guidance', action: 'completed',
    meta: { method: 'sms', phone: syntheticPhone },
  });
  await useToolUsageStore.getState().hydrate();

  const events = useToolUsageStore.getState().events;
  expect(events).toHaveLength(2);
  expect(events[0]?.meta).toEqual({ method: 'sms' });
  expect(events[1]).toEqual({ ...older, meta: { method: 'call' } });
  expect(JSON.stringify(disk.get(historyKey))).not.toContain(syntheticPhone);
  expect(writes).toEqual([historyKey]);
});
