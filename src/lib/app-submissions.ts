import type { ArticleImage, PricingModel } from './domain';
import type { Platform } from './catalog';

export type SubmissionStatus = 'draft' | 'pending' | 'accepted' | 'rejected' | 'withdrawn';
export interface SubmissionDraft {
  name: string; tagline: string; description: string; publisher: string; website: string;
  category: 'productivity' | 'notes' | 'documents' | 'media' | 'browser' | 'design';
  sourceLocale: string; pricingModel: PricingModel; tags: string[];
  storeLinks: Partial<Record<Platform, string>>; contactName: string; contactEmail: string;
}
export interface AppSubmission {
  id: string; status: SubmissionStatus; revision: number; draft: SubmissionDraft;
  icon: ArticleImage | null; screenshots: ArticleImage[]; reviewNote: string;
  recordId: string | null; createdAt: string; updatedAt: string;
}
export interface SubmissionSettings { enabled: boolean; revision: number; }
export interface SubmissionConfig {
  enabled: boolean; limits: { maxScreenshots: number; maxImageBytes: number; maxUploads: number };
  locales: { code: string; label: string }[]; categories: { id: string; label: string }[];
}
export interface SubmissionWorkspace {
  settings: SubmissionSettings; items: AppSubmission[];
  pagination: { page: number; pages: number; total: number; pageSize: number };
  counts: Record<SubmissionStatus, number>;
}
