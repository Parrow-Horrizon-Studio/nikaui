import { NextResponse } from "next/server";
// Relative, not the "@/" alias: vitest.config.ts has no path-alias
// resolution configured, so route.test.ts — which imports this module
// directly to call POST() — would fail to resolve an "@/..." specifier
// even though Next's own build resolves it fine. Same convention as
// cta-band.tsx and pricing.tsx.
import { isValidEmail } from "../../../lib/email";
import { takeToken } from "../../../lib/rate-limit";

const LOOPS_ENDPOINT = "https://app.loops.so/api/v1/contacts/create";

// A hung Loops request must not hold the visitor's request open forever.
const LOOPS_TIMEOUT_MS = 8_000;

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

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!takeToken(ip, Date.now())) {
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
        userGroup: typeof tier === "string" ? tier : "unspecified",
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
