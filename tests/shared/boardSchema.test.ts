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

  test("rejects a board with the wrong clue count", () => {
    expect(
      validateBoardDefinition({
        ...createValidBoardDefinition(),
        clues: createValidBoardDefinition().clues.slice(0, 3),
      }),
    ).toContainEqual({
      field: "clues",
      message: "Board must contain exactly 4 clues.",
    });
  });

  test("rejects clues with duplicate board positions", () => {
    const boardDefinition = createValidBoardDefinition();
    const secondClue = boardDefinition.clues[1];

    if (secondClue === undefined) {
      throw new Error("Expected second clue to exist.");
    }

    boardDefinition.clues[1] = {
      ...secondClue,
      rowIndex: 0,
      columnIndex: 0,
    };

    expect(validateBoardDefinition(boardDefinition)).toContainEqual({
      field: "clues[1].position",
      message: "Each clue position must be unique on the board.",
    });
  });

  test("rejects clues outside of the configured board bounds", () => {
    const boardDefinition = createValidBoardDefinition();
    const fourthClue = boardDefinition.clues[3];

    if (fourthClue === undefined) {
      throw new Error("Expected fourth clue to exist.");
    }

    boardDefinition.clues[3] = {
      ...fourthClue,
      rowIndex: 9,
    };

    expect(validateBoardDefinition(boardDefinition)).toContainEqual({
      field: "clues[3].position",
      message: "Clue position must stay within the board bounds.",
    });
  });

  test("rejects clues with empty prompt or answer text", () => {
    const boardDefinition = createValidBoardDefinition();
    const thirdClue = boardDefinition.clues[2];

    if (thirdClue === undefined) {
      throw new Error("Expected third clue to exist.");
    }

    boardDefinition.clues[2] = {
      ...thirdClue,
      prompt: " ",
      response: "",
    };

    expect(validateBoardDefinition(boardDefinition)).toEqual(
      expect.arrayContaining([
        {
          field: "clues[2].prompt",
          message: "Clue question text is required.",
        },
        {
          field: "clues[2].response",
          message: "Clue answer text is required.",
        },
      ]),
    );
  });
});
