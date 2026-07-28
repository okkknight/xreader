import { expect, test } from "@playwright/test";

test("anonymous visitors are shown login and an authorized editor can edit a course", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "XReader 后台" })).toBeVisible();
  await page.getByLabel("密码").fill("test-admin-password");
  await page.getByRole("button", { name: "进入后台" }).click();
  await expect(page.getByRole("heading", { name: "内容工作台" })).toBeVisible();
  await page.getByText("Why Does Rain Have a Smell?").click();
  await expect(page.getByRole("heading", { name: "Why Does Rain Have a Smell?" })).toBeVisible();
  await page.getByRole("button", { name: "句子" }).click();
  await expect(page.getByText("seed-rain-p01-s01")).toBeVisible();
  await page.getByRole("button", { name: "来源" }).click();
  await page.getByLabel("来源标题").fill("Memory source");
  await page.getByLabel("来源 URL").fill("https://example.com/memory");
  await page.getByRole("button", { name: "保存来源" }).click();
  await expect(page.getByText("Memory source")).toBeVisible();
});
