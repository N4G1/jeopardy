type ImageClueMedia = {
  kind: "image";
  fileName: string;
  url: string;
  altText?: string;
};

type AudioClueMedia = {
  kind: "audio";
  fileName: string;
  url: string;
};

type VideoClueMedia = {
  kind: "video";
  fileName: string;
  url: string;
};

type ClueMedia = ImageClueMedia | AudioClueMedia | VideoClueMedia;

type BoardClueDefinition = {
  id: string;
  rowIndex: number;
  columnIndex: number;
  value: number;
  prompt: string;
  response: string;
  questionMedia?: ClueMedia;
  answerMedia?: ClueMedia;
};

type BoardDefinition = {
  title: string;
  rowCount: number;
  columnCount: number;
  columnTitles: string[];
  clues: BoardClueDefinition[];
};

type BoardValidationIssue = {
  field: string;
  message: string;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isSupportedClueMediaKind(kind: unknown): kind is ClueMedia["kind"] {
  return kind === "image" || kind === "audio" || kind === "video";
}

/** Returns issues for a single `ClueMedia` value; empty list when `media` is undefined or null. */
function validateClueMediaShape(media: unknown, fieldPath: string): BoardValidationIssue[] {
  const issues: BoardValidationIssue[] = [];

  if (media === undefined || media === null) {
    return issues;
  }

  if (!isPlainObject(media)) {
    issues.push({
      field: fieldPath,
      message: "Media must be an object.",
    });
    return issues;
  }

  if (!isSupportedClueMediaKind(media.kind)) {
    issues.push({
      field: `${fieldPath}.kind`,
      message: 'Media kind must be "image", "audio", or "video".',
    });
  }

  if (typeof media.fileName !== "string" || media.fileName.trim().length === 0) {
    issues.push({
      field: `${fieldPath}.fileName`,
      message: "Media fileName is required.",
    });
  }

  if (typeof media.url !== "string" || media.url.trim().length === 0) {
    issues.push({
      field: `${fieldPath}.url`,
      message: "Media url is required.",
    });
  }

  if (media.kind === "image" && media.altText !== undefined && typeof media.altText !== "string") {
    issues.push({
      field: `${fieldPath}.altText`,
      message: "Image media altText must be a string when present.",
    });
  }

  return issues;
}

function appendClueMediaShapeIssues(
  media: unknown,
  fieldPath: string,
  issues: BoardValidationIssue[],
): void {
  issues.push(...validateClueMediaShape(media, fieldPath));
}

/**
 * Legacy persisted clues used `media` for the question image. Copies into `questionMedia` when absent.
 */
function migrateLegacyClueMediaBoard(board: BoardDefinition): BoardDefinition {
  return {
    ...board,
    clues: board.clues.map((clue) => {
      const extended = clue as BoardClueDefinition & { media?: unknown };

      if (extended.questionMedia !== undefined || extended.media === undefined) {
        return clue;
      }

      const { media, ...rest } = extended as BoardClueDefinition & { media: unknown };

      return {
        ...(rest as BoardClueDefinition),
        questionMedia: media as ClueMedia,
      };
    }),
  };
}

function appendDimensionIssues(
  board: unknown,
  issues: BoardValidationIssue[],
): {
  rowCount: number;
  columnCount: number;
} | null {
  const rowCountRaw = isPlainObject(board) ? board.rowCount : undefined;
  const columnCountRaw = isPlainObject(board) ? board.columnCount : undefined;

  const rowOk = typeof rowCountRaw === "number" && Number.isInteger(rowCountRaw) && rowCountRaw > 0;
  const colOk =
    typeof columnCountRaw === "number" && Number.isInteger(columnCountRaw) && columnCountRaw > 0;

  if (!rowOk) {
    issues.push({
      field: "rowCount",
      message: "Row count must be a positive integer.",
    });
  }

  if (!colOk) {
    issues.push({
      field: "columnCount",
      message: "Column count must be a positive integer.",
    });
  }

  if (!rowOk || !colOk) {
    return null;
  }

  return { rowCount: rowCountRaw, columnCount: columnCountRaw };
}

/**
 * Shared: column title array length vs `columnCount`, and per-cell type (and for playable, non-empty trim).
 */
function appendColumnTitleIssues(
  board: unknown,
  columnCount: number,
  issues: BoardValidationIssue[],
  mode: "playable" | "editor",
): void {
  const columnTitles = isPlainObject(board) ? board.columnTitles : undefined;

  if (!Array.isArray(columnTitles)) {
    issues.push({
      field: "columnTitles",
      message: "Column titles must be an array.",
    });
    return;
  }

  if (columnTitles.length !== columnCount) {
    issues.push({
      field: "columnTitles",
      message: `Board must contain exactly ${columnCount} column titles.`,
    });
  }

  for (const [columnIndex, columnTitle] of columnTitles.entries()) {
    if (typeof columnTitle !== "string") {
      issues.push({
        field: `columnTitles[${columnIndex}]`,
        message: "Each column title must be a string.",
      });
      continue;
    }

    if (mode === "playable" && columnTitle.trim().length === 0) {
      issues.push({
        field: `columnTitles[${columnIndex}]`,
        message: "Each column title is required.",
      });
    }
  }
}

function appendClueArrayAndCountIssues(
  board: unknown,
  expectedClueCount: number,
  issues: BoardValidationIssue[],
): unknown[] | null {
  const clues = isPlainObject(board) ? board.clues : undefined;

  if (!Array.isArray(clues)) {
    issues.push({
      field: "clues",
      message: "Clues must be an array.",
    });
    return null;
  }

  if (clues.length !== expectedClueCount) {
    issues.push({
      field: "clues",
      message: `Board must contain exactly ${expectedClueCount} clues.`,
    });
  }

  return clues;
}

/** Grid positions, duplicates, and optional per-clue follow-up using a safe clue record. */
function appendClueGridLayoutIssues(
  clues: unknown[],
  rowCount: number,
  columnCount: number,
  issues: BoardValidationIssue[],
  afterLayout?: (clue: Record<string, unknown>, clueIndex: number) => void,
): void {
  const occupiedPositions = new Set<string>();

  for (const [clueIndex, rawClue] of clues.entries()) {
    if (!isPlainObject(rawClue)) {
      issues.push({
        field: `clues[${clueIndex}]`,
        message: "Each clue must be an object.",
      });
      continue;
    }

    const clue = rawClue;
    const rowRaw = clue.rowIndex;
    const columnRaw = clue.columnIndex;

    const indicesOk =
      typeof rowRaw === "number" &&
      typeof columnRaw === "number" &&
      Number.isInteger(rowRaw) &&
      Number.isInteger(columnRaw);

    if (!indicesOk) {
      issues.push({
        field: `clues[${clueIndex}].position`,
        message: "Clue row and column indices must be integers.",
      });
      continue;
    }

    const rowIndex = rowRaw;
    const columnIndex = columnRaw;

    const positionKey = `${rowIndex}:${columnIndex}`;
    const isWithinBounds =
      rowIndex >= 0 && rowIndex < rowCount && columnIndex >= 0 && columnIndex < columnCount;

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

    afterLayout?.(clue, clueIndex);
  }
}

function appendPlayableClueIdentityIssues(
  clue: Record<string, unknown>,
  clueIndex: number,
  issues: BoardValidationIssue[],
): void {
  const id = clue.id;
  if (typeof id !== "string" || id.trim().length === 0) {
    issues.push({
      field: `clues[${clueIndex}].id`,
      message: "Clue id must be a non-empty string.",
    });
  }

  const value = clue.value;
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    issues.push({
      field: `clues[${clueIndex}].value`,
      message: "Clue value must be a positive integer.",
    });
  }
}

