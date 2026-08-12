import { NextResponse } from "next/server";
// Relative, not the "@/" alias. vitest.config.ts does resolve "@/" now
// (Task 10 added it for opengraph-image.tsx), so this is a convention
// rather than a necessity: every module reachable from a test still
// imports its siblings relatively, which keeps them resolvable by any
// tool without a matching alias table. Same convention as cta-band.tsx
// and pricing.tsx.
import { isValidEmail } from "../../../lib/email";
import { takeToken } from "../../../lib/rate-limit";
// Type-only, so it is erased at compile time and no "use client" module is
// pulled into this server route's graph.
import type { PricingTier } from "../../../components/landing/pricing";

const LOOPS_ENDPOINT = "https://app.loops.so/api/v1/contacts/create";

// A hung Loops request must not hold the visitor's request open forever.
const LOOPS_TIMEOUT_MS = 8_000;

/**
 * `tier` arrives in an untrusted request body and is forwarded to a third
 * party, so it is validated against the closed domain rather than passed
 * through — `email` was length-capped and format-checked from the start and
 * `tier` was not, which let any string of any length reach Loops as a
 * contact's user group.
 *
 * Typed `Record<PricingTier, true>` deliberately: adding a tier to the union
 * without adding it here is a compile error, and adding one here that is not
 * in the union is too. An array with `satisfies readonly PricingTier[]` would
 * only catch the second.
 */
const KNOWN_TIERS: Record<PricingTier, true> = { personal: true, team: true };
const TIER_VALUES = new Set<string>(Object.keys(KNOWN_TIERS));

export async function POST(request: Request) {
  const apiKey = process.env.LOOPS_API_KEY;

  // No key means no signup happened. Saying so is the whole point: sub-project
  // B shipped an `init` that reported success while writing nothing, and the
  // documentation believed it for weeks. A form that fakes success is that
  // same defect wearing different clothes.
  if (!apiKey) {
    return NextResponse.json(
      { error: "The waitlist is not accepting signups yet." },
      { status: 503 }
    );
  }

  // `null`, not a literal like "unknown": a shared fallback bucket would give
  // every visitor of a deployment that does not set this header five signups
  // per minute *between them*. takeToken treats null as "no limit key
  // available" and documents what it does about it.
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientIp = forwardedFor ? forwardedFor : null;
  if (!takeToken(clientIp, Date.now())) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a minute." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const { email, tier, company } = (body ?? {}) as Record<string, unknown>;

  // Honeypot: a field no human sees and no human fills. Answer 200 so a bot
  // learns nothing from the response, but send nothing onward.
  if (typeof company === "string" && company.length > 0) {
    return NextResponse.json({ ok: true });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "That email address looks wrong." }, { status: 400 });
  }

  let loopsResponse: Response;
  try {
    loopsResponse = await fetch(LOOPS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email: (email as string).trim(),
        source: "nikaui.dev waitlist",
        userGroup:
          typeof tier === "string" && TIER_VALUES.has(tier) ? tier : "unspecified",
      }),
      // Without this a hanging Loops request holds the visitor's request
      // (and this server's connection) open indefinitely.
      signal: AbortSignal.timeout(LOOPS_TIMEOUT_MS),
    });
  } catch (cause) {
    // Network failure, DNS, or the timeout above firing. Never log apiKey.
    console.error("Waitlist: request to Loops failed", cause);
    return NextResponse.json(
      { error: "We could not add you just now. Please try again." },
      { status: 502 }
    );
  }

  // Loops documents a contact that already exists as a 409. That visitor
  // really is on the waitlist, so telling them so is the honest answer —
  // deliberately treated as success, not folded into the generic failure
  // below.
  if (loopsResponse.status === 409) {
    return NextResponse.json({ ok: true });
  }

  // A 2xx status alone isn't proof Loops accepted the contact — its
  // documented success body is `{ success: true, id: "…" }`, an
  // application-level outcome carried in the body, not just the status
  // line. Read it and require the explicit signal; a 200 whose body
  // doesn't say so must not become `{ ok: true }`.
  let loopsBody: unknown = null;
  try {
    loopsBody = await loopsResponse.json();
  } catch {
    loopsBody = null;
  }
  const loopsSucceeded =
    loopsResponse.ok && (loopsBody as { success?: unknown } | null)?.success === true;

  if (!loopsSucceeded) {
    // Logged so a broken integration leaves a signal instead of every
    // visitor just seeing a clean, unexplained error. Never log apiKey.
    console.error("Waitlist: Loops rejected the signup", loopsResponse.status, loopsBody);
    return NextResponse.json(
      { error: "We could not add you just now. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
