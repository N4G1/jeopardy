<script lang="ts">
  import type { BoardClueView } from "src/realtime/messages";

  type Props = {
    title?: string;
    rowCount: number;
    columnCount: number;
    columnTitles: string[];
    clues: BoardClueView[];
    onClueSelect?: (clueId: string) => void;
  };

  let { title, rowCount, columnCount, columnTitles, clues, onClueSelect }: Props = $props();

  function selectClue(clue: BoardClueView): void {
    if (clue.isAnswered || onClueSelect === undefined) {
      return;
    }

    onClueSelect(clue.id);
  }
</script>

<section class="board">
  <div class="board__frame">
    <div
      class="board__columns"
      style:grid-template-columns={`repeat(${columnCount}, minmax(0, 1fr))`}
    >
      {#each columnTitles as columnTitle}
        <div class="board__column-title">
          <span>{columnTitle}</span>
        </div>
      {/each}
    </div>

    <div
      class="board__grid"
      style:grid-template-columns={`repeat(${columnCount}, minmax(0, 1fr))`}
    >
      {#each clues as clue (clue.id)}
        <button
          type="button"
          class:board__cell--answered={clue.isAnswered}
          class:board__cell--last-column={clue.columnIndex === columnCount - 1}
          class="board__cell"
          disabled={clue.isAnswered}
          onclick={() => selectClue(clue)}
        >
          {#if !clue.isAnswered}
            <span class="board__value">${clue.value}</span>
          {/if}
        </button>
      {/each}
    </div>

    {#if title !== undefined}
      <div class="board__title-strip">{title}</div>
    {/if}
  </div>
</section>

<style>
  .board {
    width: 100%;
  }

  .board__frame {
    --gameplay-tile-font-size: clamp(1.9rem, 3vw, 2.6rem);
  }

  .board__frame {
    border: 2px solid #0f2d52;
    background: #275f97;
  }

  .board__columns {
    display: grid;
    background: #f2dea0;
  }

  .board__column-title {
    min-height: 6.5rem;
    box-sizing: border-box;
    border-right: 2px solid #0f2d52;
    color: #101828;
    padding: 1rem 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-size: var(--gameplay-tile-font-size);
    font-weight: 800;
    text-wrap: balance;
  }

  .board__column-title:last-child {
    border-right: none;
  }

  .board__grid {
    display: grid;
  }

  .board__cell {
    min-height: 5.4rem;
    border: none;
    border-top: 2px solid #0f2d52;
    border-right: 2px solid #0f2d52;
    background: #275f97;
    color: #efff54;
    padding: 0.75rem 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .board__cell--last-column {
    border-right: none;
  }

  .board__cell--answered {
    background: #275f97;
    cursor: not-allowed;
  }

  .board__value {
    font-size: var(--gameplay-tile-font-size);
    font-weight: 900;
    text-decoration: underline;
    text-underline-offset: 0.18em;
  }

  .board__title-strip {
    border-top: 2px solid #0f2d52;
    padding: 1rem;
    color: #efff54;
    text-align: center;
    font-size: var(--gameplay-tile-font-size);
    font-weight: 900;
    text-decoration: underline;
    text-underline-offset: 0.18em;
  }
</style>
