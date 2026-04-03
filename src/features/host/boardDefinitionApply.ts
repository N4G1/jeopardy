import { normalizeBoardEditorBoard } from "src/features/setup/boardEditorState";
import {
  type BoardDefinition,
  migrateLegacyClueMediaBoard,
  validateBoardDefinition,
  validateBoardDefinitionForEditor,
} from "src/features/setup/boardSchema";

const INVALID_BOARD = "Board data is invalid.";

/**
 * Drafts, saved in-progress boards, and editor state: structural checks only, then row-value sync.
 */
export function normalizeBoardForHostEditor(board: BoardDefinition): BoardDefinition {
  const migrated = migrateLegacyClueMediaBoard(board);

  if (validateBoardDefinitionForEditor(migrated).length > 0) {
    throw new Error(INVALID_BOARD);
  }

  return normalizeBoardEditorBoard(migrated);
}

/**
 * Fully playable boards (e.g. dev fill). Runs `validateBoardDefinition`, then row-value sync.
 */
export function normalizePlayableBoardOrThrow(board: BoardDefinition): BoardDefinition {
  const migrated = migrateLegacyClueMediaBoard(board);

  if (validateBoardDefinition(migrated).length > 0) {
    throw new Error(INVALID_BOARD);
  }

  return normalizeBoardEditorBoard(migrated);
}

/**
 * Row sync only. Caller must already enforce board rules (e.g. `importBoardDefinitionFromJson`).
 */
export function normalizeImportedBoardDefinition(board: BoardDefinition): BoardDefinition {
  return normalizeBoardEditorBoard(migrateLegacyClueMediaBoard(board));
}
