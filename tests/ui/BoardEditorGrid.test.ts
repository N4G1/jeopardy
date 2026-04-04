import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { describe, expect, test, vi } from "vitest";

import BoardEditorGrid from "src/features/setup/BoardEditorGrid.svelte";
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

function renderBoard(boardDefinition: BoardDefinition, onClueSelect = vi.fn()) {
  return render(BoardEditorGrid, {
    props: {
      boardDefinition,
      onTitleChange: () => {},
      onColumnTitleChange: () => {},
      onRowValueChange: () => {},
      onClueSelect,
      onAddRow: () => {},
      onDeleteRow: () => {},
      onAddColumn: () => {},
      onDeleteColumn: () => {},
    },
  });
}

function clueTile(row1Based: number, col1Based: number): HTMLElement {
  return screen.getByRole("button", {
    name: new RegExp(`clue row ${row1Based}, column ${col1Based}`, "i"),
  }) as HTMLElement;
}

async function touchTap(element: Element): Promise<void> {
  await fireEvent.pointerDown(element, { pointerType: "touch" });
  await fireEvent.click(element);
}

describe("BoardEditorGrid", () => {
  test("board title field renders the current title", () => {
    const boardDefinition = createBoardDefinition({ title: "Friday Finals" });

    render(BoardEditorGrid, {
      props: {
        boardDefinition,
        onTitleChange: () => {},
        onColumnTitleChange: () => {},
        onRowValueChange: () => {},
        onClueSelect: () => {},
        onAddRow: () => {},
        onDeleteRow: () => {},
        onAddColumn: () => {},
        onDeleteColumn: () => {},
      },
    });

    const titleField = screen.getByRole("textbox", { name: /board title/i }) as HTMLInputElement;
    expect(titleField.value).toBe("Friday Finals");
  });

  test("row value inputs exist and can emit updates", async () => {
    const rowValueCalls: Array<{ rowIndex: number; value: number }> = [];
    const boardDefinition = createBoardDefinition({ rowCount: 2, columnCount: 2 });

    render(BoardEditorGrid, {
      props: {
        boardDefinition,
        onTitleChange: () => {},
        onColumnTitleChange: () => {},
        onRowValueChange: (rowIndex: number, value: number) => {
          rowValueCalls.push({ rowIndex, value });
        },
        onClueSelect: () => {},
        onAddRow: () => {},
        onDeleteRow: () => {},
        onAddColumn: () => {},
        onDeleteColumn: () => {},
      },
    });

    const row1Value = screen.getByRole("spinbutton", { name: /row 1 point value/i });
    expect(row1Value).toBeTruthy();

    await fireEvent.input(row1Value, { target: { value: "250" } });

    expect(rowValueCalls.at(-1)).toEqual({ rowIndex: 0, value: 250 });
  });

  test("row value input does not emit for empty, zero, negative, or non-integer values", async () => {
    const rowValueCalls: Array<{ rowIndex: number; value: number }> = [];
    const boardDefinition = createBoardDefinition({ rowCount: 1, columnCount: 1 });

    render(BoardEditorGrid, {
      props: {
        boardDefinition,
        onTitleChange: () => {},
        onColumnTitleChange: () => {},
        onRowValueChange: (rowIndex: number, value: number) => {
          rowValueCalls.push({ rowIndex, value });
        },
        onClueSelect: () => {},
        onAddRow: () => {},
        onDeleteRow: () => {},
        onAddColumn: () => {},
        onDeleteColumn: () => {},
      },
    });

    const row1Value = screen.getByRole("spinbutton", { name: /row 1 point value/i });

    await fireEvent.input(row1Value, { target: { value: "" } });
    await fireEvent.input(row1Value, { target: { value: "0" } });
    await fireEvent.input(row1Value, { target: { value: "-5" } });
    await fireEvent.input(row1Value, { target: { value: "12.5" } });
    await fireEvent.input(row1Value, { target: { value: "abc" } });

    expect(rowValueCalls).toEqual([]);
  });

  test("category title fields render current column titles", () => {
    const boardDefinition = createBoardDefinition({ columnCount: 3 });
    boardDefinition.columnTitles = ["History", "Science", "Arts"];

    render(BoardEditorGrid, {
      props: {
        boardDefinition,
        onTitleChange: () => {},
        onColumnTitleChange: () => {},
        onRowValueChange: () => {},
        onClueSelect: () => {},
        onAddRow: () => {},
        onDeleteRow: () => {},
        onAddColumn: () => {},
        onDeleteColumn: () => {},
      },
    });

    expect(
      (screen.getByRole("textbox", { name: /category 1 title/i }) as HTMLInputElement).value,
    ).toBe("History");
    expect(
      (screen.getByRole("textbox", { name: /category 2 title/i }) as HTMLInputElement).value,
    ).toBe("Science");
    expect(
      (screen.getByRole("textbox", { name: /category 3 title/i }) as HTMLInputElement).value,
    ).toBe("Arts");
  });

  test("add row and add column controls are present and accessible", () => {
    render(BoardEditorGrid, {
      props: {
        boardDefinition: createBoardDefinition(),
        onTitleChange: () => {},
        onColumnTitleChange: () => {},
        onRowValueChange: () => {},
        onClueSelect: () => {},
        onAddRow: () => {},
        onDeleteRow: () => {},
        onAddColumn: () => {},
        onDeleteColumn: () => {},
      },
    });

    expect(screen.getByRole("button", { name: /^add row$/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^add column$/i })).toBeTruthy();
  });

  test("delete row and delete column controls are separately addressable", () => {
    render(BoardEditorGrid, {
      props: {
        boardDefinition: createBoardDefinition({ rowCount: 2, columnCount: 2 }),
        onTitleChange: () => {},
        onColumnTitleChange: () => {},
        onRowValueChange: () => {},
        onClueSelect: () => {},
        onAddRow: () => {},
        onDeleteRow: () => {},
        onAddColumn: () => {},
        onDeleteColumn: () => {},
      },
    });

    expect(screen.getByRole("button", { name: /^delete row$/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^delete column$/i })).toBeTruthy();
  });

  test("visual contract: shell class hooks for chrome, frame, labels, and full-bleed blue", () => {
    const { container } = render(BoardEditorGrid, {
      props: {
        boardDefinition: createBoardDefinition({ rowCount: 2, columnCount: 2 }),
        onTitleChange: () => {},
        onColumnTitleChange: () => {},
        onRowValueChange: () => {},
        onClueSelect: () => {},
        onAddRow: () => {},
        onDeleteRow: () => {},
        onAddColumn: () => {},
        onDeleteColumn: () => {},
      },
    });

    expect(container.querySelector(".board-editor-grid--sharp-chrome")).toBeTruthy();
    expect(container.querySelector(".board-editor-grid--full-bleed-blue")).toBeTruthy();
    expect(container.querySelector(".board-editor-grid__frame--jeopardy-blue")).toBeTruthy();
    expect(container.querySelector(".board-editor-grid__frame--sharp")).toBeTruthy();
    expect(container.querySelector(".board-editor-grid__clue-tile--sharp")).toBeTruthy();

    const addLabelHooks = container.querySelectorAll(".board-editor-grid__resize-label--add");
    const deleteLabelHooks = container.querySelectorAll(".board-editor-grid__resize-label--delete");
    expect(addLabelHooks.length).toBe(2);
    expect(deleteLabelHooks.length).toBe(2);
  });

  test("diagonal resize controls use two triangular button zones per row/column control", () => {
    const { container } = render(BoardEditorGrid, {
      props: {
        boardDefinition: createBoardDefinition(),
        onTitleChange: () => {},
        onColumnTitleChange: () => {},
        onRowValueChange: () => {},
        onClueSelect: () => {},
        onAddRow: () => {},
        onDeleteRow: () => {},
        onAddColumn: () => {},
        onDeleteColumn: () => {},
      },
    });

    expect(container.querySelectorAll(".board-editor-grid__resize-zone--add")).toHaveLength(2);
    expect(container.querySelectorAll(".board-editor-grid__resize-zone--delete")).toHaveLength(2);
  });

  test("diagonal add/delete labels are exposed for assistive tech", () => {
    render(BoardEditorGrid, {
      props: {
        boardDefinition: createBoardDefinition(),
        onTitleChange: () => {},
        onColumnTitleChange: () => {},
        onRowValueChange: () => {},
        onClueSelect: () => {},
        onAddRow: () => {},
        onDeleteRow: () => {},
        onAddColumn: () => {},
        onDeleteColumn: () => {},
      },
    });

    const addLabels = screen.getAllByText("ADD", { exact: true });
    const deleteLabels = screen.getAllByText("DELETE", { exact: true });
    expect(addLabels.length).toBeGreaterThanOrEqual(2);
    expect(deleteLabels.length).toBeGreaterThanOrEqual(2);
  });

  test("renders a clue tile per cell for arbitrary board dimensions", () => {
    const boardDefinition = createBoardDefinition({ rowCount: 3, columnCount: 4 });

    render(BoardEditorGrid, {
      props: {
        boardDefinition,
        onTitleChange: () => {},
        onColumnTitleChange: () => {},
        onRowValueChange: () => {},
        onClueSelect: () => {},
        onAddRow: () => {},
        onDeleteRow: () => {},
        onAddColumn: () => {},
        onDeleteColumn: () => {},
      },
    });

    const tiles = screen.getAllByRole("button", { name: /clue row \d+, column \d+/i });
    expect(tiles).toHaveLength(12);
  });

  test("at minimum board size delete row and delete column are disabled and do not fire callbacks", async () => {
    const deleteRowCalls: number[] = [];
    const deleteColumnCalls: number[] = [];

    render(BoardEditorGrid, {
      props: {
        boardDefinition: createBoardDefinition({ rowCount: 1, columnCount: 1 }),
        onTitleChange: () => {},
        onColumnTitleChange: () => {},
        onRowValueChange: () => {},
        onClueSelect: () => {},
        onAddRow: () => {},
        onDeleteRow: () => {
          deleteRowCalls.push(1);
        },
        onAddColumn: () => {},
        onDeleteColumn: () => {
          deleteColumnCalls.push(1);
        },
      },
    });

    const deleteRowButton = screen.getByRole("button", { name: /^delete row$/i });
    const deleteColumnButton = screen.getByRole("button", { name: /^delete column$/i });

    expect(deleteRowButton.hasAttribute("disabled")).toBe(true);
    expect(deleteColumnButton.hasAttribute("disabled")).toBe(true);

    await fireEvent.click(deleteRowButton);
    await fireEvent.click(deleteColumnButton);

    expect(deleteRowCalls).toEqual([]);
    expect(deleteColumnCalls).toEqual([]);
  });

  describe("clue preview and interaction", () => {
    test("empty clue shows row point value", () => {
      const boardDefinition = createBoardDefinition({ rowCount: 2, columnCount: 2 });
      renderBoard(boardDefinition);

      const tile = clueTile(1, 1);
      expect(tile.textContent).toContain("$100");
    });

    test("filled clue shows question text by default", () => {
      const boardDefinition = patchClue(
        createBoardDefinition({ rowCount: 1, columnCount: 1 }),
        0,
        0,
        {
          prompt: "What is the capital of France?",
          response: "Paris",
        },
      );
      renderBoard(boardDefinition);

      const tile = clueTile(1, 1);
      expect(tile.textContent).toContain("What is the capital of France?");
      expect(tile.textContent).not.toContain("$100");
    });

    test("pointer hover reveals answer text on a filled clue", async () => {
      const boardDefinition = patchClue(
        createBoardDefinition({ rowCount: 1, columnCount: 1 }),
        0,
        0,
        {
          prompt: "The question",
          response: "The answer",
        },
      );
      renderBoard(boardDefinition);

      const tile = clueTile(1, 1);
      expect(tile.textContent).toContain("The question");
      expect(tile.textContent).not.toContain("The answer");

      await fireEvent.mouseEnter(tile);
      expect(tile.textContent).toContain("The answer");

      await fireEvent.mouseLeave(tile);
      expect(tile.textContent).toContain("The question");
      expect(tile.textContent).not.toContain("The answer");
    });

    test("image-only filled clue uses preview mode (image, not dollar value)", () => {
      const boardDefinition = patchClue(
        createBoardDefinition({ rowCount: 1, columnCount: 1 }),
        0,
        0,
        {
          prompt: "",
          response: "",
          questionMedia: {
            kind: "image",
            fileName: "cat.png",
            url: "https://example.com/cat.png",
            altText: "A cat",
          },
          answerMedia: {
            kind: "image",
            fileName: "cat.png",
            url: "https://example.com/cat.png",
            altText: "A cat",
          },
        },
      );
      const { container } = renderBoard(boardDefinition);

      const tile = clueTile(1, 1);
      const img = tile.querySelector("img");
      expect(img).toBeTruthy();
      expect(img?.getAttribute("src")).toBe("https://example.com/cat.png");
      expect(img?.getAttribute("alt")).toBe("A cat");
      expect(tile.textContent).not.toMatch(/\$100/);
      expect(container.querySelector(".board-editor-grid__clue-preview-img")).toBeTruthy();
    });

    test("image-only filled clue shows question image then answer image when revealed", async () => {
      const boardDefinition = patchClue(
        createBoardDefinition({ rowCount: 1, columnCount: 1 }),
        0,
        0,
        {
          prompt: "",
          response: "",
          questionMedia: {
            kind: "image",
            fileName: "q.png",
            url: "https://example.com/q.png",
            altText: "Q side",
          },
          answerMedia: {
            kind: "image",
            fileName: "a.png",
            url: "https://example.com/a.png",
            altText: "A side",
          },
        },
      );
      renderBoard(boardDefinition);

      const tile = clueTile(1, 1);
      expect(tile.querySelectorAll("img")).toHaveLength(1);
      expect(tile.querySelector("img")?.getAttribute("src")).toBe("https://example.com/q.png");

      await fireEvent.mouseEnter(tile);
      await tick();

      const imgs = tile.querySelectorAll("img");
      expect(imgs).toHaveLength(1);
      expect(imgs[0]?.getAttribute("src")).toBe("https://example.com/a.png");
      expect(imgs[0]?.getAttribute("alt")).toBe("A side");
    });

    test("audio question media shows a visible label and video answer media renders as preview", async () => {
      const boardDefinition = patchClue(
        createBoardDefinition({ rowCount: 1, columnCount: 1 }),
        0,
        0,
        {
          prompt: "",
          response: "",
          questionMedia: {
            kind: "audio",
            fileName: "q.mp3",
            url: "https://example.com/q.mp3",
          },
          answerMedia: {
            kind: "video",
            fileName: "a.mp4",
            url: "https://example.com/a.mp4",
          },
        },
      );
      renderBoard(boardDefinition);

      const tile = clueTile(1, 1);
      expect(tile.querySelector(".board-editor-grid__clue-audio-badge")).toBeTruthy();

      await fireEvent.mouseEnter(tile);
      await tick();

      expect(tile.querySelector("video")).toBeTruthy();
    });

    test("image-only filled clue shows image in answer preview when alt text is missing (visual, not text fallback)", async () => {
      const boardDefinition = patchClue(
        createBoardDefinition({ rowCount: 1, columnCount: 1 }),
        0,
        0,
        {
          prompt: "",
          response: "",
          questionMedia: {
            kind: "image",
            fileName: "q.png",
            url: "https://example.com/q.png",
          },
          answerMedia: {
            kind: "image",
            fileName: "a.png",
            url: "https://example.com/photo.png",
          },
        },
      );
      renderBoard(boardDefinition);

      const tile = clueTile(1, 1);
      await fireEvent.mouseEnter(tile);
      await tick();

      const imgs = tile.querySelectorAll("img");
      expect(imgs).toHaveLength(1);
      expect(imgs[0]?.getAttribute("src")).toBe("https://example.com/photo.png");
      expect(imgs[0]?.getAttribute("alt")).toBe("");
      expect(tile.textContent?.trim() ?? "").not.toMatch(/image answer/i);
    });

    test("clue tile aria-label truncates long question and answer preview text", async () => {
      const longQ = `Q${"a".repeat(200)}`;
      const longA = `A${"b".repeat(200)}`;
      const boardDefinition = patchClue(
        createBoardDefinition({ rowCount: 1, columnCount: 1 }),
        0,
        0,
        {
          prompt: longQ,
          response: longA,
        },
      );
      renderBoard(boardDefinition);

      const tile = clueTile(1, 1);
      const labelBefore = tile.getAttribute("aria-label") ?? "";
      expect(labelBefore.length).toBeLessThanOrEqual(200);
      expect(labelBefore).toContain("Question preview:");
      expect(labelBefore).toContain("…");
      expect(labelBefore).not.toContain(longQ);

      await fireEvent.mouseEnter(tile);
      await tick();
      const labelAfter = tile.getAttribute("aria-label") ?? "";
      expect(labelAfter.length).toBeLessThanOrEqual(200);
      expect(labelAfter).toContain("Answer preview:");
      expect(labelAfter).toContain("…");
      expect(labelAfter).not.toContain(longA);
    });

    test("clue tile aria-label caps length when preview comes from very long image alt text", () => {
      const longAlt = `Z${"z".repeat(300)}`;
      const boardDefinition = patchClue(
        createBoardDefinition({ rowCount: 1, columnCount: 1 }),
        0,
        0,
        {
          prompt: "",
          response: "",
          questionMedia: {
            kind: "image",
            fileName: "x.png",
            url: "https://example.com/x.png",
            altText: longAlt,
          },
          answerMedia: {
            kind: "image",
            fileName: "y.png",
            url: "https://example.com/y.png",
            altText: "y",
          },
        },
      );
      renderBoard(boardDefinition);

      const tile = clueTile(1, 1);
      const label = tile.getAttribute("aria-label") ?? "";
      expect(label.length).toBeLessThanOrEqual(200);
      expect(label).toContain("Question preview:");
      expect(label).toContain("…");
      expect(label).not.toContain(longAlt);
    });

    test("empty clue opens modal on first click", async () => {
      const onClueSelect = vi.fn();
      const boardDefinition = createBoardDefinition({ rowCount: 1, columnCount: 1 });
      renderBoard(boardDefinition, onClueSelect);

      const tile = clueTile(1, 1);
      await fireEvent.click(tile);

      expect(onClueSelect).toHaveBeenCalledTimes(1);
      expect(onClueSelect).toHaveBeenCalledWith("clue-0-0");
    });

    test("partially filled clue still shows row value and opens modal on first click", async () => {
      const onClueSelect = vi.fn();
      const boardDefinition = patchClue(
        createBoardDefinition({ rowCount: 1, columnCount: 1 }),
        0,
        0,
        {
          prompt: "Only a question",
          response: "",
        },
      );
      renderBoard(boardDefinition, onClueSelect);

      const tile = clueTile(1, 1);
      expect(tile.textContent).toContain("$100");
      expect(tile.textContent).not.toContain("Only a question");

      await touchTap(tile);
      expect(onClueSelect).toHaveBeenCalledTimes(1);
      expect(onClueSelect).toHaveBeenCalledWith("clue-0-0");
    });

    test("filled clue: touch first tap reveals answer; second tap opens modal", async () => {
      const onClueSelect = vi.fn();
      const boardDefinition = patchClue(
        createBoardDefinition({ rowCount: 1, columnCount: 1 }),
        0,
        0,
        {
          prompt: "Touch question",
          response: "Touch answer",
        },
      );
      renderBoard(boardDefinition, onClueSelect);

      const tile = clueTile(1, 1);
      await touchTap(tile);
      expect(onClueSelect).not.toHaveBeenCalled();
      expect(tile.textContent).toContain("Touch answer");

      await touchTap(tile);
      expect(onClueSelect).toHaveBeenCalledTimes(1);
      expect(onClueSelect).toHaveBeenCalledWith("clue-0-0");
    });

    test("keyboard focus on filled clue reveals answer preview", async () => {
      const boardDefinition = patchClue(
        createBoardDefinition({ rowCount: 1, columnCount: 1 }),
        0,
        0,
        {
          prompt: "Focus question",
          response: "Focus answer",
        },
      );
      renderBoard(boardDefinition);

      const tile = clueTile(1, 1);
      expect(tile.textContent).toContain("Focus question");
      expect(tile.textContent).not.toContain("Focus answer");

      tile.focus();
      expect(document.activeElement).toBe(tile);
      await tick();
      expect(tile.textContent).toContain("Focus answer");
    });

    test("keyboard focus on empty clue keeps row value visible", () => {
      const boardDefinition = createBoardDefinition({ rowCount: 1, columnCount: 1 });
      renderBoard(boardDefinition);

      const tile = clueTile(1, 1);
      tile.focus();
      expect(tile.textContent).toContain("$100");
    });

    test("Enter opens the clue modal", async () => {
      const onClueSelect = vi.fn();
      const boardDefinition = patchClue(
        createBoardDefinition({ rowCount: 1, columnCount: 1 }),
        0,
        0,
        {
          prompt: "Q",
          response: "A",
        },
      );
      renderBoard(boardDefinition, onClueSelect);

      const tile = clueTile(1, 1);
      tile.focus();
      await fireEvent.keyDown(tile, { key: "Enter" });

      expect(onClueSelect).toHaveBeenCalledTimes(1);
      expect(onClueSelect).toHaveBeenCalledWith("clue-0-0");
    });

    test("Space opens the clue modal", async () => {
      const onClueSelect = vi.fn();
      renderBoard(createBoardDefinition({ rowCount: 1, columnCount: 1 }), onClueSelect);

      const tile = clueTile(1, 1);
      tile.focus();
      await fireEvent.keyDown(tile, { key: " " });

      expect(onClueSelect).toHaveBeenCalledTimes(1);
      expect(onClueSelect).toHaveBeenCalledWith("clue-0-0");
    });

    test("mouse click on filled clue opens modal immediately (single click)", async () => {
      const onClueSelect = vi.fn();
      const boardDefinition = patchClue(
        createBoardDefinition({ rowCount: 1, columnCount: 1 }),
        0,
        0,
        {
          prompt: "Mouse Q",
          response: "Mouse A",
        },
      );
      renderBoard(boardDefinition, onClueSelect);

      const tile = clueTile(1, 1);
      await fireEvent.pointerDown(tile, { pointerType: "mouse" });
      await fireEvent.click(tile);

      expect(onClueSelect).toHaveBeenCalledTimes(1);
      expect(onClueSelect).toHaveBeenCalledWith("clue-0-0");
    });
  });
});
