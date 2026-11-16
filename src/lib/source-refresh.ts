import type { AppRecord } from "./domain";
export type RefreshPatch = Pick<
  AppRecord,
  "storeMetrics" | "storeIds" | "storeLinks"
>;
export interface RefreshCandidate {
  id: string;
  appId: string;
  baseRevision: number;
  status: "pending" | "applied" | "dismissed" | "error";
  source: string;
  createdAt: string;
  updatedAt: string;
  before: RefreshPatch;
  after: RefreshPatch;
  diff: string[];
  error?: string;
}
export interface RefreshFreshness {
  appId: string;
  name: string;
  fields: {
    field: string;
    checkedAt: string | null;
    state: "fresh" | "stale" | "unknown";
  }[];
}
export interface RefreshState {
  candidates: RefreshCandidate[];
  freshness: RefreshFreshness[];
  providers: { ios: string; android: string; windows: string };
}
