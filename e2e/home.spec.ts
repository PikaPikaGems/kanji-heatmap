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

  test("card presentation settings popover opens", async ({ page }) => {
    await page.goto("/");

    await page
      .getByRole("button", { name: "Card Presentation Settings" })
      .click();

    await expect(
      page.getByRole("heading", { name: "Border Color Meaning" })
    ).toBeVisible();
  });

  test("card presentation can switch border meaning to study status", async ({
    page,
  }) => {
    await page.goto("/");

    await page
      .getByRole("button", { name: "Card Presentation Settings" })
      .click();

    await page.getByLabel("Border Color Meaning").click();
    await page
      .getByRole("option", { name: "Study Status", exact: true })
      .click();

    await expect(page.getByText("Bookmarked & Reviewing")).toBeVisible();
    await expect(page.getByText("No Status")).toBeVisible();
  });

  test("radical search opens its drawer", async ({ page }) => {
    await page.goto("/?search-type=radicals");

    await page.getByPlaceholder("Click to select one or more radicals").click();

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 30_000 });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("radical results preview virtualises without dropping matches", async ({
    page,
  }) => {
    // The strip is virtualised, so only a window of the matches is in the DOM at
    // once. jsdom cannot check this — it reports a zero-size viewport — so the
    // guarantee that every match stays reachable is verified here.
    await page.goto("/?search-type=radicals");
    await page.getByPlaceholder("Click to select one or more radicals").click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 30_000 });

    await page.getByRole("button", { name: "水", exact: true }).first().click();

    const strip = page.getByTestId("results-strip");
    await expect(strip).toBeVisible();

    const before = await strip.evaluate((el) => ({
      mounted: el.querySelectorAll("button").length,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      first: el.querySelector("button")?.textContent ?? "",
    }));

    // Scrollable, and mounting far fewer items than it can scroll through.
    expect(before.scrollWidth).toBeGreaterThan(before.clientWidth);
    expect(before.mounted).toBeGreaterThan(0);
    expect(before.mounted * 200).toBeLessThan(before.scrollWidth * 2);

    await strip.evaluate((el) => {
      el.scrollLeft = el.scrollWidth;
    });

    // Later matches render on demand, so the leading item changes rather than
    // the list simply ending early.
    await expect
      .poll(async () =>
        strip.evaluate((el) => el.querySelector("button")?.textContent ?? "")
      )
      .not.toBe(before.first);
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
