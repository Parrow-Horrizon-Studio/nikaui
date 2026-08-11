// Deliberately not RFC 5322. A waitlist needs to reject obvious rubbish
// and let the provider's double opt-in decide the rest — an exhaustive
// pattern rejects valid addresses and is the classic own-goal here.
const SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;
  return SHAPE.test(trimmed);
}
