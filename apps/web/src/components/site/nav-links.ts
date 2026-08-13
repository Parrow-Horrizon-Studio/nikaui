export interface NavLink {
  label: string;
  href: string;
}

export const NAV_LINKS: readonly NavLink[] = [
  { label: "Docs", href: "/docs/guide" },
  { label: "Components", href: "/docs/components" },
  { label: "Pricing", href: "/#pricing" },
];

export const GITHUB_URL = "https://github.com/Parrow-Horrizon-Studio/nikaui";

export interface FooterColumn {
  heading: string;
  links: readonly NavLink[];
}

export const FOOTER_COLUMNS: readonly FooterColumn[] = [
  {
    heading: "Product",
    links: [
      { label: "Components", href: "/docs/components" },
      { label: "Motion", href: "/#motion" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    heading: "Developers",
    links: [
      { label: "GitHub", href: GITHUB_URL },
      { label: "License", href: `${GITHUB_URL}/blob/main/LICENSE` },
    ],
  },
  {
    heading: "Documentation",
    links: [
      { label: "Guide", href: "/docs/guide" },
      { label: "Installation", href: "/docs/guide/installation" },
      { label: "Theming", href: "/docs/guide/theming" },
      { label: "Animation", href: "/docs/guide/animation" },
    ],
  },
];
