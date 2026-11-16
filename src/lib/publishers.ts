import type { AppRecord, CatalogSnapshot } from "./domain";
import type { Platform } from "./catalog";

// Preserve case, punctuation and accents: a similar name is not proof of identity.
export function publisherName(value: string): string {
  return value.normalize("NFC").trim().replace(/\s+/gu, " ");
}
export function publisherSearchText(value: string): string {
  return value
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}
export function publisherSlug(value: string): string {
  const name = publisherName(value);
  if (!name) return "";
  const readable =
    publisherSearchText(name)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "yayinci";
  // Lossless suffix keeps transliteration collisions disjoint and IDs independent of catalog order.
  const identity = Array.from(name, (char) =>
    char.codePointAt(0)!.toString(36),
  ).join(".");
  return `${readable}--${identity}`;
}
export interface PublisherGroup {
  name: string;
  slug: string;
  apps: AppRecord[];
  platforms: Platform[];
}
// Only pass the public snapshot: managed drafts must never be a directory source.
export function getPublishers(
  catalog: Pick<CatalogSnapshot, "apps">,
): PublisherGroup[] {
  const groups = new Map<string, PublisherGroup>();
  for (const app of catalog.apps) {
    const name = publisherName(app.publisher);
    if (!name) continue;
    let group = groups.get(name);
    if (!group) {
      group = { name, slug: publisherSlug(name), apps: [], platforms: [] };
      groups.set(name, group);
    }
    if (!group.apps.some((entry) => entry.id === app.id)) group.apps.push(app);
  }
  for (const group of groups.values()) {
    group.apps.sort(
      (a, b) => a.name.localeCompare(b.name, "tr") || a.id.localeCompare(b.id),
    );
    group.platforms = (["android", "ios", "windows"] as Platform[]).filter(
      (platform) => group.apps.some((app) => app.platforms.includes(platform)),
    );
  }
  return [...groups.values()].sort(
    (a, b) =>
      a.name.localeCompare(b.name, "tr") || a.slug.localeCompare(b.slug),
  );
}
export function findPublisher(
  catalog: Pick<CatalogSnapshot, "apps">,
  slug: string,
) {
  return getPublishers(catalog).find((group) => group.slug === slug);
}
