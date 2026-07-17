import { expect, test } from "./fixtures";

// Opens the kanji drawer directly via the ?open= URL param and checks the
// stroke-order animation section — the E2E guard for the KanjiDMAK refactor.
test("kanji drawer shows the stroke-order animation section", async ({
  page,
}) => {
  await page.goto("/?open=%E6%B0%B4"); // 水

  const drawer = page.getByRole("dialog");
  await expect(drawer).toBeVisible({ timeout: 30_000 });

  // The section lives in a collapsed accordion — expand it first.
  const accordionTrigger = drawer.getByRole("button", {
    name: /Stroke Order/,
  });
  await accordionTrigger.scrollIntoViewIfNeeded();
  await accordionTrigger.click();

  const replayArea = drawer.locator('[title="Replay stroke order"]');
  await replayArea.scrollIntoViewIfNeeded();
  await expect(replayArea).toBeVisible({ timeout: 30_000 });

  // Replay speed controls render next to the animation.
  await expect(
    drawer.getByRole("button", { name: "Animate", exact: true })
  ).toBeVisible();
  await expect(
    drawer.getByRole("button", { name: "Animate Slowly" })
  ).toBeVisible();

  // dmak drew the (mocked) KanjiVG strokes into the container.
  await expect(replayArea.locator("svg").first()).toBeVisible({
    timeout: 15_000,
  });
});
