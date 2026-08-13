"use client";

import Link from "next/link";
import { previews } from "./component-previews";

interface ComponentInfo {
  name: string;
  slug: string;
  category: "foundation" | "interactive";
}

const components: ComponentInfo[] = [
  { name: "Button", slug: "button", category: "foundation" },
  { name: "Badge", slug: "badge", category: "foundation" },
  { name: "Card", slug: "card", category: "foundation" },
  { name: "Input", slug: "input", category: "foundation" },
  { name: "Label", slug: "label", category: "foundation" },
  { name: "Separator", slug: "separator", category: "foundation" },
  { name: "Skeleton", slug: "skeleton", category: "foundation" },
  { name: "Spinner", slug: "spinner", category: "foundation" },
  { name: "Avatar", slug: "avatar", category: "foundation" },
  { name: "Aspect Ratio", slug: "aspect-ratio", category: "foundation" },
  { name: "Dialog", slug: "dialog", category: "interactive" },
  { name: "Alert Dialog", slug: "alert-dialog", category: "interactive" },
  { name: "Dropdown Menu", slug: "dropdown-menu", category: "interactive" },
  { name: "Popover", slug: "popover", category: "interactive" },
  { name: "Tabs", slug: "tabs", category: "interactive" },
  { name: "Accordion", slug: "accordion", category: "interactive" },
  { name: "Select", slug: "select", category: "interactive" },
  { name: "Combobox", slug: "combobox", category: "interactive" },
  { name: "Switch", slug: "switch", category: "interactive" },
  { name: "Checkbox", slug: "checkbox", category: "interactive" },
  { name: "Tooltip", slug: "tooltip", category: "interactive" },
  { name: "Toast", slug: "toast", category: "interactive" },
];

export function ComponentCards() {
  const foundation = components.filter((c) => c.category === "foundation");
  const interactive = components.filter((c) => c.category === "interactive");

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-4 text-xl font-semibold">Foundation</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {foundation.map((c) => (
            <ComponentCard key={c.slug} {...c} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Interactive</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {interactive.map((c) => (
            <ComponentCard key={c.slug} {...c} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ComponentCard({ name, slug }: ComponentInfo) {
  const preview = previews[slug];

  return (
    <Link
      href={`/docs/components/${slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border transition-colors hover:border-fd-primary/50"
    >
      {/* Preview area */}
      <div className="flex min-h-[120px] items-center justify-center bg-fd-muted/30 p-6">
        <div
          onClick={(e) => e.preventDefault()}
          className="pointer-events-auto"
        >
          {preview}
        </div>
      </div>

      {/* Name */}
      <div className="border-t px-4 py-3">
        <span className="text-sm font-medium group-hover:text-fd-primary">
          {name}
        </span>
      </div>
    </Link>
  );
}
