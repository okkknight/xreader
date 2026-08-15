import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test("reader controls remain visible on mobile", async ({ page }) => {
  await page.goto("/articles/why-rain-has-a-smell");
  await expect(page.getByRole("main")).toContainText("Why Does Rain Have a Smell?");
  await expect(page.getByRole("button", { name: "播放" })).toBeVisible();
  await expect(page.getByRole("region", { name: "播放器" })).toBeVisible();
});
