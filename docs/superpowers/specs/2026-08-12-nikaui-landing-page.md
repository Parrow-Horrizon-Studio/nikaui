# Nika UI — Landing Page

**Date:** 2026-08-12
**Status:** Approved
**Scope:** Sub-project C. A new marketing application, the landing page ported from the design prototype, and waitlist capture.
**Parent:** [`docs/MASTER-PLAN.md`](../../MASTER-PLAN.md) — the single reference for Nika UI. This spec is the deep-dive behind decisions C1–C8 in its ledger.

---

## 1. Context

C depends on A, which fixed the commercial terms and the launch posture, and on B, which shipped the token layer, the motion API and 27 components. It runs before D so that the site chrome — navigation, footer, theme toggle, accent switcher — is built once and inherited by the documentation rather than written twice.

The current landing page is 109 lines in `apps/docs/src/app/(home)/page.tsx`: a hero, six feature cards and an install block, styled through Fumadocs' `fd-*` utilities. The prototype has eight sections. This is a rewrite, not an extension.

Two facts established while scoping this spec change what C must cover:

- **The prototype's pricing contradicts spec A.** It shows one paid tier at $99 with a checkout call to action. Spec A §D5 fixes two paid tiers — Personal at $149 and Team at $349 — and §D8 makes Pro unpurchasable at launch in favour of a waitlist. The pricing section is therefore a restructure from two cards to three, not a copy edit.
- **The prototype's motion presets are not the ones that shipped.** It advertises `bounce, pop, glide, snap, none`. B shipped `none, snap, glide, spring, bounce`. There is no preset named `pop`, and `spring` — the default every component falls back to — is absent from the prototype entirely.

Neither is a defect in the prototype. It is visual reference drawn before either decision existed. But both mean the port cannot be mechanical.

---

## 2. Decisions

### C1 — A new application, `apps/web`

The landing page moves out of `apps/docs` into a new Next 16 application.

```
apps/web/
  src/app/
    layout.tsx              fonts, theme provider, accent provider
    page.tsx                the landing page
    globals.css             imports @nikaui/registry/styles/tokens.css
    api/waitlist/route.ts   waitlist endpoint
    opengraph-image.tsx     social card
    robots.ts, sitemap.ts
  src/components/
    site/                   nav, footer, theme toggle, accent switcher
    landing/                one file per page section
```

**Documentation moves here in sub-project D, and `apps/docs` is deleted then.** This is the shape most component libraries converge on: one site, one set of chrome, one deployment. Building the landing page in its permanent home now means the navigation and footer are written once.

`apps/docs` is untouched by C and keeps serving documentation until D. Links to `/docs` point at the path documentation will occupy after that migration; they do not resolve inside `apps/web` until then. This costs nothing today because nothing is deployed — E7 is gated on C and D existing.

### C2 — Components come from the workspace, not from the CLI

`apps/web` takes `@nikaui/registry` as a workspace dependency and imports components directly, exactly as `apps/docs` does:

```tsx
import { Button } from "@nikaui/registry/ui/button";
import { NikaMotionConfig } from "@nikaui/registry/lib/motion";
```

**It does not install them with `nikaui add`.** Inside the monorepo the CLI resolves registry files from local paths, so copies here would exercise nothing that B's Task 11 did not already verify end-to-end from a scratch project outside the repository — while drifting from the registry every time a component changes and requiring a re-add nobody would remember.

### C3 — The page is a live demonstration of the library

Three places render real, interactive components rather than images:

- **The hero window** composes nine of them — `Card`, `Avatar`, `Input`, `Label`, `Switch`, `Button`, `Badge`, `Progress`, `Tooltip` — in the prototype's arrangement: a sign-in card on the left, a widget stack on the right.
- **The motion section** renders `Card` five times, each wrapped in `NikaMotionConfig` at a different preset, with a replay control. `Card` is the right subject because it expresses both halves of a preset — the spring configuration through its hover scale, and the travel multiplier through its entrance — where a `Button` would show only the first. A visitor sees the actual shipped physics rather than a CSS approximation of it.
- **The accent switcher** in the navigation sets `data-accent` on the document element, retinting the entire page live across all five presets.

