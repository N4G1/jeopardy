import path from "node:path";

import { expect, test, type BrowserContext, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const AUDIO_FILE_PATH = path.resolve("public/sounds/buzzer.mp3");

async function openClueModal(page: Page): Promise<void> {
  const tile = page.locator(".board-editor-grid__clue-tile").first();
  await tile.click();
  await expect(page.locator(".board-clue-modal__panel")).toBeVisible({ timeout: 5000 });
}

async function uploadQuestionAudio(page: Page): Promise<void> {
  const fileInput = page.locator("input[type='file']").first();
  await fileInput.setInputFiles({
    name: "buzzer.mp3",
    mimeType: "audio/mpeg",
    buffer: (await import("node:fs")).readFileSync(AUDIO_FILE_PATH),
  });
  await expect(page.locator(".board-clue-modal__preview-wrap").first()).toBeVisible({
    timeout: 5000,
  });
}

test.describe("audio clue regression", () => {
  test("audio player is visible in clue view for both host and player", async ({ browser }) => {
    const hostContext = await browser.newContext();
    const hostPage = await hostContext.newPage();
    await hostPage.goto("/");
    await expect(hostPage.getByRole("heading", { name: "Host game" })).toBeVisible();

    // Shrink to 1x1 board for a quick test
    for (let i = 5; i > 1; i -= 1) {
      await hostPage
        .getByRole("button", { name: "Delete row" })
        .evaluate((btn: HTMLButtonElement) => btn.click());
    }
    for (let i = 5; i > 1; i -= 1) {
      await hostPage
        .getByRole("button", { name: "Delete column" })
        .evaluate((btn: HTMLButtonElement) => btn.click());
    }

    // Open the single clue modal and fill it with text + audio
    await openClueModal(hostPage);
    await hostPage.locator("textarea").first().fill("What sound does this make?");
    await hostPage.locator("textarea").last().fill("A buzzer sound");
    await uploadQuestionAudio(hostPage);

    // Verify audio preview inside the modal is visible
    const modalAudio = hostPage.locator(".board-clue-modal__preview-wrap audio");
    await expect(modalAudio).toBeVisible({ timeout: 5000 });

    await hostPage.getByRole("button", { name: "Save", exact: true }).click();
    await expect(hostPage.locator(".board-clue-modal__panel")).toBeHidden();

    // Verify audio badge shows in tile preview
    await expect(hostPage.locator(".board-editor-grid__clue-audio-badge").first()).toBeVisible({
      timeout: 3000,
    });

    // Create lobby and join a player
    await hostPage.getByRole("button", { name: "Create Lobby" }).click();
    const joinLink = hostPage.locator(".panel__copy-link");
    await expect(joinLink).toBeVisible({ timeout: 5000 });
    const joinUrl = (await joinLink.textContent()) ?? "";

    const playerContext = await browser.newContext();
    const playerPage = await playerContext.newPage();
    await playerPage.goto(joinUrl);
    await expect(playerPage.getByRole("heading", { name: "Join game" })).toBeVisible();
    await playerPage.getByLabel("Display name").fill("Alice");
    await playerPage.getByRole("button", { name: "Join Lobby" }).click();
    await playerPage.waitForURL(/\/player(\?|$)/, { timeout: 10000 });

    // Start the game
    const startButton = hostPage.getByRole("button", { name: "Start Game" });
    await expect(startButton).toBeEnabled({ timeout: 10000 });
    await startButton.click();
    await expect(hostPage.locator(".board")).toBeVisible({ timeout: 10000 });

    // Open the clue
    const clueButton = hostPage.locator(".board__cell:not(:disabled)").first();
    await expect(clueButton).toBeVisible({ timeout: 5000 });
    await clueButton.click();

    // Verify the host clue view has a visible audio element with nonzero height
    const hostAudio = hostPage.locator("audio.clue-shared__media").first();
    await expect(hostAudio).toBeVisible({ timeout: 5000 });
    const hostAudioBox = await hostAudio.boundingBox();
    expect(hostAudioBox).not.toBeNull();
    expect(hostAudioBox!.height).toBeGreaterThan(10);

    // Verify the player clue view has a visible audio element with nonzero height
    const playerAudio = playerPage.locator("audio.clue-shared__media").first();
    await expect(playerAudio).toBeVisible({ timeout: 5000 });
    const playerAudioBox = await playerAudio.boundingBox();
    expect(playerAudioBox).not.toBeNull();
    expect(playerAudioBox!.height).toBeGreaterThan(10);

    // Play the audio on both host and player and verify it actually started
    const hostPlayed = await hostAudio.evaluate((el: HTMLAudioElement) => {
      el.currentTime = 0;
      return el.play().then(
        () => true,
        () => false,
      );
    });
    const playerPlayed = await playerAudio.evaluate((el: HTMLAudioElement) => {
      el.currentTime = 0;
      return el.play().then(
        () => true,
        () => false,
      );
    });
    expect(hostPlayed).toBe(true);
    expect(playerPlayed).toBe(true);

    // Let the audio play for a moment so it's audible during the test run,
    // then confirm currentTime advanced (the file actually decoded and played).
    await hostPage.waitForTimeout(500);

    const hostCurrentTime = await hostAudio.evaluate((el: HTMLAudioElement) => el.currentTime);
    const playerCurrentTime = await playerAudio.evaluate((el: HTMLAudioElement) => el.currentTime);
    expect(hostCurrentTime).toBeGreaterThan(0);
    expect(playerCurrentTime).toBeGreaterThan(0);

    // Pause both so the test doesn't hang on lingering audio
    await hostAudio.evaluate((el: HTMLAudioElement) => el.pause());
    await playerAudio.evaluate((el: HTMLAudioElement) => el.pause());

    await hostContext.close();
    await playerContext.close();
  });
});
