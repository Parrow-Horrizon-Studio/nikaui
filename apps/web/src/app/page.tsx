import { CtaBand } from "@/components/landing/cta-band";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { MotionShowcase } from "@/components/landing/motion-showcase";
import { Pricing } from "@/components/landing/pricing";
import { MAIN_CONTENT_ID } from "@/components/site/nav";

export default function HomePage() {
  return (
    // `tabIndex={-1}` so the skip link in <Nav> actually moves focus here:
    // browsers scroll to a non-focusable target but leave focus where it
    // was, which puts the next Tab straight back into the navigation.
    // `scroll-mt` clears the sticky header the target would otherwise sit
    // underneath.
    <main id={MAIN_CONTENT_ID} tabIndex={-1} className="scroll-mt-20 focus:outline-none">
      <Hero />
      <Features />
      <MotionShowcase />
      {/* onWaitlist is left at its default: this is a Server Component and
          cannot pass a plain closure prop across to a Client Component.
          The default lives inside pricing.tsx and drives the waitlist form
          it renders directly beneath the grid (see waitlist-form.tsx). */}
      <Pricing />
      <CtaBand />
    </main>
  );
}
