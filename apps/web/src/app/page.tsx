import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { MotionShowcase } from "@/components/landing/motion-showcase";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Features />
      <MotionShowcase />
    </main>
  );
}
