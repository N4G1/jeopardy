import { describe, expect, test, vi } from "vitest";

import { createBuzzSoundPlayer, resolveBuzzSoundUrl } from "src/features/shared/buzzSound";

describe("createBuzzSoundPlayer", () => {
  test("resolves the default buzzer path under a configured base url", () => {
    expect(resolveBuzzSoundUrl("/")).toBe("/sounds/buzzer.mp3");
    expect(resolveBuzzSoundUrl("/jeopardy/")).toBe("/jeopardy/sounds/buzzer.mp3");
  });

  test("reuses the same audio instance and restarts playback on each buzz", async () => {
    const play = vi.fn(async () => undefined);
    const audio = {
      currentTime: 7,
      play,
    };
    const createAudio = vi.fn(() => audio);
    const player = createBuzzSoundPlayer({
      audioUrl: "/sounds/custom.mp3",
      createAudio,
    });

    await player.play();
    expect(createAudio).toHaveBeenCalledTimes(1);
    expect(createAudio).toHaveBeenCalledWith("/sounds/custom.mp3");
    expect(audio.currentTime).toBe(0);
    expect(play).toHaveBeenCalledTimes(1);

    audio.currentTime = 3;
    await player.play();
    expect(createAudio).toHaveBeenCalledTimes(1);
    expect(audio.currentTime).toBe(0);
    expect(play).toHaveBeenCalledTimes(2);
  });
});
