import { NextResponse } from "next/server";
import { isValidEmail } from "@/lib/email";
import { takeToken } from "@/lib/rate-limit";

const LOOPS_ENDPOINT = "https://app.loops.so/api/v1/contacts/create";

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

  const response = await fetch(LOOPS_ENDPOINT, {
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
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "We could not add you just now. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
