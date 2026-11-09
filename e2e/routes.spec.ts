import { expect, test } from "./fixtures";

test.describe("route smoke coverage", () => {
  test("cumulative use graph renders its chart heading", async ({ page }) => {
    await page.goto("/cumulative-use-graph");
    await expect(
      page.getByRole("heading", {
        name: "Cumulative Use vs Standard Competition Ranking (Frequency)",
      })
    ).toBeVisible({ timeout: 30_000 });
  });

  test("terms of use page renders", async ({ page }) => {
    await page.goto("/terms");
    await expect(
      page.getByRole("heading", { name: "Terms of Use", exact: true })
    ).toBeVisible({ timeout: 30_000 });
  });

  test("privacy policy page renders", async ({ page }) => {
    await page.goto("/privacy");
    await expect(
      page.getByRole("heading", { name: "Privacy Policy", exact: true })
    ).toBeVisible({ timeout: 30_000 });
  });

  test("/docs redirects to /about", async ({ page }) => {
    await page.goto("/docs");
    await expect(page).toHaveURL(/\/about$/);
    await expect(
      page.getByRole("heading", { name: "About", exact: true })
    ).toBeVisible({ timeout: 30_000 });
  });
});
