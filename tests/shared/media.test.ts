import { describe, expect, test } from "vitest";

import { isSupportedImageFile } from "src/features/shared/media";

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
