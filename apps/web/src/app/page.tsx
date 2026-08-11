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
      {/* onWaitlist is left at its no-op default: Task 9 will supply the
          real handler once the waitlist form exists (see pricing.tsx). */}
      <Pricing />
      <CtaBand />
    </main>
  );
}
