import { defineDocs, defineConfig } from "fumadocs-mdx/config";
import { pageSchema } from "fumadocs-core/source/schema";
import { z } from "zod";

/**
 * Frontmatter that survives parsing.
 *
 * `defineDocs` defaults to fumadocs-core's `pageSchema`, a plain zod object in
 * strip mode, and fumadocs-mdx *replaces* the raw frontmatter with the parse
 * result rather than merging into it. Any field the schema does not name is
 * therefore dropped silently — no error, no warning, a green build, and
 * `page.data.category === undefined`. The component index is derived from
 * `category`, so an unextended schema would leave it deriving from nothing and
 * every check would still pass.
 *
 * `category` places a component page in the index's Foundation or Interactive
 * section. `status: stub` marks a page whose reference documentation is not
 * written yet; it drives both the notice on the page and the marker on the
 * card, so the two cannot disagree.
 */
const docSchema = pageSchema.extend({
  category: z.enum(["foundation", "interactive"]).optional(),
  status: z.literal("stub").optional(),
});

export const docs = defineDocs({
  dir: "content/docs",
  docs: { schema: docSchema },
});

export default defineConfig();
