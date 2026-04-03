import { describe, expect, test } from "vitest";

import { createBoardDefinition } from "src/features/setup/boardSchema";
import {
  addBoardDefinitionColumn,
  addBoardDefinitionRow,
  getBoardDefinitionRowValue,
  isCluePreviewFilled,
  normalizeBoardDefinitionRows,
  removeBoardDefinitionColumn,
  removeBoardDefinitionRow,
  setBoardDefinitionRowValue,
} from "src/features/setup/boardEditorState";
import type { BoardClueDefinition, BoardDefinition } from "src/features/setup/boardSchema";

function clue(
  overrides: Partial<BoardClueDefinition> & Pick<BoardClueDefinition, "id">,
): BoardClueDefinition {
  return {
    rowIndex: 0,
    columnIndex: 0,
    value: 100,
    prompt: "",
    response: "",
    ...overrides,
  };
}

function boardFromClues(
  rowCount: number,
  columnCount: number,
  clues: BoardClueDefinition[],
  overrides: Partial<BoardDefinition> = {},
): BoardDefinition {
  return {
    title: "Test",
    rowCount,
    columnCount,
    columnTitles: Array.from({ length: columnCount }, (_, i) => `Col ${i + 1}`),
    clues,
    ...overrides,
  };
}

describe("normalizeBoardDefinitionRows", () => {
  test("uses leftmost clue when it holds a positive integer", () => {
    const b = boardFromClues(1, 3, [
      clue({ id: "a", columnIndex: 0, value: 250 }),
      clue({ id: "b", columnIndex: 1, value: 999 }),
      clue({ id: "c", columnIndex: 2, value: 1 }),
    ]);
    const out = normalizeBoardDefinitionRows(b);
    expect(out.clues.map((c) => c.value)).toEqual([250, 250, 250]);
  });

  test("falls back to next valid clue when leftmost is invalid", () => {
    const b = boardFromClues(1, 4, [
      clue({ id: "a", columnIndex: 0, value: 0 }),
      clue({ id: "b", columnIndex: 1, value: -5 }),
      clue({ id: "c", columnIndex: 2, value: 400 }),
      clue({ id: "d", columnIndex: 3, value: 50 }),
    ]);
    const out = normalizeBoardDefinitionRows(b);
    expect(out.clues.map((c) => c.value)).toEqual([400, 400, 400, 400]);
  });

  test("falls back to default ladder when the whole row lacks a valid value", () => {
    const b = boardFromClues(2, 2, [
      clue({ id: "a", rowIndex: 0, columnIndex: 0, value: 0 }),
      clue({ id: "b", rowIndex: 0, columnIndex: 1, value: 1.5 }),
      clue({ id: "c", rowIndex: 1, columnIndex: 0, value: NaN }),
      clue({ id: "d", rowIndex: 1, columnIndex: 1, value: -1 }),
    ]);
    const out = normalizeBoardDefinitionRows(b);
    const row0 = out.clues.filter((c) => c.rowIndex === 0).map((c) => c.value);
    const row1 = out.clues.filter((c) => c.rowIndex === 1).map((c) => c.value);
    expect(row0).toEqual([100, 100]);
    expect(row1).toEqual([200, 200]);
  });
});

describe("getBoardDefinitionRowValue", () => {
  test("reads the next valid clue when the leftmost value is invalid", () => {
    const b = boardFromClues(1, 3, [
      clue({ id: "a", columnIndex: 0, value: 0 }),
      clue({ id: "b", columnIndex: 1, value: 2.5 }),
      clue({ id: "c", columnIndex: 2, value: 600 }),
    ]);
    expect(getBoardDefinitionRowValue(b, 0)).toBe(600);
  });

  test("falls back to the default ladder when no clue in the row has a valid value", () => {
    const b = boardFromClues(3, 1, [
      clue({ id: "a", rowIndex: 0, columnIndex: 0, value: NaN }),
      clue({ id: "b", rowIndex: 1, columnIndex: 0, value: -1 }),
      clue({ id: "c", rowIndex: 2, columnIndex: 0, value: 0 }),
    ]);
    expect(getBoardDefinitionRowValue(b, 0)).toBe(100);
    expect(getBoardDefinitionRowValue(b, 1)).toBe(200);
    expect(getBoardDefinitionRowValue(b, 2)).toBe(300);
  });
});

