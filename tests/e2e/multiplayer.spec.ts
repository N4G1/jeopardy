import { expect, test, type BrowserContext, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

async function configureBoard(
  hostPage: Page,
  { rowCount, columnCount }: { rowCount: number; columnCount: number },
): Promise<void> {
  for (let index = 5; index > rowCount; index -= 1) {
    await hostPage
      .getByRole("button", { name: "Delete row" })
      .evaluate((button: HTMLButtonElement) => button.click());
  }

  for (let index = 5; index > columnCount; index -= 1) {
    await hostPage
      .getByRole("button", { name: "Delete column" })
      .evaluate((button: HTMLButtonElement) => button.click());
  }

  await expect(hostPage.locator(".board-editor-grid__row-value-input")).toHaveCount(rowCount);
  await expect(hostPage.locator(".board-editor-grid__category-input")).toHaveCount(columnCount);

  await hostPage.getByRole("button", { name: "Fill sample board" }).click();
}

async function createLobby(
  hostPage: Page,
  { rowCount = 1, columnCount = 2 }: { rowCount?: number; columnCount?: number } = {},
): Promise<string> {
  await hostPage.goto("/");
  await expect(hostPage.getByRole("heading", { name: "Host game" })).toBeVisible();

  await configureBoard(hostPage, { rowCount, columnCount });
  await hostPage.getByRole("button", { name: "Create Lobby" }).click();

  const joinLink = hostPage.locator(".panel__copy-link");
  await expect(joinLink).toBeVisible({ timeout: 5000 });
  const joinUrl = await joinLink.textContent();
  expect(joinUrl).toBeTruthy();
  return joinUrl ?? "";
}

async function joinPlayer(
  context: BrowserContext,
  joinUrl: string,
  displayName: string,
): Promise<Page> {
  const playerPage = await context.newPage();
  await playerPage.goto(joinUrl);
  await expect(playerPage.getByRole("heading", { name: "Join game" })).toBeVisible();
  await playerPage.getByLabel("Display name").fill(displayName);
  await playerPage.getByRole("button", { name: "Join Lobby" }).click();
  await playerPage.waitForURL(/\/player(\?|$)/, { timeout: 10000 });
  return playerPage;
}

async function attemptJoinExpectError(
  context: BrowserContext,
  joinUrl: string,
  displayName: string,
  expectedMessage: string,
): Promise<Page> {
  const playerPage = await context.newPage();
  await playerPage.goto(joinUrl);
  await expect(playerPage.getByRole("heading", { name: "Join game" })).toBeVisible();
  await playerPage.getByLabel("Display name").fill(displayName);
  await playerPage.getByRole("button", { name: "Join Lobby" }).click();
  await expect(playerPage.getByRole("status")).toContainText(expectedMessage, { timeout: 10000 });
  return playerPage;
}

async function startGame(hostPage: Page): Promise<void> {
  const startGameButton = hostPage.getByRole("button", { name: "Start Game" });
  await expect(startGameButton).toBeEnabled({ timeout: 10000 });
  await startGameButton.click();
  await expect(hostPage.locator(".board")).toBeVisible({ timeout: 10000 });
}

async function openClue(hostPage: Page, index = 0): Promise<void> {
  const hostBoard = hostPage.locator(".board");
  await expect(hostBoard).toBeVisible({ timeout: 10000 });
  const clueButton = hostBoard.locator(".board__cell:not(:disabled)").nth(index);
  await expect(clueButton).toBeVisible({ timeout: 10000 });
  await clueButton.click();
}

async function waitForHostBuzzWinner(hostPage: Page): Promise<string> {
  const buzzedPlayer = hostPage.locator(".panel__buzzed-player");
  await expect(buzzedPlayer).toBeVisible({ timeout: 10000 });
  const text = (await buzzedPlayer.textContent()) ?? "";

  if (text.includes("Alice")) {
    return "Alice";
  }

  if (text.includes("Bob")) {
    return "Bob";
  }

  throw new Error(`Unexpected buzz winner text: ${text}`);
}

function formatScore(score: number): string {
  return score < 0 ? `-$${Math.abs(score)}` : `$${score}`;
}

async function expectBoardScore(page: Page, displayName: string, score: number): Promise<void> {
  await expect(page.locator(".scoreboard--strip")).toContainText(
    `${displayName}: ${formatScore(score)}`,
    { timeout: 10000 },
  );
}

async function installBuzzAudioSpy(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => {
    class MockAudio {
      currentTime = 0;
      preload = "";

      constructor(public src?: string) {}

      play(): Promise<void> {
        (
          window as Window & {
            __buzzPlayCount?: number;
          }
        ).__buzzPlayCount =
          ((window as Window & { __buzzPlayCount?: number }).__buzzPlayCount ?? 0) + 1;
        return Promise.resolve();
      }
    }

    (window as Window & { __buzzPlayCount?: number }).__buzzPlayCount = 0;
    window.Audio = MockAudio as typeof Audio;
  });
}

