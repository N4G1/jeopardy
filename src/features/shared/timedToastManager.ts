type ToastTone = "info" | "success" | "error";

type TimedToastManagerOptions = {
  setMessage: (message: string) => void;
  setTone: (tone: ToastTone) => void;
  durationMs?: number;
};

type TimedToastManager = {
  show: (message: string, tone?: ToastTone) => void;
  clear: () => void;
  destroy: () => void;
};

export function createTimedToastManager({
  setMessage,
  setTone,
  durationMs = 5000,
}: TimedToastManagerOptions): TimedToastManager {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  function clearTimer(): void {
    clearTimeout(timeoutHandle);
  }

  function clear(): void {
    clearTimer();
    setMessage("");
  }

  function show(message: string, tone: ToastTone = "info"): void {
    setTone(tone);
    setMessage(message);
    clearTimer();
    timeoutHandle = setTimeout(() => {
      setMessage("");
    }, durationMs);
  }

  function destroy(): void {
    clearTimer();
  }

  return {
    show,
    clear,
    destroy,
  };
}

export type { ToastTone };
