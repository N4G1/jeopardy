import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { describe, expect, test } from "vitest";

import BoardEditor from "src/features/setup/BoardEditor.svelte";
import {
  createBoardDefinition,
  type BoardClueDefinition,
  type BoardDefinition,
} from "src/features/setup/boardSchema";

function patchClue(
  board: BoardDefinition,
  rowIndex: number,
  columnIndex: number,
  patch: Partial<BoardClueDefinition>,
): BoardDefinition {
  return {
    ...board,
    clues: board.clues.map((c) =>
      c.rowIndex === rowIndex && c.columnIndex === columnIndex ? { ...c, ...patch } : c,
    ),
  };
}

function rowClues(board: BoardDefinition, rowIndex: number): BoardClueDefinition[] {
  return board.clues.filter((c) => c.rowIndex === rowIndex);
}

describe("BoardEditor", () => {
  test("renders the current title and lets the host update it", async () => {
    const updates: BoardDefinition[] = [];

    render(BoardEditor, {
      props: {
        boardDefinition: createBoardDefinition(),
        showDevAutofill: false,
        onBoardChange: (next: BoardDefinition) => {
          updates.push(next);
        },
      },
    });

    const titleInput = screen.getByRole("textbox", { name: /board title/i });

    await fireEvent.input(titleInput, {
      target: { value: "Friday Finals" },
    });

    expect(updates.at(-1)?.title).toBe("Friday Finals");
  });

  test("category typing updates state", async () => {
    const updates: BoardDefinition[] = [];

    render(BoardEditor, {
      props: {
        boardDefinition: createBoardDefinition(),
        showDevAutofill: false,
        onBoardChange: (next: BoardDefinition) => {
          updates.push(next);
        },
      },
    });

    const firstCategory = screen.getByRole("textbox", { name: /category 1 title/i });

    await fireEvent.input(firstCategory, {
      target: { value: "Literature" },
    });

    expect(updates.at(-1)?.columnTitles[0]).toBe("Literature");
  });

  test("adds a row and preserves existing clues by position", async () => {
    const updates: BoardDefinition[] = [];
    const boardDefinition = createBoardDefinition({
      rowCount: 2,
      columnCount: 2,
    });

    const patched = patchClue(boardDefinition, 0, 0, { prompt: "Saved question" });
    patched.columnTitles[0] = "Saved category";

    render(BoardEditor, {
      props: {
        boardDefinition: patched,
        showDevAutofill: false,
        onBoardChange: (next: BoardDefinition) => {
          updates.push(next);
        },
      },
    });

    await fireEvent.click(screen.getByRole("button", { name: /^add row$/i }));

    const latest = updates.at(-1);

    expect(latest?.rowCount).toBe(3);
    expect(latest?.clues).toHaveLength(6);
    expect(latest?.clues.find((c) => c.rowIndex === 0 && c.columnIndex === 0)?.prompt).toBe(
      "Saved question",
    );
    expect(latest?.columnTitles[0]).toBe("Saved category");
  });

  test("row value editing updates the full row", async () => {
    const updates: BoardDefinition[] = [];

    render(BoardEditor, {
      props: {
        boardDefinition: createBoardDefinition({ rowCount: 2, columnCount: 2 }),
        showDevAutofill: false,
        onBoardChange: (next: BoardDefinition) => {
          updates.push(next);
        },
      },
    });

    const row1Value = screen.getByRole("spinbutton", { name: /row 1 point value/i });
    await fireEvent.input(row1Value, { target: { value: "250" } });

    const latest = updates.at(-1);
    expect(latest).toBeDefined();
    const row0 = rowClues(latest!, 0);
    expect(row0).toHaveLength(2);
    expect(row0.every((c) => c.value === 250)).toBe(true);
  });

  test("Enter on board title keeps the current inline value", async () => {
    const updates: BoardDefinition[] = [];

    render(BoardEditor, {
      props: {
        boardDefinition: createBoardDefinition({ title: "Start" }),
        showDevAutofill: false,
        onBoardChange: (next: BoardDefinition) => {
          updates.push(next);
        },
      },
    });

    const titleInput = screen.getByRole("textbox", { name: /board title/i }) as HTMLInputElement;
    titleInput.focus();
    await fireEvent.input(titleInput, { target: { value: "Committed title" } });
    await fireEvent.keyDown(titleInput, { key: "Enter" });

    expect(updates.at(-1)?.title).toBe("Committed title");
  });

  test("Escape on board title restores the value captured on focus", async () => {
    const updates: BoardDefinition[] = [];

    render(BoardEditor, {
      props: {
        boardDefinition: createBoardDefinition({ title: "Original" }),
        showDevAutofill: false,
        onBoardChange: (next: BoardDefinition) => {
          updates.push(next);
        },
      },
    });

    const titleInput = screen.getByRole("textbox", { name: /board title/i }) as HTMLInputElement;
    titleInput.focus();
    await fireEvent.input(titleInput, { target: { value: "Draft only" } });
    expect(updates.at(-1)?.title).toBe("Draft only");

    await fireEvent.keyDown(titleInput, { key: "Escape" });

    expect(updates.at(-1)?.title).toBe("Original");
  });

  test("blur on board title keeps the current inline value", async () => {
    const updates: BoardDefinition[] = [];

    render(BoardEditor, {
      props: {
        boardDefinition: createBoardDefinition({ title: "A" }),
        showDevAutofill: false,
        onBoardChange: (next: BoardDefinition) => {
          updates.push(next);
        },
      },
    });

    const titleInput = screen.getByRole("textbox", { name: /board title/i }) as HTMLInputElement;
    titleInput.focus();
    await fireEvent.input(titleInput, { target: { value: "After blur" } });
    await fireEvent.blur(titleInput);

    expect(updates.at(-1)?.title).toBe("After blur");
  });

  test("Enter, Escape, and blur on category title match board title behavior", async () => {
    const updates: BoardDefinition[] = [];
    const board = createBoardDefinition({ columnCount: 2 });
    board.columnTitles = ["Cat A", "Cat B"];

    render(BoardEditor, {
      props: {
        boardDefinition: board,
        showDevAutofill: false,
        onBoardChange: (next: BoardDefinition) => {
          updates.push(next);
        },
      },
    });

    const cat0 = screen.getByRole("textbox", { name: /category 1 title/i }) as HTMLInputElement;
    cat0.focus();
    await fireEvent.input(cat0, { target: { value: "Typed" } });
    await fireEvent.keyDown(cat0, { key: "Enter" });
    expect(updates.at(-1)?.columnTitles[0]).toBe("Typed");

    cat0.focus();
    await fireEvent.input(cat0, { target: { value: "Revert me" } });
    await fireEvent.keyDown(cat0, { key: "Escape" });
    expect(updates.at(-1)?.columnTitles[0]).toBe("Typed");

    cat0.focus();
    await fireEvent.input(cat0, { target: { value: "Kept on blur" } });
    await fireEvent.blur(cat0);
    expect(updates.at(-1)?.columnTitles[0]).toBe("Kept on blur");
  });

  test("adding a row creates synchronized row values across the new row", async () => {
    const updates: BoardDefinition[] = [];

    render(BoardEditor, {
      props: {
        boardDefinition: createBoardDefinition({ rowCount: 2, columnCount: 2 }),
        showDevAutofill: false,
        onBoardChange: (next: BoardDefinition) => {
          updates.push(next);
        },
      },
    });

    const row1 = screen.getByRole("spinbutton", { name: /row 1 point value/i });
    await fireEvent.input(row1, { target: { value: "150" } });

    await fireEvent.click(screen.getByRole("button", { name: /^add row$/i }));

    const latest = updates.at(-1)!;
    const newRow = rowClues(latest, 2);
    expect(newRow).toHaveLength(2);
    const v = newRow[0]!.value;
    expect(newRow.every((c) => c.value === v)).toBe(true);
    expect(v).toBe(250);
  });

  test("adding a column preserves row synchronization", async () => {
    const updates: BoardDefinition[] = [];

    render(BoardEditor, {
      props: {
        boardDefinition: createBoardDefinition({ rowCount: 2, columnCount: 2 }),
        showDevAutofill: false,
        onBoardChange: (next: BoardDefinition) => {
          updates.push(next);
        },
      },
    });

    await fireEvent.input(screen.getByRole("spinbutton", { name: /row 1 point value/i }), {
      target: { value: "175" },
    });
    await fireEvent.input(screen.getByRole("spinbutton", { name: /row 2 point value/i }), {
      target: { value: "350" },
    });

    await fireEvent.click(screen.getByRole("button", { name: /^add column$/i }));

    const latest = updates.at(-1)!;
    expect(latest.columnCount).toBe(3);
    const col2r0 = latest.clues.find((c) => c.rowIndex === 0 && c.columnIndex === 2);
    const col2r1 = latest.clues.find((c) => c.rowIndex === 1 && c.columnIndex === 2);
    expect(col2r0?.value).toBe(175);
    expect(col2r1?.value).toBe(350);
  });

  test("deleting a row keeps remaining row values consistent", async () => {
    const updates: BoardDefinition[] = [];

    render(BoardEditor, {
      props: {
        boardDefinition: createBoardDefinition({ rowCount: 3, columnCount: 2 }),
        showDevAutofill: false,
        onBoardChange: (next: BoardDefinition) => {
          updates.push(next);
        },
      },
    });

    await fireEvent.input(screen.getByRole("spinbutton", { name: /row 1 point value/i }), {
      target: { value: "111" },
    });
    await fireEvent.input(screen.getByRole("spinbutton", { name: /row 2 point value/i }), {
      target: { value: "222" },
    });
    await fireEvent.input(screen.getByRole("spinbutton", { name: /row 3 point value/i }), {
      target: { value: "333" },
    });

    await fireEvent.click(screen.getByRole("button", { name: /^delete row$/i }));

    const latest = updates.at(-1)!;
    expect(latest.rowCount).toBe(2);
    expect(rowClues(latest, 0).every((c) => c.value === 111)).toBe(true);
    expect(rowClues(latest, 1).every((c) => c.value === 222)).toBe(true);
  });

  test("deleting a column keeps remaining row values consistent", async () => {
    const updates: BoardDefinition[] = [];

    render(BoardEditor, {
      props: {
        boardDefinition: createBoardDefinition({ rowCount: 2, columnCount: 3 }),
        showDevAutofill: false,
        onBoardChange: (next: BoardDefinition) => {
          updates.push(next);
        },
      },
    });

    await fireEvent.input(screen.getByRole("spinbutton", { name: /row 1 point value/i }), {
      target: { value: "400" },
    });
    await fireEvent.input(screen.getByRole("spinbutton", { name: /row 2 point value/i }), {
      target: { value: "800" },
    });

    await fireEvent.click(screen.getByRole("button", { name: /^delete column$/i }));

    const latest = updates.at(-1)!;
    expect(latest.columnCount).toBe(2);
    expect(rowClues(latest, 0).every((c) => c.value === 400)).toBe(true);
    expect(rowClues(latest, 1).every((c) => c.value === 800)).toBe(true);
  });

  test("shows a dev-only autofill action that fills categories, questions, and answers", async () => {
    const updates: BoardDefinition[] = [];

    render(BoardEditor, {
      props: {
        boardDefinition: createBoardDefinition(),
        showDevAutofill: true,
        onBoardChange: (next: BoardDefinition) => {
          updates.push(next);
        },
      },
    });

    await fireEvent.click(screen.getByRole("button", { name: "Fill sample board" }));

    const latest = updates.at(-1);

    expect(latest?.columnTitles[0]).toBe("Category 1");
    expect(latest?.clues[0]?.prompt).toBe("Sample question 1-1");
    expect(latest?.clues[0]?.response).toBe("Sample answer 1-1");
  });

  test("hides the autofill action outside dev mode", () => {
    render(BoardEditor, {
      props: {
        boardDefinition: createBoardDefinition(),
        showDevAutofill: false,
      },
    });

    expect(screen.queryByRole("button", { name: "Fill sample board" })).toBeNull();
  });

  test("modal save and reopen round-trips question and answer images", async () => {
    const updates: BoardDefinition[] = [];

    render(BoardEditor, {
      props: {
        boardDefinition: createBoardDefinition({ rowCount: 1, columnCount: 1 }),
        showDevAutofill: false,
        onBoardChange: (next: BoardDefinition) => {
          updates.push(next);
        },
      },
    });

    await fireEvent.click(screen.getByRole("button", { name: /clue row 1, column 1/i }));

    const fileQ = new File(["q"], "q.png", { type: "image/png" });
    const fileA = new File(["a"], "a.png", { type: "image/png" });

    await fireEvent.change(screen.getByLabelText(/question image/i), {
      target: { files: [fileQ] },
    });
    await waitFor(() => {
      expect(screen.getByRole("img", { name: "q.png" })).toBeTruthy();
    });

    await fireEvent.change(screen.getByLabelText(/answer image/i), {
      target: { files: [fileA] },
    });
    await waitFor(() => {
      expect(screen.getByRole("img", { name: "a.png" })).toBeTruthy();
    });

    await fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      const clue = updates.at(-1)?.clues[0];
      expect(clue?.questionMedia?.fileName).toBe("q.png");
      expect(clue?.answerMedia?.fileName).toBe("a.png");
      expect(clue?.questionMedia?.url.startsWith("data:image/png")).toBe(true);
      expect(clue?.answerMedia?.url.startsWith("data:image/png")).toBe(true);
    });

    await fireEvent.click(screen.getByRole("button", { name: /clue row 1, column 1/i }));

    await waitFor(() => {
      expect(screen.getByRole("img", { name: "q.png" })).toBeTruthy();
      expect(screen.getByRole("img", { name: "a.png" })).toBeTruthy();
    });
  });
});
