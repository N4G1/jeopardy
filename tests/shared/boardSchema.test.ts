import { describe, expect, test } from "vitest";

import {
  createBoardDefinition,
  validateBoardDefinition,
  validateBoardDefinitionForEditor,
  type BoardDefinition,
  type ClueMedia,
} from "src/features/setup/boardSchema";

const sampleQuestionImage: ClueMedia = {
  kind: "image",
  fileName: "q.png",
  url: "https://example.com/q.png",
};

const sampleAnswerImage: ClueMedia = {
  kind: "image",
  fileName: "a.png",
  url: "https://example.com/a.png",
};

function singleClueBoard(clue: BoardDefinition["clues"][number]): BoardDefinition {
  return {
    title: "Quiz",
    rowCount: 1,
    columnCount: 1,
    columnTitles: ["Category"],
    clues: [clue],
  };
}

function createValidBoardDefinition() {
  return {
    title: "Friday Quiz",
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

describe("validateBoardDefinition", () => {
  test("creates a 5 by 5 board by default", () => {
    const boardDefinition = createBoardDefinition();

    expect(boardDefinition.rowCount).toBe(5);
    expect(boardDefinition.columnCount).toBe(5);
    expect(boardDefinition.columnTitles).toHaveLength(5);
    expect(boardDefinition.clues).toHaveLength(25);
  });

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

  test("rejects blank column titles", () => {
    expect(
      validateBoardDefinition({
        ...createValidBoardDefinition(),
        columnTitles: ["History", "   "],
      }),
    ).toContainEqual({
      field: "columnTitles[1]",
      message: "Each column title is required.",
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
          message: "Clue question text or image is required.",
        },
        {
          field: "clues[2].response",
          message: "Clue answer text or image is required.",
        },
      ]),
    );
  });

  test("accepts image-only question side with text answer", () => {
    const board = singleClueBoard({
      id: "c1",
      rowIndex: 0,
      columnIndex: 0,
      value: 100,
      prompt: "",
      response: "Text answer",
      questionMedia: sampleQuestionImage,
    });
    expect(validateBoardDefinition(board)).toEqual([]);
  });

  test("accepts text question with image-only answer side", () => {
    const board = singleClueBoard({
      id: "c1",
      rowIndex: 0,
      columnIndex: 0,
      value: 100,
      prompt: "Text question",
      response: "",
      answerMedia: sampleAnswerImage,
    });
    expect(validateBoardDefinition(board)).toEqual([]);
  });

  test("accepts image-only on both question and answer sides", () => {
    const board = singleClueBoard({
      id: "c1",
      rowIndex: 0,
      columnIndex: 0,
      value: 100,
      prompt: "",
      response: "",
      questionMedia: sampleQuestionImage,
      answerMedia: sampleAnswerImage,
    });
    expect(validateBoardDefinition(board)).toEqual([]);
  });

  test("rejects clue with no question text and no question image", () => {
    const board = singleClueBoard({
      id: "c1",
      rowIndex: 0,
      columnIndex: 0,
      value: 100,
      prompt: "",
      response: "Answer",
      answerMedia: sampleAnswerImage,
    });
    expect(validateBoardDefinition(board)).toContainEqual({
      field: "clues[0].prompt",
      message: "Clue question text or image is required.",
    });
  });

  test("rejects clue with no answer text and no answer image", () => {
    const board = singleClueBoard({
      id: "c1",
      rowIndex: 0,
      columnIndex: 0,
      value: 100,
      prompt: "Question",
      response: "   ",
      questionMedia: sampleQuestionImage,
    });
    expect(validateBoardDefinition(board)).toContainEqual({
      field: "clues[0].response",
      message: "Clue answer text or image is required.",
    });
  });

  test("rejects a non-string title without throwing", () => {
    const bad = {
      ...createValidBoardDefinition(),
      title: 42,
    } as unknown as BoardDefinition;

    expect(validateBoardDefinition(bad)).toContainEqual({
      field: "title",
      message: "Game title must be a string.",
    });
  });

  test("rejects non-string clue prompt without throwing", () => {
    const board = createValidBoardDefinition();
    const first = board.clues[0];

    if (first === undefined) {
      throw new Error("Expected first clue.");
    }

    board.clues[0] = {
      ...first,
      prompt: null as unknown as string,
    };

    expect(validateBoardDefinition(board)).toContainEqual({
      field: "clues[0].prompt",
      message: "Clue question text or image is required.",
    });
  });

  test("rejects an empty clue id", () => {
    const board = createValidBoardDefinition();
    const first = board.clues[0];

    if (first === undefined) {
      throw new Error("Expected first clue.");
    }

    board.clues[0] = { ...first, id: "   " };

    expect(validateBoardDefinition(board)).toContainEqual({
      field: "clues[0].id",
      message: "Clue id must be a non-empty string.",
    });
  });

  test("rejects a non-string clue id", () => {
    const board = createValidBoardDefinition();
    const first = board.clues[0];

    if (first === undefined) {
      throw new Error("Expected first clue.");
    }

    board.clues[0] = { ...first, id: 1 as unknown as string };

    expect(validateBoardDefinition(board)).toContainEqual({
      field: "clues[0].id",
      message: "Clue id must be a non-empty string.",
    });
  });

  test("rejects a non-positive clue value", () => {
    const board = createValidBoardDefinition();
    const first = board.clues[0];

    if (first === undefined) {
      throw new Error("Expected first clue.");
    }

    board.clues[0] = { ...first, value: 0 };

    expect(validateBoardDefinition(board)).toContainEqual({
      field: "clues[0].value",
      message: "Clue value must be a positive integer.",
    });
  });

  test("rejects a non-integer clue value", () => {
    const board = createValidBoardDefinition();
    const first = board.clues[0];

    if (first === undefined) {
      throw new Error("Expected first clue.");
    }

    board.clues[0] = { ...first, value: 100.5 };

    expect(validateBoardDefinition(board)).toContainEqual({
      field: "clues[0].value",
      message: "Clue value must be a positive integer.",
    });
  });

  test("rejects malformed question media objects", () => {
    const board = singleClueBoard({
      id: "c1",
      rowIndex: 0,
      columnIndex: 0,
      value: 100,
      prompt: "",
      response: "A",
      questionMedia: { kind: "video", fileName: "x", url: "https://x" } as unknown as ClueMedia,
    });

    expect(validateBoardDefinition(board)).toContainEqual({
      field: "clues[0].questionMedia.kind",
      message: 'Image media kind must be "image".',
    });
  });

  test("rejects malformed answer media objects", () => {
    const board = singleClueBoard({
      id: "c1",
      rowIndex: 0,
      columnIndex: 0,
      value: 100,
      prompt: "Q",
      response: "",
      answerMedia: { kind: "image", fileName: "", url: "https://x" } as unknown as ClueMedia,
    });

    expect(validateBoardDefinition(board)).toContainEqual({
      field: "clues[0].answerMedia.fileName",
      message: "Image media fileName is required.",
    });
  });
});

