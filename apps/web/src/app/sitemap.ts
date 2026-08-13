import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { source } from "@/lib/source";

export default function sitemap(): MetadataRoute.Sitemap {
  // The landing page, plus every documentation page the source resolves —
  // guide and component pages alike. The landing page keeps the top
  // priority; documentation routes rank lower but are still listed, which is
  // what `robots.ts` already promises a crawler.
  const docs = source.getPages().map((page) => ({
    url: `${SITE.url}${page.url}`,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [{ url: SITE.url, changeFrequency: "weekly", priority: 1 }, ...docs];
}
