import { expect, test } from "./fixtures";

test.describe("dashboard", () => {
  test("renders overview sections and activity filters", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.getByText(/Saved only on this device/)).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("All-time Overview")).toBeVisible();
    await expect(page.getByText("Activity Heatmap")).toBeVisible();
    await expect(page.getByText("Speed Katakana").first()).toBeVisible();
    await expect(page.getByText("Bookmarks")).toBeVisible();

    await expect(page.getByLabel("Previous period")).toBeVisible();
    await expect(page.getByLabel("Next period")).toBeVisible();

    await expect(
      page.getByRole("checkbox", { name: "Kanji Writing" })
    ).toBeVisible();
    await expect(
      page.getByRole("checkbox", { name: "Kanji Reading" })
    ).toBeVisible();
    await expect(
      page.getByRole("checkbox", { name: "Speed Katakana" })
    ).toBeVisible();
  });
});
