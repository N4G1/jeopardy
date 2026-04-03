<script lang="ts">
  import BoardClueModal, {
    type BoardClueModalDraft,
  } from "./BoardClueModal.svelte";
  import BoardEditorGrid from "./BoardEditorGrid.svelte";
  import {
    addBoardDefinitionColumn,
    addBoardDefinitionRow,
    normalizeBoardEditorBoard,
    removeBoardDefinitionColumn,
    removeBoardDefinitionRow,
    setBoardDefinitionRowValue,
  } from "./boardEditorState";
  import {
    createBoardDefinition,
    fillBoardDefinitionWithSampleContent,
    type BoardClueDefinition,
    type BoardDefinition,
  } from "./boardSchema";

  type Props = {
    boardDefinition?: BoardDefinition;
    onBoardChange?: (boardDefinition: BoardDefinition) => void;
    showDevAutofill?: boolean;
    fullBleedBlue?: boolean;
  };

  let {
    boardDefinition = createBoardDefinition(),
    onBoardChange = () => {},
    showDevAutofill = import.meta.env.DEV,
    fullBleedBlue = true,
  }: Props = $props();

  let editableBoardDefinition = $state(createBoardDefinition());
  let isModalOpen = $state(false);
  let selectedClueId = $state<string | null>(null);
  let modalDraft = $state<BoardClueModalDraft>({ prompt: "", response: "" });

  $effect(() => {
    editableBoardDefinition = normalizeBoardEditorBoard(boardDefinition);
  });

  function commitBoard(next: BoardDefinition): void {
    editableBoardDefinition = next;
    onBoardChange(next);
  }

  function clueToDraft(clue: BoardClueDefinition): BoardClueModalDraft {
    return {
      prompt: clue.prompt,
      response: clue.response,
      questionImage: clue.questionMedia,
      answerImage: clue.answerMedia,
    };
  }

  function handleTitleChange(title: string): void {
    commitBoard({ ...editableBoardDefinition, title });
  }

  function handleColumnTitleChange(columnIndex: number, title: string): void {
    commitBoard({
      ...editableBoardDefinition,
      columnTitles: editableBoardDefinition.columnTitles.map((t, i) =>
        i === columnIndex ? title : t,
      ),
    });
  }

  function handleRowValueChange(rowIndex: number, value: number): void {
    commitBoard(
      setBoardDefinitionRowValue(editableBoardDefinition, rowIndex, value),
    );
  }

  function handleAddRow(): void {
    commitBoard(addBoardDefinitionRow(editableBoardDefinition));
  }

  function handleDeleteRow(): void {
    const last = editableBoardDefinition.rowCount - 1;
    commitBoard(
      normalizeBoardEditorBoard(
        removeBoardDefinitionRow(editableBoardDefinition, last),
      ),
    );
  }

  function handleAddColumn(): void {
    commitBoard(addBoardDefinitionColumn(editableBoardDefinition));
  }

  function handleDeleteColumn(): void {
    const last = editableBoardDefinition.columnCount - 1;
    commitBoard(
      normalizeBoardEditorBoard(
        removeBoardDefinitionColumn(editableBoardDefinition, last),
      ),
    );
  }

  function handleClueSelect(clueId: string): void {
    const clue = editableBoardDefinition.clues.find((c) => c.id === clueId);
    if (clue === undefined) {
      return;
    }
    selectedClueId = clueId;
    modalDraft = clueToDraft(clue);
    isModalOpen = true;
  }

  function closeClueModal(): void {
    isModalOpen = false;
    selectedClueId = null;
  }

  function handleModalSave(draft: BoardClueModalDraft): void {
    if (selectedClueId === null) {
      return;
    }
    const clueId = selectedClueId;
    commitBoard({
      ...editableBoardDefinition,
      clues: editableBoardDefinition.clues.map((c) => {
        if (c.id !== clueId) {
          return c;
        }
        const { questionMedia: _qm, answerMedia: _am, ...rest } = c;
        return {
          ...rest,
          prompt: draft.prompt,
          response: draft.response,
          ...(draft.questionImage !== undefined
            ? { questionMedia: draft.questionImage }
            : {}),
          ...(draft.answerImage !== undefined ? { answerMedia: draft.answerImage } : {}),
        };
      }),
    });
  }

  function fillSampleBoard(): void {
    commitBoard(
      normalizeBoardEditorBoard(
        fillBoardDefinitionWithSampleContent(editableBoardDefinition),
      ),
    );
  }
</script>

<div class="board-editor">
  {#if showDevAutofill}
    <div class="board-editor__dev-actions">
      <button type="button" onclick={fillSampleBoard}>Fill sample board</button>
    </div>
  {/if}

  <BoardEditorGrid
    {fullBleedBlue}
    boardDefinition={editableBoardDefinition}
    onTitleChange={handleTitleChange}
    onColumnTitleChange={handleColumnTitleChange}
    onRowValueChange={handleRowValueChange}
    onClueSelect={handleClueSelect}
    onAddRow={handleAddRow}
    onDeleteRow={handleDeleteRow}
    onAddColumn={handleAddColumn}
    onDeleteColumn={handleDeleteColumn}
  />

  <BoardClueModal
    isOpen={isModalOpen}
    draftClue={modalDraft}
    onSave={handleModalSave}
    onClose={closeClueModal}
  />
</div>

<style>
  .board-editor {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .board-editor__dev-actions {
    display: flex;
    justify-content: flex-start;
    padding: 0 1rem;
  }

  .board-editor__dev-actions button {
    border: 1px solid #60a5fa;
    background: #0f172a;
    color: #bfdbfe;
    padding: 0.65rem 0.95rem;
    cursor: pointer;
    font: inherit;
  }
</style>
