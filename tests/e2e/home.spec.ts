import { expect, test } from "@playwright/test";

test("shows the XReader today shell", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("XReader");
  await expect(page.getByRole("banner").getByRole("link", { name: "XReader" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "主导航" }).getByRole("link", { name: "Today" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: /开始讲解|继续讲解/ })).toBeVisible();
});
