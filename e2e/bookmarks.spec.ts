import { expect, test } from "./fixtures";

test.describe("bookmarks", () => {
  test("bookmarking a kanji updates explore badge and dashboard", async ({
    page,
  }) => {
    await page.goto("/?open=%E6%B0%B4"); // 水

    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible({ timeout: 30_000 });

    const bookmarkButton = drawer.getByRole("button", { name: "Bookmark" });
    await expect(bookmarkButton).toBeVisible({ timeout: 30_000 });
    await bookmarkButton.click();
    await expect(
      drawer.getByRole("button", { name: "✓ Bookmarked" })
    ).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();

    await expect(page.getByText("✓ 1 Bookmarked")).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/dashboard");
    await expect(page.getByText("Bookmarks")).toBeVisible({
      timeout: 30_000,
    });
    // 水 is N5 — the band row should show one bookmarked entry.
    await expect(page.getByText(/^1 \/ \d+$/)).toBeVisible({
      timeout: 30_000,
    });
  });

  test("reading practice bookmarked-only with empty bookmarks disables start", async ({
    page,
  }) => {
    await page.goto("/reading-practice");

    await expect(
      page.getByRole("button", { name: "Start Practicing" })
    ).toBeVisible({ timeout: 30_000 });

    await page.getByLabel("Bookmarked only").click();

    await expect(page.getByText("0 kanji match your filters")).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByRole("button", { name: "Start Practicing" })
    ).toBeDisabled();
  });
});