This is the strongest available proof that the library works, and it costs little on top of B: the components exist, the accents and the motion provider already ship. It is also the first real consumer application of B's output, which makes it an integration test.

### C4 — Prototype copy is corrected against reality

Every claim below is in the prototype and must not reach production.

| Prototype | Reality |
|---|---|
| "40+ components" (hero stat, free tier) | **27** |
| Presets `bounce, pop, glide, snap, none` | `none, snap, glide, spring, bounce` |
| "12+ full-page templates" | Zero — and the Templates section is cut entirely, see C5 |
| "80+ premium blocks & sections" | Zero — described without a count in pricing, nowhere else |
| "Figma design kit" | Not built, not planned, and not mentioned. Revisit at v2 or on real demand |
| `npx nika add button` (×3) | `npx nikaui add button` |
| "Inspired by shadcn/ui"; "The shadcn workflow…" | Removed — no reference-library attribution anywhere |
| `github.com/Rowee13/nikaui` (×4) | `github.com/Parrow-Horrizon-Studio/nikaui` |
| "Monthly installs 14.2k · +12%" | Illustrative demo data, not a metric about Nika |
| `data-theme="dark"` | `.dark` class, per B |
| "Motion engine v0.1 is here"; nav chip `v0.1.0` | Removed — nothing is published yet |
| Footer: Discord, X / Twitter, Changelog | Removed — none exist |

**The hero stat strip becomes `27 components · 5 motion presets · 5 accents · MIT`.** All four are true, and the differentiators survive the correction: what makes this library distinctive is the motion API and the accent system, neither of which depends on the component count being large.

### C5 — Pricing: three tiers, waitlist call to action

| | Free | Personal | Team |
|---|---|---|---|
| Price | $0 | **$149** one-time | **$349** one-time |
| Seats | — | 1 developer | up to 5 at one organisation |
| Call to action | Start building → docs | Join the waitlist | Join the waitlist |

Feature lists describe what a tier contains without inventing counts. Pro entries read "Premium blocks", "Full-page templates", "Lifetime updates" — not "80+" of anything. One plain sentence states that Pro is not yet purchasable.

**The Templates section is cut from the page.** This supersedes the MASTER-PLAN's line for C, which called for three placeholder cards "honestly labelled".

The reasoning: `pro.nikaui.dev` is a separate site whose entire job is showing templates and blocks, with the real counts, once they exist. A placeholder grid on the open-source landing page duplicates that job while having nothing to put in it — and a card captioned "Planned" is a promise, not a product. Cutting it removes a section, a navigation link and a footer link, and loses nothing a visitor wanted.

Pricing keeps its reference to blocks and templates because that is what the paid tiers are *for*; it simply does not enumerate them.

**No Figma design kit is mentioned anywhere.** It is not built, not planned, and not on any roadmap this spec touches — revisit at v2, or if buyers actually ask for it.

### C6 — Waitlist capture through Loops

A single form sits directly beneath the pricing grid. Each paid tier's button scrolls to it and moves focus to the field, recording which tier was clicked in a hidden input. Spec A wants this list in order to decide which blocks to build first; knowing which tier someone reached for is signal worth one field.

`POST /api/waitlist` accepts `{ email, tier }`, re-validates the address server-side, and forwards to Loops. Nothing is persisted in this repository or in a database of our own.

**When `LOOPS_API_KEY` is absent the endpoint returns an explicit error and the interface says the waitlist is not yet accepting signups.** It never reports success for a submission that went nowhere. This is not a hypothetical: sub-project B shipped a `nikaui init` that reported success while writing no CSS, and the documentation believed it for weeks. A form that fakes success is the same defect wearing different clothes.

Abuse floor: a honeypot field and best-effort per-IP rate limiting held in process memory. That limit is genuinely best-effort and the spec says so rather than implying otherwise — an in-process counter does not survive a restart and is not shared across instances, so it stops a naive script and nothing more. Durable rate limiting needs somewhere to keep state, which arrives with E7. No CAPTCHA: a waitlist has no per-signup cost worth defending with one, and Turnstile can be added if it is ever actually abused.

Accessibility: a real `<label>`, `type="email"`, and an `aria-live` region carrying the status message. One sentence under the field states what the address is for and that unsubscribing is one click.

