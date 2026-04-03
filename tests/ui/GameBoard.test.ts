import { render, screen } from "@testing-library/svelte";
import { describe, expect, test } from "vitest";

import GameBoard from "src/features/shared/GameBoard.svelte";

describe("GameBoard", () => {
  test("shows only the provided column titles without helper labels", () => {
    render(GameBoard, {
      props: {
        rowCount: 2,
        columnCount: 2,
        columnTitles: ["History", "Science"],
        clues: [
          { id: "c1", rowIndex: 0, columnIndex: 0, value: 100, isAnswered: false },
          { id: "c2", rowIndex: 0, columnIndex: 1, value: 100, isAnswered: false },
          { id: "c3", rowIndex: 1, columnIndex: 0, value: 200, isAnswered: false },
          { id: "c4", rowIndex: 1, columnIndex: 1, value: 200, isAnswered: false },
        ],
      },
    });

    expect(screen.getByText("History")).toBeTruthy();
    expect(screen.getByText("Science")).toBeTruthy();
    expect(screen.queryByText("Column 1")).toBeNull();
    expect(screen.queryByText("Column 2")).toBeNull();
    expect(screen.queryByText("R1 C1")).toBeNull();
    expect(screen.queryByText("R1 C2")).toBeNull();
  });

  test("renders answered clue cells as blank disabled tiles", () => {
    const { container } = render(GameBoard, {
      props: {
        rowCount: 1,
        columnCount: 2,
        columnTitles: ["History", "Science"],
        clues: [
          { id: "c1", rowIndex: 0, columnIndex: 0, value: 100, isAnswered: false },
          { id: "c2", rowIndex: 0, columnIndex: 1, value: 200, isAnswered: true },
        ],
      },
    });

    const clueButtons = container.querySelectorAll("button");

    expect(clueButtons).toHaveLength(2);
    expect(clueButtons[0]?.textContent).toContain("$100");
    expect(clueButtons[1]?.textContent?.trim()).toBe("");
    expect(clueButtons[1]?.hasAttribute("disabled")).toBe(true);
    expect(clueButtons[0] ? getComputedStyle(clueButtons[0]).backgroundColor : "").toBe(
      clueButtons[1] ? getComputedStyle(clueButtons[1]).backgroundColor : "",
    );
  });
});
