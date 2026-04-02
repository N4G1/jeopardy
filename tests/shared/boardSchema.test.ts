import { describe, expect, test } from "vitest";

import { validateBoardDefinition } from "src/features/setup/boardSchema";

function createValidBoardDefinition() {
  return {
    title: "Friday Quiz",
    rowCount: 2,
    columnCount: 2,
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

describe("validateBoardDefinition", () => {
  test("accepts a complete board definition", () => {
    expect(validateBoardDefinition(createValidBoardDefinition())).toEqual([]);
  });

  test("rejects an empty game title", () => {
    expect(
      validateBoardDefinition({
        ...createValidBoardDefinition(),
        title: "   ",
      }),
    ).toContainEqual({
      field: "title",
      message: "Game title is required.",
    });
  });
});
