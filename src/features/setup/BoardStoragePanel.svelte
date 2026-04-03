<script lang="ts">
  import type { SavedBoardSummary } from "./boardStorage";

  type Props = {
    hasDraft: boolean;
    savedBoards: SavedBoardSummary[];
    onSaveBoard: (name: string) => void;
    onLoadBoard: (id: string) => void;
    onDeleteBoard: (id: string) => void;
    onClearDraft: () => void;
    onExportJson: () => void;
    onImportJson: (fileList: FileList | null) => void;
  };

  let {
    hasDraft,
    savedBoards,
    onSaveBoard,
    onLoadBoard,
    onDeleteBoard,
    onClearDraft,
    onExportJson,
    onImportJson,
  }: Props = $props();

  let boardName = $state("");

  function saveBoard(): void {
    onSaveBoard(boardName);
  }
</script>

<section class="storage-panel">
  <div class="storage-panel__row">
    <label>
      <span>Board name</span>
      <input bind:value={boardName} type="text" />
    </label>

    <button type="button" onclick={saveBoard}>Save board</button>
    <button type="button" onclick={onExportJson}>Export JSON</button>
    <label class="storage-panel__import">
      <span>Import JSON</span>
      <input accept="application/json,.json" onchange={(event) => onImportJson((event.currentTarget as HTMLInputElement).files)} type="file" />
    </label>
    {#if hasDraft}
      <button type="button" onclick={onClearDraft}>Clear draft</button>
    {/if}
  </div>

  {#if savedBoards.length > 0}
    <ul class="storage-panel__list">
      {#each savedBoards as savedBoard (savedBoard.id)}
        <li>
          <span>{savedBoard.name}</span>
          <div class="storage-panel__actions">
            <button type="button" onclick={() => onLoadBoard(savedBoard.id)} aria-label={`Load ${savedBoard.name}`}>
              Load
            </button>
            <button
              type="button"
              onclick={() => onDeleteBoard(savedBoard.id)}
              aria-label={`Delete ${savedBoard.name}`}
            >
              Delete
            </button>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .storage-panel {
    display: grid;
    gap: 1rem;
    border: 1px solid #475569;
    padding: 1rem;
    background: #111827;
  }

  .storage-panel__row {
    display: flex;
    gap: 0.75rem;
    align-items: end;
    flex-wrap: wrap;
  }

  .storage-panel label {
    display: grid;
    gap: 0.35rem;
  }

  .storage-panel__import input,
  .storage-panel input[type="text"] {
    box-sizing: border-box;
    border: 1px solid #94a3b8;
    background: #020617;
    color: inherit;
    padding: 0.625rem 0.75rem;
    font: inherit;
  }

  .storage-panel__list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.5rem;
  }

  .storage-panel__list li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border: 1px solid #334155;
    background: #0f172a;
  }

  .storage-panel__actions {
    display: flex;
    gap: 0.5rem;
  }

  button {
    border: 1px solid #60a5fa;
    background: #0f172a;
    color: #bfdbfe;
    padding: 0.65rem 0.95rem;
    cursor: pointer;
    font: inherit;
  }
</style>
