import { expect, test } from "@playwright/test";

test("serves a public privacy policy suitable for App Store review", async ({ page }) => {
  await page.goto("/privacy");

  await expect(page.getByRole("heading", { name: "隐私政策" })).toBeVisible();
  await expect(page.getByText("不收集姓名、邮箱、联系方式、精确位置、广告标识符或支付信息。", { exact: false })).toBeVisible();
  await expect(page.getByText("不使用第三方广告、跨应用跟踪或分析 SDK。", { exact: false })).toBeVisible();
});
