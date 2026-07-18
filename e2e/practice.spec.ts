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

  // Guards the Speed Katakana matching engine before its extraction into
  // lib/speed-katakana-match. Default settings keep word order fixed, so
  // challenge set 1 always starts with パーセント ("paasento" — also covers
  // the long-vowel ー ↔ doubled-vowel match).
  test("speed katakana: typing the correct romaji advances the word", async ({
    page,
  }) => {
    await page.goto("/speed-katakana");

    await page.getByRole("button", { name: "Start Game" }).click();

    await expect(page.getByText("パーセント")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("1 / 48")).toBeVisible();

    const answerBox = page.getByPlaceholder('Type romaji or "skip"');
    await answerBox.pressSequentially("paasento");

    // A correct answer advances to word 2 and clears the input.
    await expect(page.getByText("2 / 48")).toBeVisible();
    await expect(page.getByText("アメリカ")).toBeVisible();
    await expect(answerBox).toHaveValue("");
  });
});
