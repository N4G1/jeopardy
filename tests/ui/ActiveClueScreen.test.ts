import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, test, vi } from "vitest";

import ActiveClueScreen from "src/features/player/ActiveClueScreen.svelte";

describe("ActiveClueScreen", () => {
  test("shows the clue prompt and current player score", () => {
    render(ActiveClueScreen, {
      props: {
        clue: {
          id: "clue-1",
          prompt: "Who wrote Hamlet?",
          value: 300,
        },
        score: 500,
        canBuzz: true,
        onBuzz: vi.fn(),
      },
    });

    expect(screen.getByText("Who wrote Hamlet?")).toBeTruthy();
    expect(screen.getByText("Your score: 500")).toBeTruthy();
  });

  test("buzzes from the button and the spacebar when buzzing is enabled", async () => {
    const onBuzz = vi.fn();

    render(ActiveClueScreen, {
      props: {
        clue: {
          id: "clue-1",
          prompt: "Who wrote Hamlet?",
          value: 300,
        },
        score: 500,
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
          prompt: "Who wrote Hamlet?",
          value: 300,
        },
        score: 500,
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
});
