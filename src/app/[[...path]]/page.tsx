import { findPublisher } from "@/lib/publishers";
import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import CatalogExperience from "@/components/CatalogExperience";
import PolicyPage from "@/components/PolicyPage";
import {
  CATEGORIES,
  GUIDES,
  WORKFLOWS,
  type Category,
  type Platform,
} from "@/lib/catalog";
import { getPublicSnapshot } from "@/lib/server/store";
import {
  PAGE_NAMES,
  buildMetadata,
  serializeJsonLd,
  structuredData,
} from "@/lib/seo";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const readCatalog = cache(getPublicSnapshot);
type Props = {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
const policyRoutes = new Set([
  "yontem",
  "hakkimizda",
  "gizlilik",
  "duzeltme-politikasi",
]);
export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { path = [] } = await params;
  return buildMetadata(path, readCatalog(), await searchParams);
}
export default async function Page({ params, searchParams }: Props) {
  const { path = [] } = await params;
  const query = await searchParams;
  const catalog = readCatalog();
  const detailExists =
    path.length === 2 &&
    ((path[0] === "yayinci" && !!findPublisher(catalog, path[1])) ||
      (path[0] === "uygulama" &&
        catalog.apps.some((app) => app.id === path[1])) ||
      (path[0] === "blog" &&
        catalog.articles.some((article) => article.id === path[1])) ||
      (path[0] === "liste" &&
        catalog.lists.some((list) => list.id === path[1])) ||
      (path[0] === "kategori" &&
        CATEGORIES.some(
          (category) => category.id !== "all" && category.id === path[1],
        )) ||
      (path[0] === "etiket" &&
        catalog.apps.some((app) => app.tags.includes(path[1]))) ||
      (path[0] === "rehber" && GUIDES.some((guide) => guide.id === path[1])) ||
      (path[0] === "is-akisi" &&
        WORKFLOWS.some((workflow) => workflow.id === path[1])));
  if (
    path.length &&
    !(path.length === 1 && Object.hasOwn(PAGE_NAMES, path[0])) &&
    !detailExists
  )
    notFound();
  const platform =
    typeof query.platform === "string" &&
    ["android", "ios", "windows"].includes(query.platform)
      ? (query.platform as Platform)
      : "all";
  const category =
    path[0] === "kategori"
      ? (path[1] as Category)
      : CATEGORIES.some((c) => c.id === query.category)
        ? (query.category as Category)
        : "all";
  const compare =
    typeof query.apps === "string"
      ? [
          ...new Set(
            query.apps
              .split(",")
              .filter((id) => catalog.apps.some((app) => app.id === id)),
          ),
        ].slice(0, 4)
      : [];
  const schema = structuredData(path, catalog);
  return (
    <>
      {schema.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
        />
      )}
      <CatalogExperience
        path={path}
        catalog={catalog}
        initialQuery={typeof query.q === "string" ? query.q.slice(0, 200) : ""}
        initialPlatform={platform}
        initialCategory={category}
        initialCompare={compare}
        initialCompareSpecified={typeof query.apps === "string"}
      >
        {policyRoutes.has(path[0]) ? <PolicyPage slug={path[0]} /> : undefined}
      </CatalogExperience>
    </>
  );
}
