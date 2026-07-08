// Parses simple duration strings like "15m", "7d", "1h" into milliseconds.
// Only used for cookie maxAge — token expiry itself is enforced by jsonwebtoken's `expiresIn`.
const UNIT_MS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

export function parseDurationMs(input: string): number {
  const match = /^(\d+)([smhd])$/.exec(input.trim());
  if (!match) {
    throw new Error(`Invalid duration string: ${input}`);
  }
  const [, value, unit] = match;
  return Number(value) * UNIT_MS[unit];
}
