import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, test, vi } from "vitest";

import ActiveClueScreen from "src/features/player/ActiveClueScreen.svelte";

describe("ActiveClueScreen", () => {
  test("shows the clue prompt without a separate score line", () => {
    render(ActiveClueScreen, {
      props: {
        clue: {
          id: "clue-1",
          columnTitle: "Literature",
          prompt: "Who wrote Hamlet?",
          value: 300,
          attemptedPlayerIds: [],
        },
        canBuzz: true,
        onBuzz: vi.fn(),
      },
    });

    expect(screen.getByText("Literature - $300")).toBeTruthy();
    expect(screen.getByText("Who wrote Hamlet?")).toBeTruthy();
    expect(screen.queryByText("Your score: 500")).toBeNull();
  });

  test("buzzes from the button and the spacebar when buzzing is enabled", async () => {
    const onBuzz = vi.fn();

    render(ActiveClueScreen, {
      props: {
        clue: {
          id: "clue-1",
          columnTitle: "Literature",
          prompt: "Who wrote Hamlet?",
          value: 300,
          attemptedPlayerIds: [],
        },
        canBuzz: true,
        onBuzz,
      },
    });

    await fireEvent.click(screen.getByRole("button", { name: "Buzz in" }));
    await fireEvent.keyDown(window, { key: " " });

    expect(onBuzz).toHaveBeenCalledTimes(2);
  });

  test("does not buzz when the screen is locked", async () => {
    const onBuzz = vi.fn();

    render(ActiveClueScreen, {
      props: {
        clue: {
          id: "clue-1",
          columnTitle: "Literature",
          prompt: "Who wrote Hamlet?",
          value: 300,
          attemptedPlayerIds: [],
        },
        canBuzz: false,
        onBuzz,
        statusMessage: "Alice buzzed first.",
      },
    });

    await fireEvent.click(screen.getByRole("button", { name: "Buzz in" }));
    await fireEvent.keyDown(window, { key: " " });

    expect(onBuzz).not.toHaveBeenCalled();
    expect(screen.getByText("Alice buzzed first.")).toBeTruthy();
  });

  test("shows a success-state buzzer label for the player who buzzed first", () => {
    render(ActiveClueScreen, {
      props: {
        clue: {
          id: "clue-1",
          columnTitle: "Literature",
          prompt: "Who wrote Hamlet?",
          value: 300,
          attemptedPlayerIds: [],
        },
        canBuzz: false,
        onBuzz: vi.fn(),
        buttonLabel: "You buzzed first",
        isSuccessState: true,
      },
    });

    expect(screen.getByRole("button", { name: "You buzzed first" })).toBeTruthy();
  });
});
