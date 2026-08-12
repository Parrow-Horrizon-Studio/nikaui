export const SITE = {
  name: "Nika UI",
  title: "Nika UI — Components with the freedom to move",
  description:
    "Beautiful, animated React components built with Tailwind CSS and Motion. Install individually via CLI, own the code, and theme everything from one token layer.",
  // Overridable so a preview deployment does not advertise the production
  // host in its own metadata.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://nikaui.dev",
} as const;
