import { expect, test } from "@playwright/test";
import path from "node:path";
import fs from "node:fs/promises";

test.describe("board persistence", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Host game" })).toBeVisible();
  });

  test("autosaves board title and restores it after refresh", async ({ page }) => {
    const titleInput = page.getByLabel("Board title");
    await titleInput.fill("Trivia Night");
    await page.waitForTimeout(500);

    await page.reload();
    await expect(page.getByRole("heading", { name: "Host game" })).toBeVisible();
    await expect(titleInput).toHaveValue("Trivia Night");
  });

  test("autosaves a filled clue and restores it after refresh", async ({ page }) => {
    const firstClue = page.getByRole("button", { name: /Clue row 1, column 1/ });
    await firstClue.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Question text").fill("What is 2+2?");
    await dialog.getByLabel("Answer text").fill("4");
    await dialog.getByRole("button", { name: "Save" }).click();

    await expect(dialog).not.toBeVisible();
    await page.waitForTimeout(500);

    await page.reload();
    await expect(page.getByRole("heading", { name: "Host game" })).toBeVisible();

    const restoredClue = page.getByRole("button", { name: /Clue row 1, column 1/ });
    await expect(restoredClue).toContainText("What is 2+2?");
  });

  test("saves a named board and loads it back", async ({ page }) => {
    const titleInput = page.getByLabel("Board title");
    await titleInput.fill("Geography Quiz");

    const boardNameInput = page.getByLabel("Board name");
    await boardNameInput.fill("My Geography Board");
    await page.getByRole("button", { name: "Save board" }).click();

    await titleInput.fill("Changed Title");

    await page.getByRole("button", { name: "Load My Geography Board" }).click();
    await expect(titleInput).toHaveValue("Geography Quiz");
  });

  test("exports board to JSON and imports it back", async ({ page }) => {
    const titleInput = page.getByLabel("Board title");
    await titleInput.fill("Export Test Board");

    const firstClue = page.getByRole("button", { name: /Clue row 1, column 1/ });
    await firstClue.click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Question text").fill("Capital of France?");
    await dialog.getByLabel("Answer text").fill("Paris");
    await dialog.getByRole("button", { name: "Save" }).click();
    await expect(dialog).not.toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export JSON" }).click();
    const download = await downloadPromise;
    const downloadPath = path.join("test-results", download.suggestedFilename());
    await download.saveAs(downloadPath);

    await titleInput.fill("Overwritten");
    const importInput = page.getByLabel("Import JSON");
    await importInput.setInputFiles(downloadPath);

    await expect(titleInput).toHaveValue("Export Test Board");

    const restoredClue = page.getByRole("button", { name: /Clue row 1, column 1/ });
    await expect(restoredClue).toContainText("Capital of France?");

    await fs.rm(downloadPath, { force: true });
  });

  test("imports a work-in-progress board with empty clues", async ({ page }) => {
    const wipBoard = {
      title: "WIP Board",
      rowCount: 2,
      columnCount: 2,
      columnTitles: ["Cat A", "Cat B"],
      clues: [
        {
          id: "c0",
          rowIndex: 0,
          columnIndex: 0,
          value: 100,
          prompt: "Only this filled",
          response: "",
        },
        { id: "c1", rowIndex: 0, columnIndex: 1, value: 100, prompt: "", response: "" },
        { id: "c2", rowIndex: 1, columnIndex: 0, value: 200, prompt: "", response: "" },
        { id: "c3", rowIndex: 1, columnIndex: 1, value: 200, prompt: "", response: "" },
      ],
    };

    const tmpPath = path.join("test-results", "wip-board.json");
    await fs.mkdir("test-results", { recursive: true });
    await fs.writeFile(tmpPath, JSON.stringify(wipBoard));

    const importInput = page.getByLabel("Import JSON");
    await importInput.setInputFiles(tmpPath);

    await expect(page.getByLabel("Board title")).toHaveValue("WIP Board");

    await fs.rm(tmpPath, { force: true });
  });

  test("clears the draft", async ({ page }) => {
    const titleInput = page.getByLabel("Board title");
    await titleInput.fill("Draft to Clear");
    await page.waitForTimeout(500);

    await page.reload();
    await expect(page.getByRole("heading", { name: "Host game" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Clear draft" })).toBeVisible();

    await page.getByRole("button", { name: "Clear draft" }).click();
    await expect(titleInput).toHaveValue("New Jeopardy Game");
  });
});