function appendPlayableClueContentIssues(
  clue: Record<string, unknown>,
  clueIndex: number,
  issues: BoardValidationIssue[],
): void {
  const prompt = clue.prompt;
  const promptTextOk = typeof prompt === "string" && prompt.trim().length > 0;

  const questionMedia = clue.questionMedia;
  const hasQuestionMedia = questionMedia !== undefined && questionMedia !== null;
  const questionMediaPath = `clues[${clueIndex}].questionMedia`;
  const questionMediaIssues = hasQuestionMedia
    ? validateClueMediaShape(questionMedia, questionMediaPath)
    : [];
  issues.push(...questionMediaIssues);
  const questionMediaOk = hasQuestionMedia && questionMediaIssues.length === 0;

  if (!promptTextOk && !questionMediaOk && !hasQuestionMedia) {
    issues.push({
      field: `clues[${clueIndex}].prompt`,
      message: "Clue question text or media is required.",
    });
  }

  const response = clue.response;
  const responseTextOk = typeof response === "string" && response.trim().length > 0;

  const answerMedia = clue.answerMedia;
  const hasAnswerMedia = answerMedia !== undefined && answerMedia !== null;
  const answerMediaPath = `clues[${clueIndex}].answerMedia`;
  const answerMediaIssues = hasAnswerMedia
    ? validateClueMediaShape(answerMedia, answerMediaPath)
    : [];
  issues.push(...answerMediaIssues);
  const answerMediaOk = hasAnswerMedia && answerMediaIssues.length === 0;

  if (!responseTextOk && !answerMediaOk && !hasAnswerMedia) {
    issues.push({
      field: `clues[${clueIndex}].response`,
      message: "Clue answer text or media is required.",
    });
  }
}

