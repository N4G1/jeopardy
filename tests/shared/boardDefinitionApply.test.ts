import { describe, expect, test } from "vitest";

import {
  normalizeBoardForHostEditor,
  normalizeImportedBoardDefinition,
  normalizePlayableBoardOrThrow,
} from "src/features/host/boardDefinitionApply";
import { createBoardDefinition, type BoardDefinition } from "src/features/setup/boardSchema";

function denormalizedTwoByTwoWithFilledClues() {
  const base = createBoardDefinition({ rowCount: 2, columnCount: 2 });
  return {
    ...base,
    clues: base.clues.map((c) => ({
      ...c,
      prompt: `q${c.rowIndex}-${c.columnIndex}`,
      response: `a${c.rowIndex}-${c.columnIndex}`,
      value: c.rowIndex === 0 && c.columnIndex === 1 ? 900 : (c.rowIndex + 1) * 100,
    })),
  };
}

describe("normalizeBoardForHostEditor", () => {
  test("migrates legacy clue media into questionMedia", () => {
    const base = createBoardDefinition({ rowCount: 1, columnCount: 1 });
    const first = base.clues[0];

    if (first === undefined) {
      throw new Error("Expected first clue.");
    }

    const legacy = {
      ...base,
      clues: [
        {
          ...first,
          prompt: "Q",
          response: "A",
          media: {
            kind: "image",
            fileName: "legacy.png",
            url: "https://example.com/legacy.png",
          },
        },
      ],
    } as unknown as BoardDefinition;

    const out = normalizeBoardForHostEditor(legacy);

    expect(out.clues[0]?.questionMedia?.fileName).toBe("legacy.png");
    expect("media" in (out.clues[0] as object)).toBe(false);
  });

  test("accepts an in-progress board with empty clues and normalizes row values", () => {
    const base = createBoardDefinition({ rowCount: 2, columnCount: 2 });
    const denormalized = {
      ...base,
      clues: base.clues.map((c) => ({
        ...c,
        value: c.rowIndex === 0 && c.columnIndex === 1 ? 900 : (c.rowIndex + 1) * 100,
      })),
    };

    const normalized = normalizeBoardForHostEditor(denormalized);

    const row0 = normalized.clues.filter((c) => c.rowIndex === 0);
    expect(row0.every((c) => c.value === 100)).toBe(true);
    expect(row0.every((c) => c.prompt === "" && c.response === "")).toBe(true);
  });

  test("accepts a saved-style WIP board with only some clues filled", () => {
    const base = createBoardDefinition({ rowCount: 2, columnCount: 2 });
    const wip = {
      ...base,
      clues: base.clues.map((c, i) =>
        i === 0 ? { ...c, prompt: "Only one", response: "Answer" } : c,
      ),
    };

    const out = normalizeBoardForHostEditor(wip);

    expect(out.clues[0]?.prompt).toBe("Only one");
    expect(out.clues[1]?.prompt).toBe("");
  });

  test("rejects structurally invalid boards", () => {
    const base = createBoardDefinition({ rowCount: 2, columnCount: 2 });
    const broken = { ...base, clues: base.clues.slice(0, 2) };

    expect(() => normalizeBoardForHostEditor(broken)).toThrow("Board data is invalid.");
  });
});

describe("normalizePlayableBoardOrThrow", () => {
  test("synchronizes clue values per row for a complete valid board", () => {
    const normalized = normalizePlayableBoardOrThrow(denormalizedTwoByTwoWithFilledClues());

    const row0 = normalized.clues.filter((c) => c.rowIndex === 0);
    expect(row0.every((c) => c.value === 100)).toBe(true);
    const row1 = normalized.clues.filter((c) => c.rowIndex === 1);
    expect(row1.every((c) => c.value === 200)).toBe(true);
  });

  test("rejects playable-incomplete boards (empty clues)", () => {
    const draft = createBoardDefinition({ rowCount: 2, columnCount: 2 });

    expect(() => normalizePlayableBoardOrThrow(draft)).toThrow("Board data is invalid.");
  });

  test("rejects empty title even when clues are complete", () => {
    const base = denormalizedTwoByTwoWithFilledClues();
    const invalidTitle = { ...base, title: "   " };

    expect(() => normalizePlayableBoardOrThrow(invalidTitle)).toThrow("Board data is invalid.");
  });
});

describe("normalizeImportedBoardDefinition", () => {
  test("row-syncs a board that already passed import validation", () => {
    const board = denormalizedTwoByTwoWithFilledClues();
    const normalized = normalizeImportedBoardDefinition(board);

    const row0 = normalized.clues.filter((c) => c.rowIndex === 0);
    expect(row0.every((c) => c.value === 100)).toBe(true);
  });
});
