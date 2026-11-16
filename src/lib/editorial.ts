import type { AppRecord, ArticleRecord, EditorialList } from "./domain";
import seed from "../../docs/editorial-seed.json";

// Source-attributed seed content is extended separately from the runtime database.
export const APP_ENRICHMENTS = seed.enrichments as unknown as Record<
  string,
  Partial<AppRecord>
>;
export const ARTICLES = seed.articles as ArticleRecord[];
export const EDITORIAL_LISTS = seed.lists as EditorialList[];
