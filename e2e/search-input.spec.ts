import { expect, test } from "./fixtures";

// Guards SearchInput's paste script-inference behavior (onPaste + the
// "Switched to …" hint chip) ahead of the controller-hook refactor.
// Dispatches a real ClipboardEvent with DataTransfer (not fill/type) so the
// onPaste path runs without touching the OS clipboard — headed parallel
// workers share one system clipboard and race if they use Ctrl/Cmd+V.
const pasteInto = async (
  page: import("@playwright/test").Page,
  text: string
) => {
  const searchBox = page.getByLabel("Search kanji");
  await expect(searchBox).toBeVisible();
  await searchBox.click();
  await searchBox.evaluate((el, value) => {
    const dt = new DataTransfer();
    dt.setData("text/plain", value);
    el.dispatchEvent(
      new ClipboardEvent("paste", {
        clipboardData: dt,
        bubbles: true,
        cancelable: true,
      })
    );
  }, text);
  return searchBox;
};

test.describe("search input type inference", () => {
  test("pasting kanji switches to Multi-Kanji with a hint chip", async ({
    page,
  }) => {
    await page.goto("/");

    const searchBox = await pasteInto(page, "水火");

    await expect(page.getByText("Switched to Multi-Kanji")).toBeVisible();
    await expect(searchBox).toHaveValue("水火");
    await expect(page.getByText(/\d+ Items? Matched/)).toBeVisible({
      timeout: 30_000,
    });
  });

  test("pasting a roman word switches to Meanings", async ({ page }) => {
    await page.goto("/");

    const searchBox = await pasteInto(page, "water");

    await expect(page.getByText("Switched to Meanings")).toBeVisible();
    await expect(searchBox).toHaveValue("water");
  });

  test("pasting kana keeps the default Readings type and searches", async ({
    page,
  }) => {
    await page.goto("/");

    const searchBox = await pasteInto(page, "みず");

    // Same type as the default — no switch announcement expected.
    await expect(searchBox).toHaveValue("みず");
    await expect(page.getByText(/\d+ Items? Matched/)).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/Switched to/)).toBeHidden();
  });
});
