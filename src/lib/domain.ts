import type { CatalogApp, Platform } from "./catalog";

export type EvidenceState = "supported" | "limited" | "unsupported" | "unknown";
export type PricingModel =
  | "free"
  | "freemium"
  | "subscription"
  | "one-time"
  | "unknown";
export type FactKey =
  | "offline"
  | "sync"
  | "export"
  | "account-free"
  | "ad-free"
  | "ocr";
export interface AppFact {
  key: FactKey;
  platform: Platform;
  state: EvidenceState;
  detail: string;
  sourceUrl: string;
  checkedAt: string;
  evidence: "publisher" | "tested";
}
export interface AppPlan {
  id: string;
  name: string;
  currency: "TRY" | "USD" | "EUR";
  monthlyPrice: number | null;
  annualPrice: number | null;
  perSeat: boolean;
  free: boolean;
  platforms: Platform[];
  features: FactKey[];
  limits: { label: string; value: string }[];
  sourceUrl: string;
  checkedAt: string;
  note: string;
}
export type { StoreIdentity } from "./store-identities";
export interface SEOFields { title?: string; description?: string; noindex?: boolean; }
export interface ArticleCover { assetId: string; alt: string; caption: string; aiGenerated: true; }
export interface AppRecord extends CatalogApp {
  screenshots?: ArticleImage[];
  seo?: SEOFields;
  storeIds?: import("./store-identities").StoreIdentity[];
  publisher: string;
  tags: string[];
  aliases: string[];
  pricingModel: PricingModel;
  facts: AppFact[];
  plans: AppPlan[];
  storeMetrics: {
    platform: Platform;
    country: string;
    downloadsLowerBound: number | null;
    rating: number | null;
    ratingCount: number | null;
    sourceUrl: string;
    observedAt: string;
  }[];
}
export interface ArticleImage { assetId:string; format:'png'|'jpg'|'webp'; width:number; height:number; alt:string; caption:string; aiGenerated:boolean; }
export interface ArticleRecord {
  images?: ArticleImage[];
  seo?: SEOFields;
  cover?: ArticleCover;
  id: string;
  title: string;
  summary: string;
  kind: "guide" | "comparison" | "alternatives" | "review" | "news";
  author: string;
  sections: { heading: string; paragraphs: string[] }[];
  appIds: string[];
  sources: { title: string; url: string }[];
  method: "source-research" | "editor-tested";
  publishedAt: string;
  updatedAt: string;
}
export interface EditorialList {
  seo?: SEOFields;
  id: string;
  title: string;
  summary: string;
  period: "week" | "month" | "evergreen";
  startDate: string;
  endDate: string;
  entries: { appId: string; reason: string }[];
  method: string;
}
export type RecordKind = "app" | "article" | "list";
export type PublicationStatus =
  | "draft"
  | "review"
  | "scheduled"
  | "published"
  | "archived";
export interface RecordDataMap {
  app: AppRecord;
  article: ArticleRecord;
  list: EditorialList;
}
export type ManagedRecord<K extends RecordKind = RecordKind> = {
  /** Absent on legacy records; their authored language is Turkish. */
  sourceLocale?: string;
  admissionException?: string;
  kind: K;
  id: string;
  data: RecordDataMap[K];
  status: PublicationStatus;
  revision: number;
  updatedAt: string;
  reviewNote: string;
  seoApproved: boolean;
  publishAt: string | null;
};
export interface CatalogSnapshot {
  appSubmissions?: { enabled: boolean };
  siteName?: string;
  branding?: import("./branding").SiteBranding;
  extensionBlocks?: import('./module-packages').PublicExtensionBlock[];
  admissionRules?: import("./admission").AdmissionRules;
  admissions?: Record<string, import("./admission").AdmissionEvaluation>;
  siteSettings?: import("./site-settings").SiteSettings;
  apps: AppRecord[];
  articles: ArticleRecord[];
  lists: EditorialList[];
  records: Pick<ManagedRecord, "id" | "kind" | "updatedAt" | "seoApproved" | "sourceLocale">[];
}
export interface FeedbackRecord {
  id: number;
  appId: string;
  field: string;
  message: string;
  status: "open" | "resolved" | "dismissed";
  createdAt: string;
}
export interface AuditEvent {
  id: number;
  action: string;
  subject: string;
  detail: string;
  createdAt: string;
}
export const FACT_LABELS: Record<FactKey, string> = {
  offline: "Çevrimdışı kullanım",
  sync: "Cihazlar arası eşitleme",
  export: "Dışa aktarma",
  "account-free": "Hesapsız kullanım",
  "ad-free": "Reklamsız kullanım",
  ocr: "OCR / metin tanıma",
};
export const EVIDENCE_LABELS: Record<EvidenceState, string> = {
  supported: "Destekleniyor",
  limited: "Sınırlı",
  unsupported: "Desteklenmiyor",
  unknown: "Doğrulanmadı",
};