async function expectBuzzPlayCount(page: Page, expectedCount: number): Promise<void> {
  await expect
    .poll(async () =>
      page.evaluate(() => (window as Window & { __buzzPlayCount?: number }).__buzzPlayCount ?? 0),
    )
    .toBe(expectedCount);
}

test("multiple players race to buzz and only one wins the lock", async ({ browser, context }) => {
  test.setTimeout(60_000);
  const hostPage = await context.newPage();
  const joinUrl = await createLobby(hostPage);
  const aliceContext = await browser.newContext();
  const bobContext = await browser.newContext();
  const alicePage = await joinPlayer(aliceContext, joinUrl, "Alice");
  const bobPage = await joinPlayer(bobContext, joinUrl, "Bob");

  try {
    await expect(hostPage.getByText("Alice")).toBeVisible({ timeout: 10000 });
    await expect(hostPage.getByText("Bob")).toBeVisible({ timeout: 10000 });
    await startGame(hostPage);
    await openClue(hostPage);

    const aliceBuzzButton = alicePage.getByRole("button", { name: "Buzz in" });
    const bobBuzzButton = bobPage.getByRole("button", { name: "Buzz in" });
    await expect(aliceBuzzButton).toBeVisible({ timeout: 10000 });
    await expect(bobBuzzButton).toBeVisible({ timeout: 10000 });

    await Promise.all([
      aliceBuzzButton.evaluate((button: HTMLButtonElement) => button.click()),
      bobBuzzButton.evaluate((button: HTMLButtonElement) => button.click()),
    ]);

    const winner = await waitForHostBuzzWinner(hostPage);
    const winnerPage = winner === "Alice" ? alicePage : bobPage;
    const loserPage = winner === "Alice" ? bobPage : alicePage;

    await expect(winnerPage.getByRole("button", { name: "You buzzed first" })).toBeDisabled({
      timeout: 10000,
    });
    await expect(loserPage.getByRole("button", { name: "Buzz locked" })).toBeDisabled({
      timeout: 10000,
    });
  } finally {
    await alicePage.close();
    await bobPage.close();
  }
});

test("accepted buzz sound plays for everyone and plays again after rebound", async ({
  browser,
  context,
}) => {
  test.setTimeout(60_000);
  await installBuzzAudioSpy(context);
  const hostPage = await context.newPage();
  const joinUrl = await createLobby(hostPage);
  const aliceContext = await browser.newContext();
  const bobContext = await browser.newContext();
  await installBuzzAudioSpy(aliceContext);
  await installBuzzAudioSpy(bobContext);
  const alicePage = await joinPlayer(aliceContext, joinUrl, "Alice");
  const bobPage = await joinPlayer(bobContext, joinUrl, "Bob");

  try {
    await startGame(hostPage);
    await openClue(hostPage);

    await alicePage.getByRole("button", { name: "Buzz in" }).click();
    await waitForHostBuzzWinner(hostPage);

    await expectBuzzPlayCount(hostPage, 1);
    await expectBuzzPlayCount(alicePage, 1);
    await expectBuzzPlayCount(bobPage, 1);

    await hostPage.getByRole("button", { name: "Rebound" }).click();
    await bobPage.getByRole("button", { name: "Buzz in" }).click();
    await expect(hostPage.locator(".panel__buzzed-player")).toContainText("Bob", {
      timeout: 10000,
    });

    await expectBuzzPlayCount(hostPage, 2);
    await expectBuzzPlayCount(alicePage, 2);
    await expectBuzzPlayCount(bobPage, 2);
  } finally {
    await alicePage.close();
    await bobPage.close();
  }
});

