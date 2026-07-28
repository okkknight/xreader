import { expect, test } from "@playwright/test";

test("shows the XReader today shell", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("XReader");
  await expect(page.getByRole("banner")).toHaveText("XReader");
  await expect(page.getByRole("main")).toContainText("Today");
});
