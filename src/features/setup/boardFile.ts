import type { BoardDefinition } from "./boardSchema";
import { validateBoardDefinition } from "./boardSchema";

function exportBoardDefinitionToJson(boardDefinition: BoardDefinition): string {
  return JSON.stringify(boardDefinition, null, 2);
}

function importBoardDefinitionFromJson(json: string): BoardDefinition {
  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(json) as unknown;
  } catch {
    throw new Error("Board file is not valid JSON.");
  }

  if (!isBoardDefinition(parsedValue)) {
    throw new Error("Board file is invalid.");
  }

  const validationIssues = validateBoardDefinition(parsedValue);

  if (validationIssues.length > 0) {
    throw new Error("Board file is invalid.");
  }

  return parsedValue;
}

function isBoardDefinition(value: unknown): value is BoardDefinition {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const board = value as Partial<BoardDefinition>;

  return (
    typeof board.title === "string" &&
    typeof board.rowCount === "number" &&
    typeof board.columnCount === "number" &&
    Array.isArray(board.columnTitles) &&
    Array.isArray(board.clues)
  );
}

export { exportBoardDefinitionToJson, importBoardDefinitionFromJson };
