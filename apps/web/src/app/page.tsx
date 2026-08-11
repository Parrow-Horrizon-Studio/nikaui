import { CtaBand } from "@/components/landing/cta-band";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { MotionShowcase } from "@/components/landing/motion-showcase";
import { Pricing } from "@/components/landing/pricing";

export default function HomePage() {
  return (
    <main>
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
