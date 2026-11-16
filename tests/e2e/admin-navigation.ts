import { expect, type Page } from "@playwright/test";

/** These contributor workflows explicitly select the Turkish admin interface. */
export async function expectAdminOverview(page: Page) {
  await expect(
    page.locator("#admin-workspace-content").getByRole("heading", {
      level: 1,
      name: "Genel bakış",
      exact: true,
    }),
  ).toBeVisible();
}

/** Search exposes sections in collapsed groups and works in the mobile drawer. */
export async function openAdminSection(page: Page, label: string) {
  const openMenu = page.getByRole("button", { name: "Menüyü aç", exact: true });
  const drawer = page.getByRole("dialog", { name: "Yönetim menüsü", exact: true });
  if (!(await drawer.isVisible()) && (await openMenu.isVisible())) await openMenu.click();

  const search = page.getByRole("searchbox", {
    name: "Yönetim bölümlerinde ara",
    exact: true,
  });
  await search.fill(label);
  const navigation = page.getByRole("navigation", {
    name: "Yönetim bölümleri",
    exact: true,
  });
  await navigation
    .getByRole("button")
    .filter({ has: page.getByText(label, { exact: true }) })
    .click();
  await expect(
    page.locator("#admin-workspace-content").getByRole("heading", { level: 1 }),
  ).toHaveText(label);

  // Mobile navigation closes on selection; the closed drawer is not actionable.
  if (await search.isVisible()) await search.fill("");
}
