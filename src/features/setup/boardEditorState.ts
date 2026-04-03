import type { BoardClueDefinition, BoardDefinition } from "src/features/setup/boardSchema";

function defaultLadderValueForRow(rowIndex: number): number {
  return (rowIndex + 1) * 100;
}

function isValidPositiveIntegerRowValue(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function cluesForRow(board: BoardDefinition, rowIndex: number): BoardClueDefinition[] {
  return board.clues
    .filter((c) => c.rowIndex === rowIndex)
    .toSorted((a, b) => a.columnIndex - b.columnIndex);
}

function pickSynchronizedValueForRow(rowClues: BoardClueDefinition[], rowIndex: number): number {
  if (rowClues.length === 0) {
    return defaultLadderValueForRow(rowIndex);
  }
  const leftmost = rowClues[0];
  if (leftmost !== undefined && isValidPositiveIntegerRowValue(leftmost.value)) {
    return leftmost.value;
  }
  for (const clue of rowClues.slice(1)) {
    if (isValidPositiveIntegerRowValue(clue.value)) {
      return clue.value;
    }
  }
  return defaultLadderValueForRow(rowIndex);
}

function sortCluesRowMajor(clues: BoardClueDefinition[]): BoardClueDefinition[] {
  return clues.toSorted((a, b) => {
    if (a.rowIndex !== b.rowIndex) {
      return a.rowIndex - b.rowIndex;
    }
    return a.columnIndex - b.columnIndex;
  });
}

function normalizeBoardDefinitionRows(board: BoardDefinition): BoardDefinition {
  const valueByRow = new Map<number, number>();
  for (let rowIndex = 0; rowIndex < board.rowCount; rowIndex += 1) {
    valueByRow.set(rowIndex, pickSynchronizedValueForRow(cluesForRow(board, rowIndex), rowIndex));
  }
  return {
    ...board,
    clues: board.clues.map((clue) => {
      const v = valueByRow.get(clue.rowIndex);
      if (v === undefined) {
        return clue;
      }
      return { ...clue, value: v };
    }),
  };
}

function setBoardDefinitionRowValue(
  board: BoardDefinition,
  rowIndex: number,
  value: number,
): BoardDefinition {
  return {
    ...board,
    clues: board.clues.map((clue) => (clue.rowIndex === rowIndex ? { ...clue, value } : clue)),
  };
}

function getBoardDefinitionRowValue(board: BoardDefinition, rowIndex: number): number {
  return pickSynchronizedValueForRow(cluesForRow(board, rowIndex), rowIndex);
}

function addBoardDefinitionRow(board: BoardDefinition): BoardDefinition {
  const newRowIndex = board.rowCount;
  let newRowValue: number;
  if (board.rowCount >= 2) {
    const vLast = getBoardDefinitionRowValue(board, board.rowCount - 1);
    const vPrev = getBoardDefinitionRowValue(board, board.rowCount - 2);
    newRowValue = vLast + (vLast - vPrev);
  } else {
    newRowValue = getBoardDefinitionRowValue(board, 0) + 100;
  }

  const nextClues: BoardClueDefinition[] = [...board.clues];
  for (let columnIndex = 0; columnIndex < board.columnCount; columnIndex += 1) {
    nextClues.push({
      id: `clue-${newRowIndex}-${columnIndex}`,
      rowIndex: newRowIndex,
      columnIndex,
      value: newRowValue,
      prompt: "",
      response: "",
    });
  }

  return {
    ...board,
    rowCount: board.rowCount + 1,
    clues: sortCluesRowMajor(nextClues),
  };
}

function removeBoardDefinitionRow(board: BoardDefinition, rowIndex: number): BoardDefinition {
  if (rowIndex < 0 || rowIndex >= board.rowCount || board.rowCount <= 1) {
    return board;
  }

  const nextClues: BoardClueDefinition[] = [];
  for (const clue of board.clues) {
    if (clue.rowIndex === rowIndex) {
      continue;
    }
    const nextRow = clue.rowIndex > rowIndex ? clue.rowIndex - 1 : clue.rowIndex;
    nextClues.push({ ...clue, rowIndex: nextRow });
  }

  return {
    ...board,
    rowCount: board.rowCount - 1,
    clues: sortCluesRowMajor(nextClues),
  };
}

function addBoardDefinitionColumn(board: BoardDefinition): BoardDefinition {
  const newColumnIndex = board.columnCount;
  const nextColumnTitles = [...board.columnTitles, `Column ${board.columnCount + 1}`];
  const nextClues: BoardClueDefinition[] = [...board.clues];

  for (let rowIndex = 0; rowIndex < board.rowCount; rowIndex += 1) {
    const rowValue = getBoardDefinitionRowValue(board, rowIndex);
    nextClues.push({
      id: `clue-${rowIndex}-${newColumnIndex}`,
      rowIndex,
      columnIndex: newColumnIndex,
      value: rowValue,
      prompt: "",
      response: "",
    });
  }

  return {
    ...board,
    columnCount: board.columnCount + 1,
    columnTitles: nextColumnTitles,
    clues: sortCluesRowMajor(nextClues),
  };
}

function removeBoardDefinitionColumn(board: BoardDefinition, columnIndex: number): BoardDefinition {
  if (columnIndex < 0 || columnIndex >= board.columnCount || board.columnCount <= 1) {
    return board;
  }

  const nextColumnTitles = board.columnTitles.filter((_, i) => i !== columnIndex);
  const nextClues: BoardClueDefinition[] = [];

  for (const clue of board.clues) {
    if (clue.columnIndex === columnIndex) {
      continue;
    }
    const nextCol = clue.columnIndex > columnIndex ? clue.columnIndex - 1 : clue.columnIndex;
    nextClues.push({ ...clue, columnIndex: nextCol });
  }

  return {
    ...board,
    columnCount: board.columnCount - 1,
    columnTitles: nextColumnTitles,
    clues: sortCluesRowMajor(nextClues),
  };
}

function isCluePreviewFilled(clue: BoardClueDefinition): boolean {
  const questionOk = clue.prompt.trim().length > 0 || clue.questionMedia !== undefined;
  const answerOk = clue.response.trim().length > 0 || clue.answerMedia !== undefined;
  return questionOk && answerOk;
}

function cloneBoardDefinition(board: BoardDefinition): BoardDefinition {
  return {
    ...board,
    clues: board.clues.map((clue) => ({
      ...clue,
      ...(clue.questionMedia !== undefined ? { questionMedia: { ...clue.questionMedia } } : {}),
      ...(clue.answerMedia !== undefined ? { answerMedia: { ...clue.answerMedia } } : {}),
    })),
  };
}

/** Single entry for editor UI: deep clone + row value synchronization. */
function normalizeBoardEditorBoard(board: BoardDefinition): BoardDefinition {
  return normalizeBoardDefinitionRows(cloneBoardDefinition(board));
}

export {
  addBoardDefinitionColumn,
  addBoardDefinitionRow,
  getBoardDefinitionRowValue,
  isCluePreviewFilled,
  normalizeBoardDefinitionRows,
  normalizeBoardEditorBoard,
  removeBoardDefinitionColumn,
  removeBoardDefinitionRow,
  setBoardDefinitionRowValue,
};
