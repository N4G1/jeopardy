type ClueMedia = {
  kind: "image";
  fileName: string;
  url: string;
  altText?: string;
};

type BoardClueDefinition = {
  id: string;
  rowIndex: number;
  columnIndex: number;
  value: number;
  prompt: string;
  response: string;
  media?: ClueMedia;
};

type BoardDefinition = {
  title: string;
  rowCount: number;
  columnCount: number;
  clues: BoardClueDefinition[];
};

type BoardValidationIssue = {
  field: string;
  message: string;
};

function createBoardDefinition({
  title = "New Jeopardy Game",
  rowCount = 2,
  columnCount = 2,
}: Partial<Pick<BoardDefinition, "title" | "rowCount" | "columnCount">> = {}): BoardDefinition {
  return {
    title,
    rowCount,
    columnCount,
    clues: createClues(rowCount, columnCount),
  };
}

function resizeBoardDefinition(
  boardDefinition: BoardDefinition,
  rowCount: number,
  columnCount: number,
): BoardDefinition {
  const safeRowCount = Math.max(1, rowCount);
  const safeColumnCount = Math.max(1, columnCount);

  return {
    ...boardDefinition,
    rowCount: safeRowCount,
    columnCount: safeColumnCount,
    clues: createClues(safeRowCount, safeColumnCount, boardDefinition.clues),
  };
}

function validateBoardDefinition(boardDefinition: BoardDefinition): BoardValidationIssue[] {
  const issues: BoardValidationIssue[] = [];
  const occupiedPositions = new Set<string>();

  if (boardDefinition.title.trim().length === 0) {
    issues.push({
      field: "title",
      message: "Game title is required.",
    });
  }

  if (!Number.isInteger(boardDefinition.rowCount) || boardDefinition.rowCount <= 0) {
    issues.push({
      field: "rowCount",
      message: "Row count must be a positive integer.",
    });
  }

  if (!Number.isInteger(boardDefinition.columnCount) || boardDefinition.columnCount <= 0) {
    issues.push({
      field: "columnCount",
      message: "Column count must be a positive integer.",
    });
  }

  const expectedClueCount = boardDefinition.rowCount * boardDefinition.columnCount;

  if (boardDefinition.clues.length !== expectedClueCount) {
    issues.push({
      field: "clues",
      message: `Board must contain exactly ${expectedClueCount} clues.`,
    });
  }

  for (const [clueIndex, clue] of boardDefinition.clues.entries()) {
    const positionKey = `${clue.rowIndex}:${clue.columnIndex}`;
    const isWithinBounds =
      clue.rowIndex >= 0 &&
      clue.rowIndex < boardDefinition.rowCount &&
      clue.columnIndex >= 0 &&
      clue.columnIndex < boardDefinition.columnCount;

    if (!isWithinBounds) {
      issues.push({
        field: `clues[${clueIndex}].position`,
        message: "Clue position must stay within the board bounds.",
      });
    }

    if (occupiedPositions.has(positionKey)) {
      issues.push({
        field: `clues[${clueIndex}].position`,
        message: "Each clue position must be unique on the board.",
      });
    } else {
      occupiedPositions.add(positionKey);
    }

    if (clue.prompt.trim().length === 0) {
      issues.push({
        field: `clues[${clueIndex}].prompt`,
        message: "Clue question text is required.",
      });
    }

    if (clue.response.trim().length === 0) {
      issues.push({
        field: `clues[${clueIndex}].response`,
        message: "Clue answer text is required.",
      });
    }
  }

  return issues;
}

function createClues(
  rowCount: number,
  columnCount: number,
  existingClues: BoardClueDefinition[] = [],
): BoardClueDefinition[] {
  const existingCluesByPosition = new Map(
    existingClues.map((clue) => [`${clue.rowIndex}:${clue.columnIndex}`, clue]),
  );

  const nextClues: BoardClueDefinition[] = [];

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      const existingClue = existingCluesByPosition.get(`${rowIndex}:${columnIndex}`);

      nextClues.push(
        existingClue ?? {
          id: `clue-${rowIndex}-${columnIndex}`,
          rowIndex,
          columnIndex,
          value: (rowIndex + 1) * 100,
          prompt: "",
          response: "",
        },
      );
    }
  }

  return nextClues;
}

export type { BoardClueDefinition, BoardDefinition, BoardValidationIssue, ClueMedia };
export { createBoardDefinition, resizeBoardDefinition, validateBoardDefinition };
