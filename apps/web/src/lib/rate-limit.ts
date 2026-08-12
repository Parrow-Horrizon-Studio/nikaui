const LIMIT = 5;
const WINDOW_MS = 60_000;

/**
 * Hard ceiling on how many keys are held at once. Reached only under a
 * deliberate attack — a real visitor population inside one 60s window is
 * orders of magnitude smaller — so the eviction path below is a safety net,
 * not a hot path.
 */
export const MAX_KEYS = 10_000;

const buckets = new Map<string, { count: number; startedAt: number }>();

/**
 * Best-effort, in-process rate limiting. It does not survive a restart and
 * is not shared between instances, so it stops a naive script and nothing
 * more. Durable limiting needs somewhere to keep state, which arrives with
 * the hosting work in sub-project E7.
 *
 * "Best-effort" covers being bypassable. It does **not** cover growing
 * without bound: an earlier version replaced an entry only when a request
 * arrived for the *same* key after the window, so a client varying its
 * forwarded-for header per request made the map grow forever — a memory
 * exhaustion path on any long-lived process, which simultaneously bypassed
 * the limit. Every write that creates a key now first drops entries whose
 * window has closed, and evicts the oldest if that is not enough, so the map
 * is bounded by MAX_KEYS whatever the caller does.
 *
 * `key` is nullable and null means **"no limit key was available"**, not
 * "some shared bucket". A null key is always allowed through.
 *
 * That is a deliberate fail-open. The alternative — one shared bucket for
 * every caller without a key — gave the whole site five signups per minute
 * between them the moment the endpoint ran anywhere that does not set
 * `x-forwarded-for`, which is a functional outage of the endpoint's one job.
 * Failing closed instead would turn the same deployment into a total outage.
 * Allowing is the honest degradation: on a proxied deployment the header is
 * always present so this branch never runs, and where it does run the
 * limiter reports what it is — absent — rather than pretending to work. The
 * honeypot and the server-side validation in route.ts are unaffected either
 * way.
 *
 * `now` is a parameter rather than a call to Date.now() so the window is
 * testable without faking timers.
 */
export function takeToken(key: string | null, now: number): boolean {
  if (key === null) return true;

  const bucket = buckets.get(key);

  if (!bucket || now - bucket.startedAt >= WINDOW_MS) {
    makeRoom(now);
    buckets.set(key, { count: 1, startedAt: now });
    return true;
  }

  if (bucket.count >= LIMIT) return false;

  bucket.count += 1;
  return true;
}

/**
 * Called only on the path that adds a key, and only does work at the
 * ceiling, so the common case stays a single Map lookup.
 *
 * Expired entries go first because they carry no information. If every
 * entry is still inside its window — the attack case — the oldest go
 * instead: a Map iterates in insertion order, and an entry is inserted when
 * its window opens, so the first key is the one whose window closes soonest.
 */
function makeRoom(now: number): void {
  if (buckets.size < MAX_KEYS) return;

  for (const [key, bucket] of buckets) {
    if (now - bucket.startedAt >= WINDOW_MS) buckets.delete(key);
  }

  while (buckets.size >= MAX_KEYS) {
    const oldest = buckets.keys().next();
    if (oldest.done) break;
    buckets.delete(oldest.value);
  }
}

/** How many keys are currently held. Exists so the boundedness above is
 *  observable to a test rather than taken on trust. */
export function rateLimitSize(): number {
  return buckets.size;
}

export function resetRateLimit(): void {
  buckets.clear();
}
