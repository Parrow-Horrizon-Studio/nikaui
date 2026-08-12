import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const alt = SITE.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// ImageResponse renders through Satori, not a browser: no stylesheet, no
// var(--nika-*) tokens, no Tailwind utilities — only inline styles and a
// flex layout model. These are the sun accent's dark-mode values from
// packages/registry/src/styles/tokens.css, converted from oklch to hex by
// hand (the OKLab reference formulas), since Satori's colour parser doesn't
// understand oklch(). This is the one place in the codebase a colour is
// hard-coded instead of read from the token layer.
const CANVAS = "#100E0C";
const CODE_BG = "#1A1614";
const LINE = "#332E2A";
const CONTENT = "#F5F3F0";
const CONTENT_MUTED = "#B1ABA4";
const PRIMARY = "#FA7217";
const ACCENT = "#FBC342";

const TAGLINE = "Components with the freedom to move";
const PROMPT = ">";
const COMMAND = "npx nikaui add button";
// Everything Satori is asked to draw. Once ImageResponse is given a custom
// `fonts` array, Satori uses it for every glyph in the tree — not just
// elements whose fontFamily names it — so the subset fetched below has to
// cover the wordmark and tagline too, or their characters render as tofu.
const ALL_TEXT = `Nika UI ${TAGLINE} ${PROMPT} ${COMMAND}`;
const MONO_FONT = "JetBrains Mono";

/**
 * Satori has no @font-face support — a non-default typeface must be fetched
 * and handed over as raw bytes via ImageResponse's `fonts` option. This
 * mirrors the `loadGoogleFont` helper next/og itself ships (for CJK/emoji
 * fallback), pointed at the one family the card needs. Requests only the
 * glyphs actually drawn. If the fetch fails (no network at build time), the
 * caller passes `fonts: undefined` rather than `[]` — see the comment on
 * that call for why the distinction matters — and Satori renders with its
 * bundled default instead of throwing.
 */
async function loadMonoFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(MONO_FONT)}&text=${encodeURIComponent(text)}`,
      { headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" } },
    ).then((res) => res.text());
    // Takes the first @font-face block only, assuming Google returns one
    // minimal subset for a single text=-scoped family request. True today;
    // would silently truncate the glyph set if that assumption ever stops
    // holding (e.g. a request that spans multiple weights/styles).
    const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/);
    const fontUrl = match?.[1];
    if (!fontUrl) return null;
    const res = await fetch(fontUrl);
    if (!res.ok) return null;
    return res.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function Image() {
  const monoFontData = await loadMonoFont(ALL_TEXT);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          backgroundColor: CANVAS,
          // Echoes .hero-sun/.hero-rays from globals.css: a soft radial glow
          // above the wordmark, in literal colour since Satori can't read
          // the site's --nika-* custom properties. Painted straight onto
          // this root box (which is exactly the 1200x630 canvas) with an
          // explicit pixel radius rather than a separate decorative div
          // sized in percentages: Satori's un-sized `circle` keyword does
          // not compute the spec's farthest-corner radius — it appears to
          // reuse the containing box's own declared height as a linear
          // (not radial) 100% reference, so a `70%` stop on a 900px-tall
          // box produced a hard seam at a fixed row (top + 0.7 * 900)
          // instead of a circular falloff. An explicit `circle <px>` size
          // sidesteps that auto-sizing path entirely.
          backgroundImage:
            "radial-gradient(circle 420px at 600px 40px, rgba(250,114,23,0.30) 0%, rgba(251,195,66,0.12) 45%, rgba(250,114,23,0) 100%)",
          position: "relative",
          fontFamily: monoFontData ? MONO_FONT : "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              display: "flex",
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: `radial-gradient(circle at 30% 30%, ${ACCENT}, ${PRIMARY} 60%)`,
            }}
          />
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: CONTENT }}>
            Nika <span style={{ color: PRIMARY }}>UI</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 68,
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            color: CONTENT,
            maxWidth: 980,
          }}
        >
          {TAGLINE}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            alignSelf: "flex-start",
            padding: "20px 30px",
            borderRadius: 999,
            border: `1px solid ${LINE}`,
            backgroundColor: CODE_BG,
            fontSize: 28,
            color: CONTENT_MUTED,
          }}
        >
          <span style={{ display: "flex", color: PRIMARY }}>{PROMPT}</span>
          <span style={{ display: "flex", color: CONTENT }}>{COMMAND}</span>
        </div>
      </div>
    ),
    {
      ...size,
      // `undefined`, not `[]`: @vercel/og's internal default is
      // `options.fonts || defaultFonts`, and an empty array is truthy in
      // JavaScript, so `[]` short-circuits that fallback and Satori throws
      // "No fonts are loaded" instead of using its bundled Geist. Only
      // `undefined` actually reaches `defaultFonts`.
      fonts: monoFontData
        ? [{ name: MONO_FONT, data: monoFontData, style: "normal", weight: 500 }]
        : undefined,
    },
  );
}
