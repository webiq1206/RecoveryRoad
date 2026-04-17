/**
 * Lightweight on-device detection for crisis / self-harm language in free text.
 * Not a substitute for professional assessment — only used to surface resources.
 */
const CRISIS_PHRASES = [
  'kill myself',
  'killing myself',
  'end my life',
  'want to die',
  'wish i were dead',
  'suicide',
  'hurt myself',
  'self-harm',
  'self harm',
  'cut myself',
  'better off dead',
];

export function textMayIndicateCrisis(text: string): boolean {
  const c = String(text || '').toLowerCase();
  return CRISIS_PHRASES.some((p) => c.includes(p));
}
