import { expect, test } from "@playwright/test";

test("loads the published course from the isolated end-to-end database", async ({ page }) => {
  await page.goto("/articles/why-rain-has-a-smell");

  await expect(page.getByRole("main")).toContainText("Why Does Rain Have a Smell?");
  await expect(page.getByRole("region", { name: "播放器" })).toBeVisible();
});

test("moves the active sentence within a multi-sentence guided block", async ({ page }) => {
  await page.goto("/articles/multi-sentence-fixture");

  await expect(page.getByRole("main")).toContainText("Two Sentences, One Guided Block");
  await page.getByRole("button", { name: "播放" }).click();
  await page.locator("audio").evaluate((audio: HTMLAudioElement) => {
    audio.currentTime = 1.8;
    audio.dispatchEvent(new Event("timeupdate"));
  });

  await expect(page.locator('[data-sentence-id="p01-s02"]')).toHaveAttribute("data-active", "true");
});
