import { expect, test } from "@playwright/test";

test("guided reading highlights the current sentence and supports reading mode", async ({ page }) => {
  await page.goto("/articles/why-rain-has-a-smell");
  await page.getByRole("button", { name: "开始讲解" }).click();
  await expect(page.locator("[data-sentence-id='seed-rain-p01-s01']")).toHaveAttribute("data-active", "true");
  await page.getByRole("button", { name: "阅读模式" }).click();
  await expect(page.getByRole("button", { name: "回到当前讲解" })).toBeHidden();
  await expect(page.getByRole("button", { name: "显示中文" }).first()).toBeVisible();
});
