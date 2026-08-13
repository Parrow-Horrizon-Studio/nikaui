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
        <DocsTitle>{data.title}</DocsTitle>
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
