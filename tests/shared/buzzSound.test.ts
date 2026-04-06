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
      volume: 1,
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
    expect(audio.volume).toBe(0.5);
    expect(audio.currentTime).toBe(0);
    expect(play).toHaveBeenCalledTimes(1);

    audio.currentTime = 3;
    await player.play();
    expect(createAudio).toHaveBeenCalledTimes(1);
    expect(audio.currentTime).toBe(0);
    expect(play).toHaveBeenCalledTimes(2);
  });

  test("reads the latest volume before each buzz", async () => {
    const play = vi.fn(async () => undefined);
    const audio = {
      currentTime: 0,
      volume: 1,
      play,
    };
    const createAudio = vi.fn(() => audio);
    let currentVolume = 0.2;
    const player = createBuzzSoundPlayer({
      audioUrl: "/sounds/custom.mp3",
      createAudio,
      getVolume: () => currentVolume,
    });

    await player.play();
    expect(audio.volume).toBe(0.2);

    currentVolume = 0.8;
    await player.play();
    expect(audio.volume).toBe(0.8);
    expect(play).toHaveBeenCalledTimes(2);
  });
});
