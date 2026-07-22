import { expect, test } from "./fixtures";

test.describe("site chrome", () => {
  test("floating island navigates between primary tabs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/\d+ Items/)).toBeVisible({ timeout: 30_000 });

    const island = page.getByRole("navigation", { name: "Primary" });
    await island.getByRole("link", { name: "Dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText(/Local storage only/)).toBeVisible({
      timeout: 30_000,
    });

    await island.getByRole("link", { name: "Visualize Mastery" }).click();
    await expect(page).toHaveURL(/\/mastery$/);
    await expect(page.getByText("Coming soon")).toBeVisible({
      timeout: 30_000,
    });

    await island.getByRole("link", { name: "Explore Kanji" }).click();
    await expect(page).toHaveURL(/\/(\?.*)?$/);
    await expect(page.getByText(/\d+ Items/)).toBeVisible({ timeout: 30_000 });
  });

  test("practice FAB opens modes and routes to reading practice", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByText(/\d+ Items/)).toBeVisible({ timeout: 30_000 });

    await page.getByRole("button", { name: "Open practice menu" }).click();
    await expect(page.getByText("Select a mode")).toBeVisible();

    await page.getByRole("link", { name: /Kanji Reading Practice/ }).click();
    // Trailing "?" is fine — wouter can leave an empty query string.
    await expect(page).toHaveURL(/\/reading-practice\/?(\?.*)?$/);
    await expect(
      page.getByRole("button", { name: "Start Practicing" })
    ).toBeVisible({ timeout: 30_000 });
  });

  test("header menu opens and routes to a docs page", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog", { name: "Navigation menu" });
    await expect(menu).toBeVisible();

    await menu.getByRole("link", { name: "Privacy Policy" }).click();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(
      page.getByRole("heading", { name: "Privacy Policy", exact: true })
    ).toBeVisible({ timeout: 30_000 });
  });

  test("theme toggle flips dark/light and persists", async ({ page }) => {
    await page.goto("/");

    // App default theme is dark; the toggle lives in the header drawer.
    await expect(page.locator("html")).toHaveClass(/dark/);

    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog", { name: "Navigation menu" });
    await expect(menu).toBeVisible();

    await menu.getByRole("button", { name: "Toggle theme" }).click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await expect
      .poll(async () =>
        page.evaluate(() => localStorage.getItem("vite-ui-theme"))
      )
      .toBe("light");

    await page.reload();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });
});
