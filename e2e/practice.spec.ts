import { expect, test } from "./fixtures";

// Guards the practice deck-building flow (buildPracticeDeck + local JSON) and
// the recognition game screen — the E2E guard for the practice refactors.
test.describe("practice modes", () => {
  test("reading practice: start a session reaches the game screen", async ({
    page,
  }) => {
    await page.goto("/reading-practice");

    const startButton = page.getByRole("button", { name: "Start Practicing" });
    await expect(startButton).toBeVisible({ timeout: 30_000 });
    await expect(startButton).toBeEnabled({ timeout: 30_000 });
    await startButton.click();

    // The game screen shows the kana answer input.
    await expect(page.getByRole("textbox")).toBeVisible({ timeout: 30_000 });
  });

  test("writing practice: initial screen renders", async ({ page }) => {
    await page.goto("/writing-practice");
    await expect(
      page.getByRole("button", { name: "Start Practicing" })
    ).toBeVisible({ timeout: 30_000 });
  });
});
