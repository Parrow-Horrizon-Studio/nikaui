import { createDocsPage } from "@/lib/docs-page";

const { Page, generateStaticParams, generateMetadata } =
  createDocsPage("components");

export default Page;
export { generateStaticParams, generateMetadata };