describe("validateBoardDefinitionForEditor", () => {
  test("accepts a default in-progress board with empty clue text", () => {
    expect(validateBoardDefinitionForEditor(createBoardDefinition())).toEqual([]);
  });

  test("allows partial clue content", () => {
    const base = createBoardDefinition({ rowCount: 2, columnCount: 2 });
    const wip = {
      ...base,
      clues: base.clues.map((c, i) =>
        i === 0 ? { ...c, prompt: "Only Q", response: "Only A" } : c,
      ),
    };

    expect(validateBoardDefinitionForEditor(wip)).toEqual([]);
  });

  test("rejects the wrong clue count", () => {
    const base = createBoardDefinition({ rowCount: 2, columnCount: 2 });

    expect(
      validateBoardDefinitionForEditor({ ...base, clues: base.clues.slice(0, 2) }),
    ).toContainEqual({
      field: "clues",
      message: "Board must contain exactly 4 clues.",
    });
  });

  test("rejects duplicate clue positions", () => {
    const base = createValidBoardDefinition();
    const second = base.clues[1];

    if (second === undefined) {
      throw new Error("Expected second clue.");
    }

    base.clues[1] = {
      ...second,
      rowIndex: 0,
      columnIndex: 0,
    };

    expect(validateBoardDefinitionForEditor(base)).toContainEqual({
      field: "clues[1].position",
      message: "Each clue position must be unique on the board.",
    });
  });

  test("rejects out-of-bounds clue positions", () => {
    const base = createValidBoardDefinition();
    const fourth = base.clues[3];

    if (fourth === undefined) {
      throw new Error("Expected fourth clue.");
    }

    base.clues[3] = {
      ...fourth,
      rowIndex: 9,
    };

    expect(validateBoardDefinitionForEditor(base)).toContainEqual({
      field: "clues[3].position",
      message: "Clue position must stay within the board bounds.",
    });
  });

  test("rejects non-integer clue indices without throwing", () => {
    const base = createValidBoardDefinition();
    const first = base.clues[0];

    if (first === undefined) {
      throw new Error("Expected first clue.");
    }

    base.clues[0] = {
      ...first,
      rowIndex: "0" as unknown as number,
    };

    expect(validateBoardDefinitionForEditor(base)).toContainEqual({
      field: "clues[0].position",
      message: "Clue row and column indices must be integers.",
    });
  });

  test("rejects malformed clue id type via issues", () => {
    const base = createBoardDefinition({ rowCount: 1, columnCount: 1 });
    const first = base.clues[0];

    if (first === undefined) {
      throw new Error("Expected first clue.");
    }

    base.clues[0] = {
      ...first,
      id: 99 as unknown as string,
    };

    expect(validateBoardDefinitionForEditor(base)).toContainEqual({
      field: "clues[0].id",
      message: "Clue id must be a string.",
    });
  });

  test("rejects malformed clue prompt type via issues", () => {
    const base = createBoardDefinition({ rowCount: 1, columnCount: 1 });
    const first = base.clues[0];

    if (first === undefined) {
      throw new Error("Expected first clue.");
    }

    base.clues[0] = {
      ...first,
      prompt: 123 as unknown as string,
    };

    expect(validateBoardDefinitionForEditor(base)).toContainEqual({
      field: "clues[0].prompt",
      message: "Clue prompt must be a string when present.",
    });
  });

  test("rejects malformed question media when present", () => {
    const base = createBoardDefinition({ rowCount: 1, columnCount: 1 });
    const first = base.clues[0];

    if (first === undefined) {
      throw new Error("Expected first clue.");
    }

    base.clues[0] = {
      ...first,
      questionMedia: { kind: "image", fileName: "x" } as unknown as ClueMedia,
    };

    expect(validateBoardDefinitionForEditor(base)).toContainEqual({
      field: "clues[0].questionMedia.url",
      message: "Image media url is required.",
    });
  });
});
