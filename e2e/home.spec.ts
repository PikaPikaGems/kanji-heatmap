import { expect, test } from "./fixtures";

// The kanji grid is fed by the web worker + public/json pipeline, so these
// assertions prove data loading, search, and the detail drawer end to end.
test.describe("explore screen", () => {
  test("renders the kanji grid with an item count", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText(/\d+ Items/)).toBeVisible({ timeout: 30_000 });

    // At least one kanji cell button is rendered by the virtualized list.
    await expect(
      page.getByRole("button", { name: /水|一|人|日/ }).first()
    ).toBeVisible({ timeout: 30_000 });
  });

  test("search narrows results", async ({ page }) => {
    await page.goto("/");

    const searchBox = page.getByPlaceholder("Enter any On or Kun reading");
    await expect(searchBox).toBeVisible();

    await searchBox.fill("みず");
    // Debounced settle (400ms) then worker round-trip.
    await expect(page.getByText(/\d+ Items? Matched/)).toBeVisible({
      timeout: 30_000,
    });
  });

  test("clicking a kanji opens and closes the detail drawer", async ({
    page,
  }) => {
    await page.goto("/?search-text=%E3%81%BF%E3%81%9A"); // みず

    const kanjiCell = page.getByRole("button", { name: /水/ }).first();
    await expect(kanjiCell).toBeVisible({ timeout: 30_000 });
    await kanjiCell.click();

    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText("水").first()).toBeVisible({
      timeout: 15_000,
    });

    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
  });
});
