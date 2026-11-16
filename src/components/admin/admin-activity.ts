/** Presentation labels only; the original audit fields remain available in details. */
const labels: Record<string, string> = {
  save: "Content saved",
  import: "Content imported",
  feedback: "Feedback updated",
  "site-settings": "Site appearance updated",
  "seo-settings": "SEO settings updated",
  "admission-rules": "Catalog admission rules updated",
  "restore-backup": "Catalog backup restored",
  "account-security": "Account security updated",
  "owner-recovery": "Owner account recovered",
  "editor-save": "Editor account updated",
  "performance-settings": "Performance settings updated",
  "capabilities-save": "Verified facts updated",
  "proposal-review": "Update proposal reviewed",
  "growth-save": "Growth content saved",
  "growth-gsc": "Search Console data imported",
  "growth-lifecycle": "Content lifecycle updated",
  localization: "Language settings updated",
  "translation-save": "Translation saved",
  "translation-restore": "Translation revision restored",
  "upgrade-prepare": "Upgrade prepared",
  "upgrade-apply": "Upgrade applied",
  "source-providers": "Store providers updated",
  "source-queued": "Source refresh queued",
  "source-worker": "Source worker activity recorded",
  "submission-created": "Submission draft created",
  "submission-save": "Submission draft updated",
  "submission-submit": "Application submitted for review",
  "submission-withdraw": "Submission withdrawn",
  "submission-accept": "Submission accepted as a catalog draft",
  "submission-reject": "Submission rejected",
  "submission-purge": "Closed submission removed",
  "submission-settings": "Submission settings updated",
};

export function activityLabel(action: string): string {
  if (Object.hasOwn(labels, action)) return labels[action];
  if (action.startsWith("submission-")) return "Submission activity recorded";
  if (action.startsWith("module-")) return "Module activity recorded";
  if (action.startsWith("language-package-")) return "Language package activity recorded";
  if (action.startsWith("source-")) return "Source activity recorded";
  return "Activity recorded";
}
