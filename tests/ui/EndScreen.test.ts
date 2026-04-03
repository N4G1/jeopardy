import { render, screen } from "@testing-library/svelte";
import { describe, expect, test } from "vitest";

import EndScreen from "src/features/shared/EndScreen.svelte";

describe("EndScreen", () => {
  test("shows the overall score heading without the board title or final standings text", () => {
    render(EndScreen, {
      props: {
        title: "New Jeopardy Game",
        players: [{ id: "p1", displayName: "Alice", score: 500, connectionStatus: "connected" }],
      },
    });

    expect(screen.getByText("Overall score")).toBeTruthy();
    expect(screen.queryByText("New Jeopardy Game")).toBeNull();
    expect(screen.queryByText("Final standings")).toBeNull();
  });

  test("shows players sorted from highest to lowest score", () => {
    const { container } = render(EndScreen, {
      props: {
        title: "Quiz Night",
        players: [
          { id: "p1", displayName: "Bob", score: 200, connectionStatus: "connected" },
          { id: "p2", displayName: "Alice", score: 500, connectionStatus: "connected" },
          { id: "p3", displayName: "Cara", score: -100, connectionStatus: "connected" },
        ],
      },
    });

    const listItems = Array.from(container.querySelectorAll("li")).map((item) =>
      item.textContent?.trim(),
    );

    expect(listItems[0]).toContain("Alice");
    expect(listItems[1]).toContain("Bob");
    expect(listItems[2]).toContain("Cara");
  });

  test("shows special badges for the top three players", () => {
    render(EndScreen, {
      props: {
        title: "Quiz Night",
        players: [
          { id: "p1", displayName: "Alice", score: 500, connectionStatus: "connected" },
          { id: "p2", displayName: "Bob", score: 200, connectionStatus: "connected" },
          { id: "p3", displayName: "Cara", score: 100, connectionStatus: "connected" },
          { id: "p4", displayName: "Dana", score: 0, connectionStatus: "connected" },
        ],
      },
    });

    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.queryByText("4")).toBeNull();
  });
});
