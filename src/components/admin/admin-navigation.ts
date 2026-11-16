import { Activity, ArchiveRestore, BookOpen, Boxes, CircleCheck, FileText, Gauge, Globe2, HardDriveDownload, Inbox, Languages, LayoutDashboard, MessageSquare, Palette, PanelsTopLeft, RefreshCw, SearchCheck, Settings2, ShieldCheck, Sparkles, Tags, Users, type LucideIcon } from "lucide-react";

export type AdminNavigationItem = { id: string; label: string; count?: number };
export const ADMIN_GROUPS = [
  { id: "workspace", label: "Workspace", items: ["overview", "records", "ai", "submissions", "feedback"] },
  { id: "catalog", label: "Catalog quality", items: ["capabilities", "sources", "admission"] },
  { id: "discovery", label: "Discoverability", items: ["seo", "growth", "translations", "performance"] },
  { id: "appearance", label: "Appearance", items: ["appearance", "extensions", "language-packs"] },
  { id: "administration", label: "Administration", items: ["security", "editors", "system-health", "transfer", "backup-transfer", "upgrade"] },
] as const;
export const ADMIN_ICONS: Record<string, LucideIcon> = {
  overview: LayoutDashboard, records: FileText, ai: Sparkles, submissions: Inbox, feedback: MessageSquare,
  capabilities: CircleCheck, sources: RefreshCw, admission: SearchCheck, seo: Globe2, growth: Tags,
  translations: Languages, performance: Gauge, appearance: Palette, extensions: Boxes,
  "language-packs": BookOpen, security: ShieldCheck, editors: Users, "system-health": Activity,
  transfer: HardDriveDownload, "backup-transfer": ArchiveRestore, upgrade: Settings2,
};
export const ADMIN_DESCRIPTIONS: Record<string, string> = {
  overview: "Your catalog, editorial work and recent activity in one place.",
  records: "Write, review and manage the content people discover.",
  ai: "Prepare AI suggestions, review their sources and apply them to drafts.",
  submissions: "Review submitted applications before preparing a catalog draft.",
  feedback: "Read corrections and follow up on catalog feedback.",
  capabilities: "Keep app features and platform differences grounded in evidence.",
  sources: "Review source changes and keep application information current.",
  admission: "Set the evidence required for applications to enter your catalog.",
  seo: "Manage how your site is presented to search engines and social platforms.",
  growth: "Organize useful landing pages, internal links and editorial opportunities.",
  translations: "Prepare language versions with their own review and publication status.",
  performance: "Inspect recorded performance observations and collection settings.",
  appearance: "Make the site your own with its identity, colors and layout.",
  extensions: "Choose the themes and modules that shape your public site.",
  "language-packs": "Install and manage the languages available to your community.",
  security: "Manage your sign-in protection and account recovery options.",
  editors: "Give each editor the access they need for their work.",
  "system-health": "Check this installation and the services it depends on.",
  transfer: "Import reviewed content and create a private catalog backup.",
  "backup-transfer": "Review a private backup before restoring catalog data.",
  upgrade: "Review compatibility and prepare an installation upgrade.",
};
export const ADMIN_DEFAULT_ICON = PanelsTopLeft;
