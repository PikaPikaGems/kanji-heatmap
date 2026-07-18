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

  test("speed katakana: typing skip advances without matching", async ({
    page,
  }) => {
    await page.goto("/speed-katakana");

    await page.getByRole("button", { name: "Start Game" }).click();
    await expect(page.getByText("パーセント")).toBeVisible({
      timeout: 30_000,
    });

    const answerBox = page.getByPlaceholder('Type romaji or "skip"');
    await answerBox.pressSequentially("skip");
    await answerBox.press("Enter");

    await expect(page.getByText("2 / 48")).toBeVisible();
    await expect(page.getByText("アメリカ")).toBeVisible();
  });

  test("reading practice: forgot path returns to the start screen", async ({
    page,
  }) => {
    await page.goto("/reading-practice");

    const startButton = page.getByRole("button", { name: "Start Practicing" });
    await expect(startButton).toBeEnabled({ timeout: 30_000 });
    await startButton.click();

    const answerBox = page.getByLabel('Type the reading or type "forgot"');
    await expect(answerBox).toBeVisible({ timeout: 30_000 });

    await page.getByRole("button", { name: "Forgot" }).click();
    await expect(page.getByLabel("Forgot")).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();

    // Back on an answer prompt (next card) — end the session from there.
    await expect(
      page.getByLabel('Type the reading or type "forgot"')
    ).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: "End session" }).click();

    await expect(
      page.getByRole("button", { name: "Start Practicing" })
    ).toBeVisible({ timeout: 30_000 });
  });

  test("writing practice: model load failure surfaces retry UI", async ({
    page,
  }) => {
    await page.goto("/writing-practice");

    const startButton = page.getByRole("button", { name: "Start Practicing" });
    await expect(startButton).toBeEnabled({ timeout: 30_000 });
    await startButton.click();

    // Fixtures abort /onnx/**, so warmup fails and the error screen appears.
    await expect(
      page.getByRole("heading", { name: "Could not load the model" })
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Back" })).toBeVisible();

    await page.getByRole("button", { name: "Back" }).click();
    await expect(startButton).toBeVisible({ timeout: 30_000 });
  });
});
