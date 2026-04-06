import { describe, expect, test } from "vitest";

import {
  buzzVolumeStorageKey,
  clampBuzzVolume,
  defaultBuzzVolume,
  loadBuzzVolume,
  saveBuzzVolume,
} from "src/features/shared/buzzVolume";

function createStorage(): Storage {
  const data = new Map<string, string>();

  return {
    get length() {
      return data.size;
    },
    clear() {
      data.clear();
    },
    getItem(key: string) {
      return data.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(data.keys())[index] ?? null;
    },
    removeItem(key: string) {
      data.delete(key);
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
  };
}

describe("buzzVolume", () => {
  test("clamps values into the supported range", () => {
    expect(clampBuzzVolume(-1)).toBe(0);
    expect(clampBuzzVolume(0.5)).toBe(0.5);
    expect(clampBuzzVolume(2)).toBe(1);
  });

  test("loads the default value when storage is empty or invalid", () => {
    const storage = createStorage();
    expect(loadBuzzVolume(storage)).toBe(defaultBuzzVolume);

    storage.setItem(buzzVolumeStorageKey, "nope");
    expect(loadBuzzVolume(storage)).toBe(defaultBuzzVolume);
  });

  test("saves and reloads a normalized local volume", () => {
    const storage = createStorage();

    const saved = saveBuzzVolume(storage, 0.72);
    expect(saved).toBe(0.72);
    expect(storage.getItem(buzzVolumeStorageKey)).toBe("0.72");
    expect(loadBuzzVolume(storage)).toBe(0.72);
  });
});
