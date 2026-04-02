<script lang="ts">
  import type { BoardClueView } from "src/realtime/messages";

  type Props = {
    title?: string;
    rowCount: number;
    columnCount: number;
    clues: BoardClueView[];
    onClueSelect?: (clueId: string) => void;
  };

  let { title, rowCount, columnCount, clues, onClueSelect }: Props = $props();

  function selectClue(clue: BoardClueView): void {
    if (clue.isAnswered || onClueSelect === undefined) {
      return;
    }

    onClueSelect(clue.id);
  }
</script>

<section class="board">
  {#if title !== undefined}
    <h2>{title}</h2>
  {/if}

  <div
    class="board__grid"
    style:grid-template-columns={`repeat(${columnCount}, minmax(0, 1fr))`}
  >
    {#each clues as clue (clue.id)}
      <button
        type="button"
        class:board__cell--answered={clue.isAnswered}
        class="board__cell"
        disabled={clue.isAnswered}
        onclick={() => selectClue(clue)}
      >
        <span class="board__value">${clue.value}</span>
        <span class="board__position">R{clue.rowIndex + 1} C{clue.columnIndex + 1}</span>
      </button>
    {/each}
  </div>
</section>

<style>
  .board {
    display: grid;
    gap: 1rem;
  }

  .board__grid {
    display: grid;
    gap: 0.75rem;
  }

  .board__cell {
    min-height: 6rem;
    border: 1px solid #2563eb;
    border-radius: 0.75rem;
    background: #1d4ed8;
    color: #eff6ff;
    padding: 0.75rem;
    display: grid;
    gap: 0.5rem;
    justify-items: center;
    align-content: center;
    cursor: pointer;
  }

  .board__cell--answered {
    border-color: #6b7280;
    background: #4b5563;
    color: #d1d5db;
    cursor: not-allowed;
  }

  .board__value {
    font-size: 1.5rem;
    font-weight: 700;
  }

  .board__position {
    font-size: 0.8rem;
  }
</style>
