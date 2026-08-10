import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="mx-auto max-w-[1400px] px-6 py-24 text-center sm:py-32">
          <div className="mb-6 inline-flex items-center rounded-full border px-4 py-1.5 text-sm text-fd-muted-foreground">
            v0.1.0 &mdash; Now in development
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Beautiful, animated UI
            <br />
            <span className="text-fd-primary">components for React</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-fd-muted-foreground">
            Tailwind CSS and Motion powered components. Install individually via
            CLI. Own the code. Fully accessible with Headless UI.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/docs/guide"
              className="inline-flex h-11 items-center justify-center rounded-md bg-fd-primary px-8 text-sm font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
            >
              Get Started
            </Link>
            <Link
              href="/docs/components"
              className="inline-flex h-11 items-center justify-center rounded-md border px-8 text-sm font-medium transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
            >
              Browse Components
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-[1400px] px-6 py-20">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            title="Tailwind Native"
            description="Built entirely with Tailwind CSS v4. No external stylesheets. Theming via CSS variables."
          />
          <FeatureCard
            title="Motion Powered"
            description="Every interactive component uses Motion for smooth spring animations and transitions."
          />
          <FeatureCard
            title="Copy & Paste"
            description="Install components individually with the CLI. You own the code and can customize freely."
          />
          <FeatureCard
            title="Accessible"
            description="Built on Headless UI for WAI-ARIA compliance. Keyboard navigation and screen reader support."
          />
          <FeatureCard
            title="TypeScript First"
            description="Full type safety with strict TypeScript. Typed variants, props, and event handlers."
          />
          <FeatureCard
            title="22+ Components"
            description="From buttons to dialogs, tabs to toasts. Everything you need to build modern interfaces."
          />
        </div>
      </section>

      {/* Install */}
      <section className="border-t">
        <div className="mx-auto max-w-[1400px] px-6 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Get started in seconds
          </h2>
          <p className="mt-4 text-fd-muted-foreground">
            Initialize Nika UI in your project and start adding components.
          </p>
          <div className="mx-auto mt-8 max-w-md space-y-3">
            <CodeBlock code="npx nikaui init" />
            <CodeBlock code="npx nikaui add button card dialog" />
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border bg-fd-card p-6">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-fd-muted-foreground">{description}</p>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="rounded-lg border bg-fd-card px-4 py-3 text-left font-mono text-sm">
      <span className="text-fd-muted-foreground">$ </span>
      {code}
    </div>
  );
}
