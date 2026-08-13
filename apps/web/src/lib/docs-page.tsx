import { source } from "@/lib/source";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import { notFound } from "next/navigation";
import { getMDXComponents } from "@/components/docs/mdx";
import { StubNotice } from "@/components/docs/stub-notice";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { MAIN_CONTENT_ID } from "@/components/site/nav";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

/**
 * Create a docs page component for a given section prefix.
 * The prefix is prepended to the slug to find the right page in the source.
 */
export function createDocsPage(sectionPrefix: string) {
  async function Page(props: PageProps) {
    const params = await props.params;
    const fullSlug = [sectionPrefix, ...(params.slug ?? [])];
    const page = source.getPage(fullSlug);
    if (!page) notFound();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = page.data as any;
    const MDX = data.body;

    return (
      <DocsPage toc={data.toc} full={data.full}>
        {/* The skip link in <Nav> (rendered by the root layout on every
            route, docs included) targets this id. The landing page puts it
            on its own <main>; every /docs/* route renders through this one
            shared page component, so the title — the actual start of the
            page's content, after Fumadocs' own breadcrumb chrome — is the
            equivalent target here. `tabIndex={-1}` and `scroll-mt-20` mirror
            page.tsx's <main> for the same reason: browsers scroll to a
            non-focusable target but leave focus behind, and the sticky <Nav>
            would otherwise cover the heading the skip link lands on. */}
        <DocsTitle id={MAIN_CONTENT_ID} tabIndex={-1} className="scroll-mt-20 focus:outline-none">
          {data.title}
        </DocsTitle>
        <DocsDescription>{data.description}</DocsDescription>
        <DocsBody>
          {data.status === "stub" ? <StubNotice /> : null}
          <MDX
            components={getMDXComponents({
              a: createRelativeLink(source, page),
            })}
          />
        </DocsBody>
      </DocsPage>
    );
  }

  async function generateStaticParams() {
    const allParams = source.generateParams();
    // Filter params that belong to this section
    return allParams
      .filter((p) => p.slug?.[0] === sectionPrefix)
      .map((p) => ({
        slug: p.slug?.slice(1),
      }));
  }

  async function generateMetadata(props: PageProps): Promise<Metadata> {
    const params = await props.params;
    const fullSlug = [sectionPrefix, ...(params.slug ?? [])];
    const page = source.getPage(fullSlug);
    if (!page) notFound();

    return {
      title: page.data.title,
      description: page.data.description,
    };
  }

  return { Page, generateStaticParams, generateMetadata };
}
