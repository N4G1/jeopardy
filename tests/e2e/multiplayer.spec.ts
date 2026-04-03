import { expect, test } from "@playwright/test";

test("host creates game, player joins, buzzes, and host judges", async ({ context }) => {
  const hostPage = await context.newPage();
  await hostPage.goto("/");
  await expect(hostPage.getByRole("heading", { name: "Host game" })).toBeVisible();

  await hostPage.getByRole("button", { name: "Fill sample board" }).click();
  await hostPage.getByRole("button", { name: "Create Lobby" }).click();

  const joinLink = hostPage.locator(".panel__copy-link");
  await expect(joinLink).toBeVisible({ timeout: 5000 });
  const joinUrl = await joinLink.textContent();
  expect(joinUrl).toBeTruthy();

  const playerPage = await context.newPage();
  await playerPage.goto(joinUrl!);

  await expect(playerPage.getByRole("heading", { name: "Join game" })).toBeVisible();
  await playerPage.getByLabel("Display name").fill("Alice");
  await playerPage.getByRole("button", { name: "Join Lobby" }).click();

  await expect(playerPage.getByText("connected", { exact: false })).toBeVisible({ timeout: 5000 });
  await expect(hostPage.getByText("Alice")).toBeVisible({ timeout: 10000 });

  const startGameButton = hostPage.getByRole("button", { name: "Start Game" });
  await expect(startGameButton).toBeEnabled({ timeout: 10000 });
  await startGameButton.click();

  const hostBoard = hostPage.locator(".board");
  await expect(hostBoard).toBeVisible({ timeout: 5000 });

  const firstClueButton = hostBoard.locator(".board__cell:not(:disabled)").first();
  await expect(firstClueButton).toBeVisible({ timeout: 5000 });
  await firstClueButton.click();

  await expect(hostPage.getByText("Waiting for a player to buzz in.")).toBeVisible({
    timeout: 10000,
  });

  const buzzButton = playerPage.getByRole("button", { name: "Buzz in" });
  await expect(buzzButton).toBeVisible({ timeout: 10000 });
  await buzzButton.click();

  await expect(hostPage.getByText("Buzzed player")).toBeVisible({ timeout: 10000 });
  await expect(hostPage.getByText("Alice")).toBeVisible();
  await expect(hostPage.getByRole("button", { name: "Mark correct" })).toBeVisible({
    timeout: 5000,
  });

  await hostPage.getByRole("button", { name: "Mark correct" }).click();

  await expect(hostBoard).toBeVisible({ timeout: 10000 });

  const answeredClue = hostBoard.locator(".board__cell--answered").first();
  await expect(answeredClue).toBeVisible();
});
