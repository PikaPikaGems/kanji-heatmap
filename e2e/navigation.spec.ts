import { expect, test } from "./fixtures";

test.describe("navigation", () => {
  test("dashboard renders", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText(/Local storage only/)).toBeVisible({
      timeout: 30_000,
    });
  });

  test("about page renders", async ({ page }) => {
    await page.goto("/about");
    await expect(
      page.getByRole("heading", { name: "About", exact: true })
    ).toBeVisible({ timeout: 30_000 });
  });

  test("unknown route shows the 404 screen", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");
    await expect(page.getByText("Page Not Found")).toBeVisible({
      timeout: 30_000,
    });
  });
});