The email validator is a pure function with unit tests. CI runs `pnpm test` across the workspace, so a new application's tests are collected automatically.

### C7 — Chrome is built for documentation to inherit

`src/components/site/` holds the navigation, footer, theme toggle and accent switcher. These are designed knowing D will wrap documentation routes in them: the navigation takes its links as data rather than hard-coding a marketing-only set, and the layout does not assume a single full-width page.

Theme switching uses `next-themes` with `attribute="class"`, matching B's `.dark` convention. **The default is `system`** — the visitor's own operating-system preference decides, and the toggle cycles system → light → dark rather than flipping between two.

This differs from `apps/docs`, which B set to `defaultTheme="dark"` to preserve the prototype's presentation. The two are inconsistent until D migrates documentation into this application, at which point `system` should win: a marketing site that ignores an explicit OS preference on first paint is a worse first impression than one that honours it, and there is no reason documentation should behave differently from the page that links to it. Recorded here so D does not silently carry `dark` across.

Accent selection sets `data-accent` on the document element and persists to `localStorage`; `sun` is the default and needs no attribute.

Fonts are Manrope and JetBrains Mono through `next/font`, the same pairing `apps/docs` uses. The registry's own font tokens remain system stacks — fonts are the site's business, not the library's.

### C8 — Metadata, social card and crawling

Page metadata, an Open Graph image, `robots.txt` and a sitemap. A landing page without them looks broken the first time anyone shares the link, and they cost almost nothing at build time.

---

## 3. The seven sections

The prototype has eight. Templates is cut, per C5.

| Section | Contents | Live? |
|---|---|---|
| **Nav** | Brand mark, links (Docs · Components · Pricing), theme toggle, accent switcher, GitHub, waitlist call to action | Accent switcher, theme toggle |
| **Hero** | Rays and sun ported from `nika-landing.css`, pill, headline, lead, two calls to action, install bar with copy button, live component window, stat strip | Nine real components |
| **Features** | Six cards | Static |
| **Motion** | Copy plus five preset demonstrations with replay | Five real presets |
| **Pricing** | Three tiers, waitlist form beneath | Form |
| **CTA band** | Headline, docs link, GitHub link | Static |
| **Footer** | Three columns, only links that resolve | Static |

**Reduced motion.** B's presets cover component motion. The decorative sun and ray animations are CSS and need their own `prefers-reduced-motion` guard — without one, the page would honour a user's preference everywhere except the first thing they see.

---

## 4. Out of scope

- **Documentation migration** — sub-project D. `apps/docs` is untouched.
- **Hosting, DNS, TLS, deployment** — E7, which C and D together unblock.
- **Analytics** — genuinely needed for a marketing page, but it is deploy-time configuration rather than application code. It belongs with E7.
- **The Pro landing page and documentation** at `pro.nikaui.dev` — a different repository, per spec A §D4.
- **Polar, payments, license keys, `nikaui login`** — none of it exists at waitlist stage.
- **Block and template content, and any section that shows it** — sub-project F builds them; `pro.nikaui.dev` displays them. The open-source landing page names them only in the pricing tiers.
- **A Figma design kit** — the prototype advertises one. It is not built, not planned, and not mentioned on the page.

---

## 5. Verification

C is complete when:

1. `apps/web` builds, lints, type-checks and passes its tests, and the workspace gate is green.
2. The page renders correctly in both themes and in all five accents, confirmed by eye — not only by build success.
3. **The honesty greps return nothing:** `npx nika ` without `ui`, any reference-library attribution, `Rowee13/`, `40+`, and a preset named `pop`. Each is a string the prototype contains.
4. **The component count is checked against the registry manifest**, not hard-coded, so the hero's claim cannot rot the next time a component lands.
5. The waitlist submits successfully against a configured Loops key, **and reports failure — visibly — when the key is removed.** The negative control is the point.
6. Keyboard-only navigation reaches every control: the links, both switchers, the copy button, the replay controls and the form.
7. With `prefers-reduced-motion: reduce`, no animation plays — including the hero's rays and sun.
8. Every footer and navigation link resolves, or is absent — with one carved-out exception: the links to `/docs` and its sub-paths, which C1 deliberately points at the location documentation will occupy after sub-project D. They are the only permitted dangling links, and D closes them.