describe("setBoardDefinitionRowValue", () => {
  test("writes the same value into every clue in the row", () => {
    const b = boardFromClues(2, 2, [
      clue({ id: "a", rowIndex: 0, columnIndex: 0, value: 100 }),
      clue({ id: "b", rowIndex: 0, columnIndex: 1, value: 200 }),
      clue({ id: "c", rowIndex: 1, columnIndex: 0, value: 300 }),
      clue({ id: "d", rowIndex: 1, columnIndex: 1, value: 400 }),
    ]);
    const out = setBoardDefinitionRowValue(b, 0, 777);
    expect(out.clues.filter((c) => c.rowIndex === 0).every((c) => c.value === 777)).toBe(true);
    expect(
      out.clues
        .filter((c) => c.rowIndex === 1)
        .map((c) => c.value)
        .toSorted((x, y) => x - y),
    ).toEqual([300, 400]);
  });
});

describe("addBoardDefinitionRow / removeBoardDefinitionRow", () => {
  test("does not shrink below 1 row", () => {
    const b = createBoardDefinition({ rowCount: 1, columnCount: 2 });
    expect(removeBoardDefinitionRow(b, 0)).toBe(b);
  });

  test("returns the same board when the row index is out of bounds", () => {
    const b = boardFromClues(2, 1, [
      clue({ id: "a", rowIndex: 0, columnIndex: 0, value: 100 }),
      clue({ id: "b", rowIndex: 1, columnIndex: 0, value: 200 }),
    ]);
    expect(removeBoardDefinitionRow(b, -1)).toBe(b);
    expect(removeBoardDefinitionRow(b, 2)).toBe(b);
  });

  test("removing a row drops that row and shifts remaining rows up with values preserved", () => {
    const b = boardFromClues(3, 2, [
      clue({ id: "a", rowIndex: 0, columnIndex: 0, value: 100 }),
      clue({ id: "b", rowIndex: 0, columnIndex: 1, value: 100 }),
      clue({ id: "c", rowIndex: 1, columnIndex: 0, value: 500 }),
      clue({ id: "d", rowIndex: 1, columnIndex: 1, value: 500 }),
      clue({ id: "e", rowIndex: 2, columnIndex: 0, value: 900 }),
      clue({ id: "f", rowIndex: 2, columnIndex: 1, value: 900 }),
    ]);
    const out = removeBoardDefinitionRow(b, 1);
    expect(out.rowCount).toBe(2);
    expect(out.clues).toHaveLength(4);
    const row0 = out.clues.filter((c) => c.rowIndex === 0);
    const row1 = out.clues.filter((c) => c.rowIndex === 1);
    expect(row0.every((c) => c.value === 100)).toBe(true);
    expect(row1.every((c) => c.value === 900)).toBe(true);
  });

  test("with two rows, new row value uses the step between last two rows", () => {
    const b = normalizeBoardDefinitionRows(
      boardFromClues(2, 1, [
        clue({ id: "a", rowIndex: 0, columnIndex: 0, value: 100 }),
        clue({ id: "b", rowIndex: 1, columnIndex: 0, value: 300 }),
      ]),
    );
    const out = addBoardDefinitionRow(b);
    expect(out.rowCount).toBe(3);
    const lastRow = out.clues.filter((c) => c.rowIndex === 2);
    expect(lastRow).toHaveLength(1);
    expect(lastRow[0]?.value).toBe(500);
  });

  test("with one row, new row adds 100 to that row value", () => {
    const b = normalizeBoardDefinitionRows(
      boardFromClues(1, 2, [
        clue({ id: "a", rowIndex: 0, columnIndex: 0, value: 250 }),
        clue({ id: "b", rowIndex: 0, columnIndex: 1, value: 250 }),
      ]),
    );
    const out = addBoardDefinitionRow(b);
    expect(out.rowCount).toBe(2);
    const row1 = out.clues.filter((c) => c.rowIndex === 1);
    expect(row1.every((c) => c.value === 350)).toBe(true);
  });
});

