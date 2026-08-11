const LIMIT = 5;
const WINDOW_MS = 60_000;

const buckets = new Map<string, { count: number; startedAt: number }>();

/**
 * Best-effort, in-process rate limiting. It does not survive a restart and
 * is not shared between instances, so it stops a naive script and nothing
 * more. Durable limiting needs somewhere to keep state, which arrives with
 * the hosting work in sub-project E7.
 *
 * `now` is a parameter rather than a call to Date.now() so the window is
 * testable without faking timers.
 */
export function takeToken(key: string, now: number): boolean {
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.startedAt >= WINDOW_MS) {
    buckets.set(key, { count: 1, startedAt: now });
    return true;
  }

  if (bucket.count >= LIMIT) return false;

  bucket.count += 1;
  return true;
}

export function resetRateLimit(): void {
  buckets.clear();
}