function appendEditorClueFieldTypeIssues(
  clue: Record<string, unknown>,
  clueIndex: number,
  issues: BoardValidationIssue[],
): void {
  if (typeof clue.id !== "string") {
    issues.push({
      field: `clues[${clueIndex}].id`,
      message: "Clue id must be a string.",
    });
  }

  const value = clue.value;
  if (!Number.isInteger(value) || (value as number) <= 0) {
    issues.push({
      field: `clues[${clueIndex}].value`,
      message: "Clue value must be a positive integer.",
    });
  }

  const promptField = clue.prompt;
  if (promptField !== undefined && typeof promptField !== "string") {
    issues.push({
      field: `clues[${clueIndex}].prompt`,
      message: "Clue prompt must be a string when present.",
    });
  }

  const responseField = clue.response;
  if (responseField !== undefined && typeof responseField !== "string") {
    issues.push({
      field: `clues[${clueIndex}].response`,
      message: "Clue response must be a string when present.",
    });
  }

  appendClueMediaShapeIssues(clue.questionMedia, `clues[${clueIndex}].questionMedia`, issues);
  appendClueMediaShapeIssues(clue.answerMedia, `clues[${clueIndex}].answerMedia`, issues);
}

function createBoardDefinition({
  title = "New Jeopardy Game",
  rowCount = 5,
  columnCount = 5,
}: Partial<Pick<BoardDefinition, "title" | "rowCount" | "columnCount">> = {}): BoardDefinition {
  return {
    title,
    rowCount,
    columnCount,
    columnTitles: createColumnTitles(columnCount),
    clues: createClues(rowCount, columnCount),
  };
}

function fillBoardDefinitionWithSampleContent(boardDefinition: BoardDefinition): BoardDefinition {
  return {
    ...boardDefinition,
    columnTitles: boardDefinition.columnTitles.map(
      (_, columnIndex) => `Category ${columnIndex + 1}`,
    ),
    clues: boardDefinition.clues.map((clue) => ({
      ...clue,
      prompt: `Sample question ${clue.rowIndex + 1}-${clue.columnIndex + 1}`,
      response: `Sample answer ${clue.rowIndex + 1}-${clue.columnIndex + 1}`,
    })),
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
    columnTitles: createColumnTitles(safeColumnCount, boardDefinition.columnTitles),
    clues: createClues(safeRowCount, safeColumnCount, boardDefinition.clues),
  };
}

function validateBoardDefinition(boardDefinition: BoardDefinition): BoardValidationIssue[] {
  const issues: BoardValidationIssue[] = [];
  const board = boardDefinition as unknown;

  const title = isPlainObject(board) ? board.title : undefined;
  if (typeof title !== "string") {
    issues.push({
      field: "title",
      message: "Game title must be a string.",
    });
  } else if (title.trim().length === 0) {
    issues.push({
      field: "title",
      message: "Game title is required.",
    });
  }

  const dims = appendDimensionIssues(board, issues);
  if (dims === null) {
    return issues;
  }

  const { rowCount, columnCount } = dims;
  appendColumnTitleIssues(board, columnCount, issues, "playable");

  const expectedClueCount = rowCount * columnCount;
  const clues = appendClueArrayAndCountIssues(board, expectedClueCount, issues);
  if (clues === null) {
    return issues;
  }

  appendClueGridLayoutIssues(clues, rowCount, columnCount, issues, (clue, clueIndex) => {
    appendPlayableClueIdentityIssues(clue, clueIndex, issues);
    appendPlayableClueContentIssues(clue, clueIndex, issues);
  });

  return issues;
}

/** Layout and grid integrity; allows empty title, column titles, and incomplete clues (draft/editor). */
function validateBoardDefinitionForEditor(
  boardDefinition: BoardDefinition,
): BoardValidationIssue[] {
  const issues: BoardValidationIssue[] = [];
  const board = boardDefinition as unknown;

  const title = isPlainObject(board) ? board.title : undefined;
  if (typeof title !== "string") {
    issues.push({
      field: "title",
      message: "Game title must be a string.",
    });
  }

  const dims = appendDimensionIssues(board, issues);
  if (dims === null) {
    return issues;
  }

  const { rowCount, columnCount } = dims;
  appendColumnTitleIssues(board, columnCount, issues, "editor");

  const expectedClueCount = rowCount * columnCount;
  const clues = appendClueArrayAndCountIssues(board, expectedClueCount, issues);
  if (clues === null) {
    return issues;
  }

  appendClueGridLayoutIssues(clues, rowCount, columnCount, issues, (clue, clueIndex) => {
    appendEditorClueFieldTypeIssues(clue, clueIndex, issues);
  });

  return issues;
}

function createColumnTitles(columnCount: number, existingColumnTitles: string[] = []): string[] {
  return Array.from({ length: columnCount }, (_, columnIndex) => {
    return existingColumnTitles[columnIndex] ?? `Column ${columnIndex + 1}`;
  });
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
export {
  createBoardDefinition,
  fillBoardDefinitionWithSampleContent,
  migrateLegacyClueMediaBoard,
  resizeBoardDefinition,
  validateBoardDefinition,
  validateBoardDefinitionForEditor,
};
