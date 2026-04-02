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

function validateBoardDefinition(boardDefinition: BoardDefinition): BoardValidationIssue[] {
  const issues: BoardValidationIssue[] = [];

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

  return issues;
}

export type { BoardClueDefinition, BoardDefinition, BoardValidationIssue, ClueMedia };
export { validateBoardDefinition };
