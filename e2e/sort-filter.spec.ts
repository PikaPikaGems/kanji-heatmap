import { expect, test } from "./fixtures";

test.describe("sort and filter", () => {
  test("JLPT filter via URL narrows the grid", async ({ page }) => {
    await page.goto("/?filter-jlpt=n5");

    await expect(page.getByText(/\d+ Items Matched/)).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByRole("button", { name: /水|一|人|日/ }).first()
    ).toBeVisible({ timeout: 30_000 });
  });

  test("sort-primary via URL is applied", async ({ page }) => {
    await page.goto("/?sort-primary=strokes");

    await expect(page.getByText(/\d+ Items/)).toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveURL(/sort-primary=strokes/);
  });

  test("sort and filter dialog apply updates the URL", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/\d+ Items/)).toBeVisible({ timeout: 30_000 });

    await page
      .getByRole("button", { name: "Sort and Filter Settings" })
      .click();

    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: "Sorting and Filtering Settings" })
    ).toBeVisible();

    // Desktop uses Combobox for Primary sort.
    await dialog.getByRole("combobox").first().click();
    await page.getByRole("option", { name: /Stroke Count/ }).click();

    await dialog.getByRole("button", { name: "Apply" }).click();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/sort-primary=strokes/);
    await expect(page.getByText(/\d+ Items/)).toBeVisible({ timeout: 30_000 });
  });

  test("Jouyou-grade filter from the dialog updates the URL", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByText(/\d+ Items/)).toBeVisible({ timeout: 30_000 });

    await page
      .getByRole("button", { name: "Sort and Filter Settings" })
      .click();

    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Jouyou Grade").click();
    await page.getByRole("option", { name: "Grade 1", exact: true }).click();
    await page.keyboard.press("Escape");
    await dialog.getByRole("button", { name: "Apply" }).click();

    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/filter-jouyou-grade=1/);
    await expect(page.getByText(/\d+ Items Matched/)).toBeVisible({
      timeout: 30_000,
    });
  });

  test("clear all restores defaults from the dialog", async ({ page }) => {
    await page.goto("/?sort-primary=strokes&filter-jlpt=n5");
    await expect(page.getByText(/\d+ Items Matched/)).toBeVisible({
      timeout: 30_000,
    });

    await page
      .getByRole("button", { name: "Sort and Filter Settings" })
      .click();

    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Clear all" }).click();
    await dialog.getByRole("button", { name: "Apply" }).click();

    await expect(dialog).toBeHidden();
    await expect(page).not.toHaveURL(/sort-primary=/);
    await expect(page).not.toHaveURL(/filter-jlpt=/);
    await expect(page.getByText(/\d+ Items(?! Matched)/)).toBeVisible({
      timeout: 30_000,
    });
  });
});
