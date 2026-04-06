const buzzVolumeStorageKey = "jeopardy-buzz-volume";
const defaultBuzzVolume = 0.5;

function clampBuzzVolume(value: number): number {
  if (!Number.isFinite(value)) {
    return defaultBuzzVolume;
  }

  return Math.min(1, Math.max(0, value));
}

function loadBuzzVolume(storage: Pick<Storage, "getItem">): number {
  const rawValue = storage.getItem(buzzVolumeStorageKey);

  if (rawValue === null) {
    return defaultBuzzVolume;
  }

  return clampBuzzVolume(Number(rawValue));
}

function saveBuzzVolume(storage: Pick<Storage, "setItem">, value: number): number {
  const normalizedValue = clampBuzzVolume(value);
  storage.setItem(buzzVolumeStorageKey, String(normalizedValue));
  return normalizedValue;
}

export { buzzVolumeStorageKey, clampBuzzVolume, defaultBuzzVolume, loadBuzzVolume, saveBuzzVolume };
