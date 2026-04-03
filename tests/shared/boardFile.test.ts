import { describe, expect, test } from "vitest";

import type { BoardDefinition } from "src/features/setup/boardSchema";
import {
  exportBoardDefinitionToJson,
  importBoardDefinitionFromJson,
} from "src/features/setup/boardFile";

function createBoardDefinition(): BoardDefinition {
  return {
    title: "Quiz Night",
    rowCount: 2,
    columnCount: 2,
    columnTitles: ["History", "Science"],
    clues: [
      {
        id: "c1",
        rowIndex: 0,
        columnIndex: 0,
        value: 100,
        prompt: "Question one",
        response: "Answer one",
      },
      {
        id: "c2",
        rowIndex: 0,
        columnIndex: 1,
        value: 200,
        prompt: "Question two",
        response: "Answer two",
      },
      {
        id: "c3",
        rowIndex: 1,
        columnIndex: 0,
        value: 300,
        prompt: "Question three",
        response: "Answer three",
      },
      {
        id: "c4",
        rowIndex: 1,
        columnIndex: 1,
        value: 400,
        prompt: "Question four",
        response: "Answer four",
      },
    ],
  };
}

describe("boardFile", () => {
  test("exports and re-imports a valid board definition", () => {
    const boardDefinition = createBoardDefinition();

    const json = exportBoardDefinitionToJson(boardDefinition);

    expect(importBoardDefinitionFromJson(json)).toEqual(boardDefinition);
  });

  test("rejects malformed json", () => {
    expect(() => importBoardDefinitionFromJson("{not valid json}")).toThrow(
      "Board file is not valid JSON.",
    );
  });

  test("imports a board with empty clues (work-in-progress)", () => {
    const boardDefinition: BoardDefinition = {
      title: "Draft Board",
      rowCount: 1,
      columnCount: 1,
      columnTitles: ["Category"],
      clues: [
        {
          id: "c0",
          rowIndex: 0,
          columnIndex: 0,
          value: 100,
          prompt: "",
          response: "",
        },
      ],
    };

    const json = exportBoardDefinitionToJson(boardDefinition);

    expect(importBoardDefinitionFromJson(json)).toEqual(boardDefinition);
  });

  test("rejects structurally invalid board definitions", () => {
    expect(() =>
      importBoardDefinitionFromJson(
        JSON.stringify({
          title: "Quiz Night",
          rowCount: 2,
          columnCount: 2,
          columnTitles: ["History", ""],
          clues: [],
        }),
      ),
    ).toThrow("Board file is invalid.");
  });

  test("imports JSON with legacy clue media and maps to questionMedia", () => {
    const json = JSON.stringify({
      title: "Legacy import",
      rowCount: 1,
      columnCount: 1,
      columnTitles: ["Solo"],
      clues: [
        {
          id: "c0",
          rowIndex: 0,
          columnIndex: 0,
          value: 100,
          prompt: "Question",
          response: "Answer",
          media: {
            kind: "image",
            fileName: "q.png",
            url: "https://example.com/q.png",
          },
        },
      ],
    });

    const board = importBoardDefinitionFromJson(json);

    expect(board.clues[0]?.questionMedia?.url).toBe("https://example.com/q.png");
    expect("media" in (board.clues[0] as object)).toBe(false);
  });
});
