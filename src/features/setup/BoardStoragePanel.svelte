<script lang="ts">
  import type { SavedBoardSummary } from "./boardStorage";

  type MaybePromiseVoid = void | Promise<void>;

  type Props = {
    hasDraft: boolean;
    savedBoards: SavedBoardSummary[];
    onSaveBoard: (name: string) => MaybePromiseVoid;
    onLoadBoard: (id: string) => MaybePromiseVoid;
    onDeleteBoard: (id: string) => MaybePromiseVoid;
    onClearDraft: () => MaybePromiseVoid;
    onExportJson: () => void;
    onImportJson: (fileList: FileList | null) => MaybePromiseVoid;
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

<section class="storage-panel" aria-label="Board library">
  <div class="storage-panel__toolbar">
    <label class="storage-panel__field">
      <span class="storage-panel__label">Board name</span>
      <input bind:value={boardName} type="text" autocomplete="off" />
    </label>

    <div class="storage-panel__primary-actions">
      <button type="button" class="storage-panel__btn storage-panel__btn--accent" onclick={saveBoard}>
        Save board
      </button>
      <button type="button" class="storage-panel__btn" onclick={onExportJson}>Export JSON</button>
      <label class="storage-panel__import">
        <span class="storage-panel__label">Import JSON</span>
        <span class="storage-panel__import-trigger">
          Choose file
          <input
            accept="application/json,.json"
            aria-label="Import JSON"
            class="storage-panel__file-input"
            onchange={(event) => onImportJson((event.currentTarget as HTMLInputElement).files)}
            type="file"
          />
        </span>
      </label>
      {#if hasDraft}
        <button type="button" class="storage-panel__btn" onclick={onClearDraft}>Clear draft</button>
      {/if}
    </div>
  </div>

  {#if savedBoards.length > 0}
    <ul class="storage-panel__list">
      {#each savedBoards as savedBoard (savedBoard.id)}
        <li class="storage-panel__list-item">
          <span class="storage-panel__board-name">{savedBoard.name}</span>
          <div class="storage-panel__row-actions">
            <button type="button" class="storage-panel__btn" onclick={() => onLoadBoard(savedBoard.id)} aria-label={`Load ${savedBoard.name}`}>
              Load
            </button>
            <button
              type="button"
              class="storage-panel__btn storage-panel__btn--danger"
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
    gap: 0.85rem;
    border: 2px solid #0f2d52;
    border-radius: 0;
    padding: 0.85rem 0.95rem;
    background: #1e4d7a;
    color: #efff54;
  }

  .storage-panel__toolbar {
    display: grid;
    gap: 0.75rem;
  }

  .storage-panel__field {
    display: grid;
    gap: 0.35rem;
    max-width: 22rem;
  }

  .storage-panel__label {
    font-size: 0.8rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    color: #dbeafe;
  }

  .storage-panel__field input[type="text"] {
    box-sizing: border-box;
    width: 100%;
    border: 2px solid #0f2d52;
    border-radius: 0;
    background: #0f2944;
    color: #efff54;
    padding: 0.5rem 0.65rem;
    font: inherit;
    font-weight: 700;
  }

  .storage-panel__field input[type="text"]:focus {
    outline: 2px solid #facc15;
    outline-offset: 2px;
  }

  .storage-panel__primary-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: flex-end;
  }

  .storage-panel__import {
    display: grid;
    gap: 0.35rem;
    cursor: pointer;
  }

  .storage-panel__import-trigger {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 2.25rem;
    padding: 0.45rem 0.85rem;
    border: 2px solid #0f2d52;
    border-radius: 0;
    background: #0f2944;
    color: #efff54;
    font: inherit;
    font-weight: 700;
    font-size: 0.9rem;
    overflow: hidden;
  }

  .storage-panel__import:focus-within .storage-panel__import-trigger {
    outline: 2px solid #facc15;
    outline-offset: 2px;
  }

  .storage-panel__file-input {
    position: absolute;
    inset: 0;
    margin: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    font-size: 0;
  }

  .storage-panel__list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.45rem;
  }

  .storage-panel__list-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    padding: 0.55rem 0.65rem;
    border: 2px solid #0f2d52;
    border-radius: 0;
    background: #0f2944;
    color: #efff54;
  }

  .storage-panel__board-name {
    font-weight: 800;
    color: #f8fafc;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .storage-panel__row-actions {
    display: flex;
    flex-shrink: 0;
    gap: 0.35rem;
  }

  .storage-panel__btn {
    border: 2px solid #0f2d52;
    border-radius: 0;
    background: #275f97;
    color: #efff54;
    padding: 0.4rem 0.75rem;
    cursor: pointer;
    font: inherit;
    font-weight: 800;
    font-size: 0.85rem;
  }

  .storage-panel__btn:focus-visible {
    outline: 2px solid #facc15;
    outline-offset: 2px;
  }

  .storage-panel__btn--accent {
    background: #15803d;
    color: #f0fdf4;
  }

  .storage-panel__btn--danger {
    background: #7f1d1d;
    color: #fecaca;
  }

  .storage-panel__btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
</style>
