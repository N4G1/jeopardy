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
});
