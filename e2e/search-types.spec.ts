import { expect, test } from "./fixtures";

test.describe("search types", () => {
  test("meanings search via type select narrows results", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("Search Type").click();
    await page.getByRole("option", { name: "Meanings", exact: true }).click();

    const searchBox = page.getByLabel("Search kanji");
    await expect(searchBox).toHaveAttribute(
      "placeholder",
      "Enter meanings (e.g., world, person)"
    );

    await searchBox.fill("water");
    await expect(page.getByText(/\d+ Items? Matched/)).toBeVisible({
      timeout: 30_000,
    });
    await expect(page).toHaveURL(/search-type=meanings/);
    await expect(page).toHaveURL(/search-text=water/);
  });

  test("similar shapes search via URL returns matches", async ({ page }) => {
    await page.goto("/?search-type=similar&search-text=%E6%B0%B4"); // 水

    await expect(page.getByText(/\d+ Items? Matched/)).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByRole("button", { name: /氷|永|泳/ }).first()
    ).toBeVisible({ timeout: 30_000 });
  });

  test("clear search restores the full grid", async ({ page }) => {
    await page.goto("/?search-type=meanings&search-text=water");

    await expect(page.getByText(/\d+ Items? Matched/)).toBeVisible({
      timeout: 30_000,
    });

    await page.getByRole("button", { name: /Clear search text/ }).click();

    await expect(page.getByLabel("Search kanji")).toHaveValue("");
    await expect(page.getByText(/\d+ Items(?! Matched)/)).toBeVisible({
      timeout: 30_000,
    });
  });
});
