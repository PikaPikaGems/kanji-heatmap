import { expect, test } from "./fixtures";

test.describe("kanji detail drawer", () => {
  test("accordion sections render static content", async ({ page }) => {
    await page.goto("/?open=%E6%B0%B4"); // 水

    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible({ timeout: 30_000 });

    // General Information is open by default.
    await expect(
      drawer.getByRole("button", { name: "General Information" })
    ).toBeVisible({ timeout: 30_000 });

    const structure = drawer.getByRole("button", {
      name: "Character Structure",
    });
    await structure.scrollIntoViewIfNeeded();
    await structure.click();

    const frequency = drawer.getByRole("button", { name: "Frequency Ranks" });
    await frequency.scrollIntoViewIfNeeded();
    await frequency.click();

    await expect(
      drawer.getByRole("button", { name: /External Links for 水/ })
    ).toBeVisible();
  });

  test("arrow keys move to the next kanji in the list", async ({ page }) => {
    await page.goto("/?open=%E6%B0%B4"); // 水

    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible({ timeout: 30_000 });
    await expect(drawer.getByText("水").first()).toBeVisible({
      timeout: 15_000,
    });

    await page.keyboard.press("ArrowRight");

    await expect(page).toHaveURL(/open=/);
    await expect(page).not.toHaveURL(/open=%E6%B0%B4/);
    await expect(drawer).toBeVisible();
  });

  test("review pile action shows coming soon popover", async ({ page }) => {
    await page.goto("/?open=%E6%B0%B4"); // 水

    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible({ timeout: 30_000 });

    await drawer
      .getByRole("button", { name: /Add .+ to my review pile/ })
      .click();
    await expect(page.getByText("Coming soon!")).toBeVisible();
  });
});
