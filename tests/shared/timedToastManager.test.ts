import { describe, expect, test, vi } from "vitest";

import { createTimedToastManager } from "src/features/shared/timedToastManager";

describe("timedToastManager", () => {
  test("shows toast and auto-clears after default 5 seconds", () => {
    vi.useFakeTimers();

    let message = "";
    let tone: "info" | "success" | "error" = "info";
    const manager = createTimedToastManager({
      setMessage: (next) => {
        message = next;
      },
      setTone: (next) => {
        tone = next;
      },
    });

    manager.show("Draft restored.", "success");

    expect(message).toBe("Draft restored.");
    expect(tone).toBe("success");

    vi.advanceTimersByTime(4999);
    expect(message).toBe("Draft restored.");

    vi.advanceTimersByTime(1);
    expect(message).toBe("");

    manager.destroy();
    vi.useRealTimers();
  });

  test("restarts timer when showing a new message", () => {
    vi.useFakeTimers();

    let message = "";
    const manager = createTimedToastManager({
      setMessage: (next) => {
        message = next;
      },
      setTone: () => {},
    });

    manager.show("First");
    vi.advanceTimersByTime(3000);
    manager.show("Second");

    vi.advanceTimersByTime(3000);
    expect(message).toBe("Second");

    vi.advanceTimersByTime(2000);
    expect(message).toBe("");

    manager.destroy();
    vi.useRealTimers();
  });

  test("clear removes active message immediately", () => {
    vi.useFakeTimers();

    let message = "";
    const manager = createTimedToastManager({
      setMessage: (next) => {
        message = next;
      },
      setTone: () => {},
    });

    manager.show("Could not save board.", "error");
    expect(message).toBe("Could not save board.");

    manager.clear();
    expect(message).toBe("");

    vi.advanceTimersByTime(5000);
    expect(message).toBe("");

    manager.destroy();
    vi.useRealTimers();
  });
});
