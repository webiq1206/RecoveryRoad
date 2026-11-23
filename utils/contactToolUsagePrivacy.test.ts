import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import type { ToolUsageEvent } from '../features/tools/types';
import { minimizeContactToolUsage, minimizeStoredContactToolUsage } from '../features/tools/state/contactToolUsagePrivacy';

const sentinel = '+12025550123';
const base: ToolUsageEvent = {
  id: 'connect-7',
  toolId: 'connect',
  context: 'crisis',
  action: 'completed',
  timestamp: '2026-11-23T01:23:45.000Z',
};

describe('trusted contact history privacy', () => {
  test('old Call and Text history retains identity, timing and action, not a phone number', () => {
    for (const method of ['call', 'text', 'sms']) {
      const input = { ...base, meta: { method, phone: sentinel, target: sentinel } };
      const safe = minimizeContactToolUsage(input);

      expect(safe).toEqual({ ...base, meta: { method } });
      expect(JSON.stringify(safe)).not.toContain(sentinel);
      expect(input.meta.phone).toBe(sentinel);
    }
  });

  test('unknown methods and unsupported contact metadata are not kept', () => {
    const safe = minimizeContactToolUsage({ ...base, meta: { method: sentinel } });
    expect(safe).toEqual(base);
  });

  test('migration is idempotent and leaves other recovery tools and history order intact', () => {
    const unrelated: ToolUsageEvent = {
      ...base,
      id: 'grounding-3',
      toolId: 'grounding',
      meta: { durationSeconds: 36 },
    };
    const alreadySafe = { ...base, id: 'connect-8', meta: { method: 'sms' } };
    const input = [{ ...base, meta: { phone: sentinel, method: 'text' } }, unrelated, alreadySafe];
    const migrated = minimizeStoredContactToolUsage(input);

    expect(migrated).toEqual([{ ...base, meta: { method: 'text' } }, unrelated, alreadySafe]);
    expect(migrated[1]).toBe(unrelated);
    expect(migrated[2]).toBe(alreadySafe);
    expect(minimizeStoredContactToolUsage(migrated)).toBe(migrated);
  });

  test('Call and Text screens keep OS handoff while history call sites omit the selected number', () => {
    const crisis = readFileSync(new URL('../app/crisis-mode.tsx', import.meta.url), 'utf8');
    const connection = readFileSync(new URL('../app/(tabs)/connection/ConnectionHub.tsx', import.meta.url), 'utf8');
    expect(crisis).toContain("meta: { method: 'call' }");
    expect(crisis).toContain("meta: { method: 'text' }");
    expect(connection).toContain("meta: { method: 'sms' }");
    expect(crisis).toContain('Linking.openURL(`tel:${cleaned}`)');
    expect(crisis).toContain('Linking.openURL(`sms:${cleaned}${separator}body=${message}`)');
    expect(connection).toContain('Linking.openURL(`tel:${phone}`)');
    expect(connection).toContain('Linking.openURL(`sms:${cleaned}${separator}body=${message}`)');
  });
});