describe("addBoardDefinitionColumn / removeBoardDefinitionColumn", () => {
  test("does not shrink below 1 column", () => {
    const b = createBoardDefinition({ rowCount: 2, columnCount: 1 });
    expect(removeBoardDefinitionColumn(b, 0)).toBe(b);
  });

  test("returns the same board when the column index is out of bounds", () => {
    const b = boardFromClues(1, 3, [
      clue({ id: "a", columnIndex: 0, value: 100 }),
      clue({ id: "b", columnIndex: 1, value: 100 }),
      clue({ id: "c", columnIndex: 2, value: 100 }),
    ]);
    expect(removeBoardDefinitionColumn(b, -1)).toBe(b);
    expect(removeBoardDefinitionColumn(b, 3)).toBe(b);
  });

  test("new column copies each row value into new clues", () => {
    const b = normalizeBoardDefinitionRows(
      boardFromClues(2, 2, [
        clue({ id: "a", rowIndex: 0, columnIndex: 0, value: 111 }),
        clue({ id: "b", rowIndex: 0, columnIndex: 1, value: 222 }),
        clue({ id: "c", rowIndex: 1, columnIndex: 0, value: 333 }),
        clue({ id: "d", rowIndex: 1, columnIndex: 1, value: 444 }),
      ]),
    );
    const out = addBoardDefinitionColumn(b);
    expect(out.columnCount).toBe(3);
    expect(out.clues).toHaveLength(6);
    const col2 = out.clues.filter((c) => c.columnIndex === 2);
    expect(col2.find((c) => c.rowIndex === 0)?.value).toBe(111);
    expect(col2.find((c) => c.rowIndex === 1)?.value).toBe(333);
  });

  test("removing a column leaves row values on remaining clues unchanged", () => {
    const b = boardFromClues(2, 3, [
      clue({ id: "a", rowIndex: 0, columnIndex: 0, value: 100 }),
      clue({ id: "b", rowIndex: 0, columnIndex: 1, value: 100 }),
      clue({ id: "c", rowIndex: 0, columnIndex: 2, value: 100 }),
      clue({ id: "d", rowIndex: 1, columnIndex: 0, value: 500 }),
      clue({ id: "e", rowIndex: 1, columnIndex: 1, value: 500 }),
      clue({ id: "f", rowIndex: 1, columnIndex: 2, value: 500 }),
    ]);
    const out = removeBoardDefinitionColumn(b, 1);
    expect(out.columnCount).toBe(2);
    expect(out.clues.map((c) => `${c.rowIndex}:${c.columnIndex}:${c.value}`).toSorted()).toEqual([
      "0:0:100",
      "0:1:100",
      "1:0:500",
      "1:1:500",
    ]);
  });
});

describe("isCluePreviewFilled", () => {
  test("requires both prompt and response text by default", () => {
    expect(isCluePreviewFilled(clue({ id: "x", prompt: "Q", response: "A" }))).toBe(true);
    expect(isCluePreviewFilled(clue({ id: "x", prompt: "Q", response: "" }))).toBe(false);
    expect(isCluePreviewFilled(clue({ id: "x", prompt: "", response: "A" }))).toBe(false);
    expect(isCluePreviewFilled(clue({ id: "x", prompt: "  ", response: "  " }))).toBe(false);
  });

  test("treats optional images as content on both sides when text is empty", () => {
    const q = { kind: "image" as const, fileName: "q.png", url: "/q.png" };
    const a = { kind: "image" as const, fileName: "a.png", url: "/a.png" };
    expect(
      isCluePreviewFilled(
        clue({ id: "x", prompt: "", response: "", questionMedia: q, answerMedia: a }),
      ),
    ).toBe(true);
  });

  test("question text plus answer image is filled without question image", () => {
    const a = { kind: "image" as const, fileName: "a.png", url: "/a.png" };
    expect(isCluePreviewFilled(clue({ id: "x", prompt: "Q", response: "", answerMedia: a }))).toBe(
      true,
    );
  });

  test("answer text plus question image is filled without answer image", () => {
    const q = { kind: "image" as const, fileName: "q.png", url: "/q.png" };
    expect(
      isCluePreviewFilled(clue({ id: "x", prompt: "", response: "A", questionMedia: q })),
    ).toBe(true);
  });

  test("question image only is not filled without answer side content", () => {
    const q = { kind: "image" as const, fileName: "q.png", url: "/q.png" };
    expect(isCluePreviewFilled(clue({ id: "x", prompt: "", response: "", questionMedia: q }))).toBe(
      false,
    );
  });

  test("answer image only is not filled without question side content", () => {
    const a = { kind: "image" as const, fileName: "a.png", url: "/a.png" };
    expect(isCluePreviewFilled(clue({ id: "x", prompt: "", response: "", answerMedia: a }))).toBe(
      false,
    );
  });

  test("text plus images on both sides is filled", () => {
    const q = { kind: "image" as const, fileName: "q.png", url: "/q.png" };
    const a = { kind: "image" as const, fileName: "a.png", url: "/a.png" };
    expect(
      isCluePreviewFilled(
        clue({ id: "x", prompt: "Q", response: "A", questionMedia: q, answerMedia: a }),
      ),
    ).toBe(true);
  });
});