test("wrong answer rebounds, blocks rebuzz for the same player, and updates scores", async ({
  browser,
  context,
}) => {
  test.setTimeout(60_000);
  const hostPage = await context.newPage();
  const joinUrl = await createLobby(hostPage);
  const aliceContext = await browser.newContext();
  const bobContext = await browser.newContext();
  const alicePage = await joinPlayer(aliceContext, joinUrl, "Alice");
  const bobPage = await joinPlayer(bobContext, joinUrl, "Bob");

  try {
    await startGame(hostPage);
    await openClue(hostPage);

    await alicePage.getByRole("button", { name: "Buzz in" }).click();
    await waitForHostBuzzWinner(hostPage);
    await hostPage.getByRole("button", { name: "Rebound" }).click();

    await expect(alicePage.getByRole("button", { name: "Already answered" })).toBeDisabled({
      timeout: 10000,
    });
    await expect(alicePage.getByText("You already answered this clue.")).toBeVisible({
      timeout: 10000,
    });
    await expect(bobPage.getByRole("button", { name: "Buzz in" })).toBeEnabled({
      timeout: 10000,
    });

    await bobPage.getByRole("button", { name: "Buzz in" }).click();
    const winner = await waitForHostBuzzWinner(hostPage);
    expect(winner).toBe("Bob");
    await hostPage.getByRole("button", { name: "Mark correct" }).click();

    await expectBoardScore(hostPage, "Alice", -100);
    await expectBoardScore(hostPage, "Bob", 100);
  } finally {
    await alicePage.close();
    await bobPage.close();
  }
});

test("mark incorrect closes the clue and deducts points", async ({ context }) => {
  const hostPage = await context.newPage();
  const joinUrl = await createLobby(hostPage, { rowCount: 1, columnCount: 2 });
  const alicePage = await joinPlayer(context, joinUrl, "Alice");

  await startGame(hostPage);
  await openClue(hostPage);

  await alicePage.getByRole("button", { name: "Buzz in" }).click();
  await waitForHostBuzzWinner(hostPage);
  await hostPage.getByRole("button", { name: "Mark incorrect" }).click();

  await expectBoardScore(hostPage, "Alice", -100);
  await expect(hostPage.locator(".board__cell--answered")).toHaveCount(1);
});

test("host can reveal the answer and players only see it after reveal", async ({ context }) => {
  const hostPage = await context.newPage();
  const joinUrl = await createLobby(hostPage, { rowCount: 1, columnCount: 1 });
  const alicePage = await joinPlayer(context, joinUrl, "Alice");

  await startGame(hostPage);
  await openClue(hostPage);

  await expect(hostPage.locator("body")).toContainText("Sample answer 1-1");
  await expect(alicePage.locator("body")).not.toContainText("Sample answer 1-1");

  await hostPage.getByRole("button", { name: "Show answer" }).click();

  await expect(alicePage.locator("body")).toContainText("Sample answer 1-1", { timeout: 10000 });
  await expect(alicePage.getByRole("button", { name: "Buzz locked" })).toBeDisabled({
    timeout: 10000,
  });
});

test("no contest closes a clue without changing scores before any buzz", async ({ context }) => {
  const hostPage = await context.newPage();
  const joinUrl = await createLobby(hostPage);
  await joinPlayer(context, joinUrl, "Alice");

  await startGame(hostPage);
  await openClue(hostPage);

  await expect(hostPage.getByRole("button", { name: "No contest" })).toBeVisible({
    timeout: 10000,
  });
  await hostPage.getByRole("button", { name: "No contest" }).click();

  await expectBoardScore(hostPage, "Alice", 0);
  await expect(hostPage.locator(".board__cell--answered")).toHaveCount(1);
});

test("no contest closes a clue without changing scores after a player buzzes", async ({
  context,
}) => {
  const hostPage = await context.newPage();
  const joinUrl = await createLobby(hostPage);
  const alicePage = await joinPlayer(context, joinUrl, "Alice");

  await startGame(hostPage);
  await openClue(hostPage);

  await alicePage.getByRole("button", { name: "Buzz in" }).click();
  await waitForHostBuzzWinner(hostPage);
  await hostPage.getByRole("button", { name: "No contest" }).click();

  await expectBoardScore(hostPage, "Alice", 0);
  await expect(hostPage.locator(".board__cell--answered")).toHaveCount(1);
});

