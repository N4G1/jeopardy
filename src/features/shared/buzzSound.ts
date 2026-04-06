type BuzzAudio = {
  currentTime: number;
  volume: number;
  play: () => Promise<void>;
};

type CreateBuzzAudio = (src: string) => BuzzAudio;

type BuzzSoundPlayer = {
  play: () => Promise<void>;
};

function resolveBuzzSoundUrl(baseUrl = import.meta.env.BASE_URL): string {
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return `${normalizedBaseUrl}sounds/buzzer.mp3`;
}

const defaultBuzzSoundUrl = resolveBuzzSoundUrl();

function createBuzzSoundPlayer({
  audioUrl = defaultBuzzSoundUrl,
  volume = 0.5,
  getVolume,
  createAudio = (src) => {
    const audio = new Audio(src);
    audio.preload = "auto";
    return audio;
  },
}: {
  audioUrl?: string;
  volume?: number;
  getVolume?: () => number;
  createAudio?: CreateBuzzAudio;
} = {}): BuzzSoundPlayer {
  let audio: BuzzAudio | undefined;

  return {
    async play(): Promise<void> {
      const resolvedAudio = (audio ??= createAudio(audioUrl));
      resolvedAudio.volume = getVolume?.() ?? volume;
      resolvedAudio.currentTime = 0;

      try {
        await resolvedAudio.play();
      } catch {
        // Ignore browser playback blocks so realtime updates keep flowing.
      }
    },
  };
}

export { createBuzzSoundPlayer, defaultBuzzSoundUrl, resolveBuzzSoundUrl };
export type { BuzzAudio, BuzzSoundPlayer, CreateBuzzAudio };
