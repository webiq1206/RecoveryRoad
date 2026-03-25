import type { EmergencyContact, TrustedContact } from '@/types';

function normalizePhone(p: string): string {
  return p.replace(/\D/g, '');
}

/**
 * Trusted Circle (Connection) and the support-contacts store can both list people to reach in crisis.
 * Merge by phone digits; trusted-circle rows take precedence on duplicate numbers.
 */
export function mergeTrustedAndEmergencyContacts(
  trusted: TrustedContact[],
  emergency: EmergencyContact[],
): EmergencyContact[] {
  const byPhone = new Map<string, EmergencyContact>();

  for (const t of trusted) {
    const k = normalizePhone(t.phone);
    if (!k) continue;
    byPhone.set(k, { id: t.id, name: t.name, phone: t.phone });
  }
  for (const e of emergency) {
    const k = normalizePhone(e.phone);
    if (!k) continue;
    if (!byPhone.has(k)) {
      byPhone.set(k, { id: e.id, name: e.name, phone: e.phone });
    }
  }
  return Array.from(byPhone.values());
}
