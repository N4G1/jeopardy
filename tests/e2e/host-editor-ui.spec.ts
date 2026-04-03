import { expect, test } from "@playwright/test";

test.describe("host editor ui", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Host game" })).toBeVisible();
  });

  test("shows an in-viewport toast for validation errors and hides it after 5 seconds", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Save board" }).click();

    const toast = page.getByRole("status");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("Board name is required before saving.");

    const box = await toast.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeLessThan(80);

    await page.waitForTimeout(5200);
    await expect(toast).toBeHidden();
  });

  test("aligns category widths with clue widths and centers clue values", async ({ page }) => {
    const category = page.locator(".board-editor-grid__category-input").first();
    const clueTile = page.locator(".board-editor-grid__clue-tile").first();
    const clueValue = clueTile.locator(".board-editor-grid__clue-value");
    const frame = page.locator(".board-editor-grid__frame");

    const categoryBox = await category.boundingBox();
    const clueTileBox = await clueTile.boundingBox();
    const clueValueBox = await clueValue.boundingBox();
    const frameBox = await frame.boundingBox();
    const viewport = page.viewportSize();

    expect(categoryBox).not.toBeNull();
    expect(clueTileBox).not.toBeNull();
    expect(clueValueBox).not.toBeNull();
    expect(frameBox).not.toBeNull();
    expect(viewport).not.toBeNull();

    expect(Math.abs(categoryBox!.width - clueTileBox!.width)).toBeLessThanOrEqual(2);

    const cellCenterX = clueTileBox!.x + clueTileBox!.width / 2;
    const cellCenterY = clueTileBox!.y + clueTileBox!.height / 2;
    const textCenterX = clueValueBox!.x + clueValueBox!.width / 2;
    const textCenterY = clueValueBox!.y + clueValueBox!.height / 2;

    expect(Math.abs(cellCenterX - textCenterX)).toBeLessThanOrEqual(2);
    expect(Math.abs(cellCenterY - textCenterY)).toBeLessThanOrEqual(2);
    expect(frameBox!.width / viewport!.width).toBeGreaterThanOrEqual(0.9);
  });
});
