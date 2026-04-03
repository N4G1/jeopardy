import { render, screen } from "@testing-library/svelte";
import { describe, expect, test } from "vitest";

import Scoreboard from "src/features/shared/Scoreboard.svelte";

describe("Scoreboard", () => {
  test("renders a strip variant without the heading", () => {
    render(Scoreboard, {
      props: {
        players: [
          {
            id: "player-1",
            displayName: "Alice",
            score: 300,
            connectionStatus: "connected",
          },
          {
            id: "player-2",
            displayName: "Bob",
            score: -100,
            connectionStatus: "connected",
          },
        ],
        variant: "strip",
      },
    });

    expect(screen.queryByText("Scores")).toBeNull();
    expect(screen.getByText("Alice: $300")).toBeTruthy();
    expect(screen.getByText("Bob: -$100")).toBeTruthy();
  });

  test("renders the strip variant with medium font weight", () => {
    const { container } = render(Scoreboard, {
      props: {
        players: [
          {
            id: "player-1",
            displayName: "Alice",
            score: 300,
            connectionStatus: "connected",
          },
        ],
        variant: "strip",
      },
    });

    const scoreItem = container.querySelector(".scoreboard--strip li");

    expect(scoreItem).toBeTruthy();
    expect(scoreItem?.getAttribute("style") ?? "").toContain("font-weight: 600");
  });

  test("renders different strip background colors for different players", () => {
    const { container } = render(Scoreboard, {
      props: {
        players: [
          {
            id: "player-1",
            displayName: "Alice",
            score: 300,
            connectionStatus: "connected",
          },
          {
            id: "player-2",
            displayName: "Bob",
            score: 0,
            connectionStatus: "connected",
          },
          {
            id: "player-3",
            displayName: "Cara",
            score: -100,
            connectionStatus: "connected",
          },
        ],
        variant: "strip",
      },
    });

    const scoreItems = Array.from(container.querySelectorAll(".scoreboard--strip li"));

    expect(scoreItems).toHaveLength(3);
    expect(scoreItems[0]?.getAttribute("style") ?? "").toContain("background-color:");
    expect(scoreItems[1]?.getAttribute("style") ?? "").toContain("background-color:");
    expect(scoreItems[0]?.getAttribute("style")).not.toBe(scoreItems[1]?.getAttribute("style"));
    expect(scoreItems[1]?.getAttribute("style")).not.toBe(scoreItems[2]?.getAttribute("style"));
  });
});
