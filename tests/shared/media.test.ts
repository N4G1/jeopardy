import { describe, expect, test } from "vitest";

import {
  isSupportedClueMediaFile,
  isSupportedImageFile,
  readFileAsClueMedia,
} from "src/features/shared/media";

describe("isSupportedImageFile", () => {
  test("accepts common web image types", () => {
    expect(isSupportedImageFile(new File(["png"], "photo.png", { type: "image/png" }))).toBe(true);
    expect(isSupportedImageFile(new File(["jpg"], "photo.jpg", { type: "image/jpeg" }))).toBe(true);
    expect(isSupportedImageFile(new File(["webp"], "photo.webp", { type: "image/webp" }))).toBe(
      true,
    );
  });

  test("rejects unsupported file types", () => {
    expect(isSupportedImageFile(new File(["txt"], "notes.txt", { type: "text/plain" }))).toBe(
      false,
    );
  });
});

describe("isSupportedClueMediaFile", () => {
  test("accepts supported image, audio, and video files", () => {
    expect(isSupportedClueMediaFile(new File(["png"], "photo.png", { type: "image/png" }))).toBe(
      true,
    );
    expect(isSupportedClueMediaFile(new File(["mp3"], "sound.mp3", { type: "audio/mpeg" }))).toBe(
      true,
    );
    expect(isSupportedClueMediaFile(new File(["mp4"], "clip.mp4", { type: "video/mp4" }))).toBe(
      true,
    );
  });

  test("rejects unsupported file types", () => {
    expect(isSupportedClueMediaFile(new File(["txt"], "notes.txt", { type: "text/plain" }))).toBe(
      false,
    );
  });

  test("rejects supported-looking files when mime type is missing", () => {
    expect(isSupportedClueMediaFile(new File(["mp4"], "clip.mp4", { type: "" }))).toBe(false);
    expect(isSupportedClueMediaFile(new File(["mov"], "clip.mov", { type: "" }))).toBe(false);
    expect(isSupportedClueMediaFile(new File(["mp3"], "sound.mp3", { type: "" }))).toBe(false);
    expect(isSupportedClueMediaFile(new File(["png"], "photo.png", { type: "" }))).toBe(false);
  });
});

describe("readFileAsClueMedia", () => {
  test("returns audio clue media for supported audio files", async () => {
    const media = await readFileAsClueMedia(new File(["mp3"], "sound.mp3", { type: "audio/mpeg" }));

    expect(media).toMatchObject({
      kind: "audio",
      fileName: "sound.mp3",
    });
    expect(media.url.startsWith("data:audio/mpeg")).toBe(true);
  });

  test("returns video clue media for supported video files", async () => {
    const media = await readFileAsClueMedia(new File(["mp4"], "clip.mp4", { type: "video/mp4" }));

    expect(media).toMatchObject({
      kind: "video",
      fileName: "clip.mp4",
    });
    expect(media.url.startsWith("data:video/mp4")).toBe(true);
  });

  test("rejects mp4 when mime is missing", async () => {
    await expect(readFileAsClueMedia(new File(["mp4"], "clip.mp4", { type: "" }))).rejects.toThrow(
      "Failed to read media file.",
    );
  });

  test("rejects mov when mime is missing", async () => {
    await expect(readFileAsClueMedia(new File(["mov"], "clip.mov", { type: "" }))).rejects.toThrow(
      "Failed to read media file.",
    );
  });
});
