import { expect, test } from "@playwright/test";

test("guided reading highlights the current sentence and supports reading mode", async ({ page }) => {
  await page.goto("/articles/why-rain-has-a-smell");
  await page.getByRole("button", { name: "开始讲解" }).click();
  await expect(page.locator("[data-sentence-id='seed-rain-p01-s01']")).toHaveAttribute("data-active", "true");
  await page.waitForTimeout(450);
  await page.evaluate(() => window.dispatchEvent(new Event("scroll")));
  await expect(page.getByRole("button", { name: "回到当前讲解" })).toBeVisible();
  await page.getByRole("button", { name: "回到当前讲解" }).click();
  await page.getByRole("button", { name: "阅读模式" }).click();
  await expect(page.getByRole("button", { name: "回到当前讲解" })).toBeHidden();
  await expect(page.getByRole("button", { name: "显示中文" }).first()).toBeVisible();
});

test("a guest can navigate a lesson and resume its completed state", async ({ page }) => {
  await page.goto("/articles/why-rain-has-a-smell");
  await page.getByRole("button", { name: "开始讲解" }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("xreader:progress:seed-rain") || "{}").guidedSegmentId)).toBe("seed-rain-seg-01");
  for (let index = 0; index < 21; index += 1) await page.getByRole("button", { name: "下一段" }).click();
  await expect(page.getByText("这一课已经听完了")).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("xreader:progress:seed-rain") || "{}").completed)).toBe(true);
  await page.reload();
  await expect(page.locator("[data-completed='true']")).toBeVisible();
  await expect(page.getByText("这一课已经听完了")).toBeVisible();
});