test("playing all clues reaches the end screen", async ({ context }) => {
  const hostPage = await context.newPage();
  const joinUrl = await createLobby(hostPage, { rowCount: 1, columnCount: 2 });
  const alicePage = await joinPlayer(context, joinUrl, "Alice");

  await startGame(hostPage);

  await openClue(hostPage, 0);
  await alicePage.getByRole("button", { name: "Buzz in" }).click();
  await waitForHostBuzzWinner(hostPage);
  await hostPage.getByRole("button", { name: "Mark correct" }).click();
  await expectBoardScore(hostPage, "Alice", 100);

  await openClue(hostPage, 0);
  await alicePage.getByRole("button", { name: "Buzz in" }).click();
  await waitForHostBuzzWinner(hostPage);
  await hostPage.getByRole("button", { name: "Mark correct" }).click();

  await expect(hostPage.getByRole("heading", { name: "Overall score" })).toBeVisible({
    timeout: 10000,
  });
  await expect(alicePage.getByRole("heading", { name: "Overall score" })).toBeVisible({
    timeout: 10000,
  });
  await expect(hostPage.getByText("$200")).toBeVisible();
});

test("the same device cannot join twice under a different name", async ({ context }) => {
  const hostPage = await context.newPage();
  const joinUrl = await createLobby(hostPage, { rowCount: 1, columnCount: 2 });
  await joinPlayer(context, joinUrl, "Alice");

  await attemptJoinExpectError(
    context,
    joinUrl,
    "Bob",
    "This device is already linked to another player.",
  );

  await expect(hostPage.getByText("Alice")).toBeVisible({ timeout: 10000 });
  await expect(hostPage.getByText("Bob")).toHaveCount(0);
});

test("a new player cannot join after the game has started", async ({ browser, context }) => {
  const hostPage = await context.newPage();
  const joinUrl = await createLobby(hostPage, { rowCount: 1, columnCount: 2 });
  await joinPlayer(context, joinUrl, "Alice");

  await startGame(hostPage);

  const lateJoinContext = await browser.newContext();
  try {
    await attemptJoinExpectError(
      lateJoinContext,
      joinUrl,
      "Bob",
      "New players cannot join after the game has started.",
    );
  } finally {
    await lateJoinContext.close();
  }

  await expect(hostPage.locator(".scoreboard--strip li")).toHaveCount(1);
  await expectBoardScore(hostPage, "Alice", 0);
});

test("copycat name join is rejected while the original player is connected", async ({
  browser,
  context,
}) => {
  const hostPage = await context.newPage();
  const joinUrl = await createLobby(hostPage, { rowCount: 1, columnCount: 2 });
  await joinPlayer(context, joinUrl, "Alice");

  await startGame(hostPage);

  const copycatContext = await browser.newContext();
  try {
    await attemptJoinExpectError(
      copycatContext,
      joinUrl,
      "Alice",
      "Player name is already in use.",
    );
  } finally {
    await copycatContext.close();
  }

  await expect(hostPage.locator(".scoreboard--strip li")).toHaveCount(1);
  await expectBoardScore(hostPage, "Alice", 0);
});

test("disconnecting and rejoining with the same name restores the same player", async ({
  context,
}) => {
  const hostPage = await context.newPage();
  const joinUrl = await createLobby(hostPage, { rowCount: 1, columnCount: 2 });
  const alicePage = await joinPlayer(context, joinUrl, "Alice");

  await startGame(hostPage);
  await openClue(hostPage, 0);
  await alicePage.getByRole("button", { name: "Buzz in" }).click();
  await waitForHostBuzzWinner(hostPage);
  await hostPage.getByRole("button", { name: "Mark correct" }).click();
  await expectBoardScore(hostPage, "Alice", 100);

  await alicePage.close();

  const rejoinedAlicePage = await joinPlayer(context, joinUrl, "Alice");
  await expect(hostPage.locator(".scoreboard--strip li")).toHaveCount(1);
  await expectBoardScore(hostPage, "Alice", 100);

  await openClue(hostPage, 0);
  await rejoinedAlicePage.getByRole("button", { name: "Buzz in" }).click();
  const winner = await waitForHostBuzzWinner(hostPage);
  expect(winner).toBe("Alice");
  await hostPage.getByRole("button", { name: "Mark correct" }).click();

  await expect(hostPage.getByRole("heading", { name: "Overall score" })).toBeVisible({
    timeout: 10000,
  });
  await expect(hostPage.locator(".end-screen__item")).toHaveCount(1);
  await expect(hostPage.locator("body")).toContainText("Alice");
  await expect(hostPage.locator("body")).toContainText("$200", { timeout: 10000 });
});
