import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // Only the landing page exists in this application today. Documentation
  // routes arrive with sub-project D and belong here then.
  return [{ url: SITE.url, changeFrequency: "weekly", priority: 1 }];
}
