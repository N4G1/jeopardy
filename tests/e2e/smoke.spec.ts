import { expect, test } from "@playwright/test";

test("host editor loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Host game" })).toBeVisible();
});
