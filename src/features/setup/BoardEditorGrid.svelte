<script lang="ts">
  import { getBoardDefinitionRowValue, isCluePreviewFilled } from "./boardEditorState";
  import {
    createBoardDefinition,
    type BoardClueDefinition,
    type BoardDefinition,
  } from "./boardSchema";

  type Props = {
    boardDefinition?: BoardDefinition;
    onTitleChange?: (title: string) => void;
    onColumnTitleChange?: (columnIndex: number, title: string) => void;
    onRowValueChange?: (rowIndex: number, value: number) => void;
    onClueSelect?: (clueId: string) => void;
    onAddRow?: () => void;
    onDeleteRow?: () => void;
    onAddColumn?: () => void;
    onDeleteColumn?: () => void;
    disableRowDelete?: boolean;
    disableColumnDelete?: boolean;
    /** When true, stretch the blue shell to the viewport (standalone editor). Host composition should use false. */
    fullBleedBlue?: boolean;
  };

  let {
    boardDefinition = createBoardDefinition(),
    onTitleChange = () => {},
    onColumnTitleChange = () => {},
    onRowValueChange = () => {},
    onClueSelect = () => {},
    onAddRow = () => {},
    onDeleteRow = () => {},
    onAddColumn = () => {},
    onDeleteColumn = () => {},
    disableRowDelete: disableRowDeleteProp = false,
    disableColumnDelete: disableColumnDeleteProp = false,
    fullBleedBlue = true,
  }: Props = $props();

  const rowDeleteDisabled = $derived(
    boardDefinition.rowCount <= 1 || disableRowDeleteProp,
  );
  const columnDeleteDisabled = $derived(
    boardDefinition.columnCount <= 1 || disableColumnDeleteProp,
  );

  function clueAt(rowIndex: number, columnIndex: number) {
    return boardDefinition.clues.find(
      (c) => c.rowIndex === rowIndex && c.columnIndex === columnIndex,
    );
  }

  function rowValueForInput(rowIndex: number): number {
    return getBoardDefinitionRowValue(boardDefinition, rowIndex);
  }

  function tryEmitRowValueChange(rowIndex: number, raw: string): void {
    const trimmed = raw.trim();
    if (trimmed === "") {
      return;
    }
    const next = Number(trimmed);
    if (!Number.isInteger(next) || next <= 0) {
      return;
    }
    onRowValueChange(rowIndex, next);
  }

  let hoveredClueId = $state<string | null>(null);
  let focusedClueId = $state<string | null>(null);
  let touchRevealById = $state<Record<string, boolean>>({});
  let lastCluePointerType = "";

  const CLUE_ARIA_LABEL_MAX_CHARS = 200;

  function truncateClueAriaPreviewSegment(text: string, maxChars: number): string {
    const t = text.trim();
    if (t.length === 0) {
      return t;
    }
    if (t.length <= maxChars) {
      return t;
    }
    return `${t.slice(0, Math.max(0, maxChars - 1))}…`;
  }

  function limitAriaLabelLength(label: string): string {
    if (label.length <= CLUE_ARIA_LABEL_MAX_CHARS) {
      return label;
    }
    return `${label.slice(0, CLUE_ARIA_LABEL_MAX_CHARS - 1)}…`;
  }

  function clueQuestionA11y(clue: BoardClueDefinition): string {
    const text = clue.prompt.trim();
    if (text.length > 0) {
      return text;
    }
    if (clue.questionMedia !== undefined) {
      return clue.questionMedia.altText?.trim() || "Image question";
    }
    return "";
  }

  function clueAnswerA11y(clue: BoardClueDefinition): string {
    const text = clue.response.trim();
    if (text.length > 0) {
      return text;
    }
    if (clue.answerMedia !== undefined) {
      return clue.answerMedia.altText?.trim() || "Image answer";
    }
    return "";
  }

  function clueAriaLabel(
    clue: BoardClueDefinition,
    rowIndex: number,
    columnIndex: number,
    rowPoints: number,
    filled: boolean,
    showAnswer: boolean,
  ): string {
    const base = `Clue row ${rowIndex + 1}, column ${columnIndex + 1}`;
    if (!filled) {
      return limitAriaLabelLength(`${base}. Point value ${rowPoints} dollars`);
    }
    const intro = showAnswer
      ? `${base}. Answer preview: `
      : `${base}. Question preview: `;
    const raw = showAnswer ? clueAnswerA11y(clue) : clueQuestionA11y(clue);
    const maxPreview = Math.max(24, CLUE_ARIA_LABEL_MAX_CHARS - intro.length);
    return limitAriaLabelLength(`${intro}${truncateClueAriaPreviewSegment(raw, maxPreview)}`);
  }

  function onCluePointerDown(event: PointerEvent): void {
    lastCluePointerType = event.pointerType || "";
  }

  function handleClueClick(clue: BoardClueDefinition): void {
    const pointerType = lastCluePointerType;
    lastCluePointerType = "";

    if (!isCluePreviewFilled(clue)) {
      onClueSelect(clue.id);
      return;
    }
    if (pointerType === "touch") {
      if (touchRevealById[clue.id] !== true) {
        touchRevealById = { ...touchRevealById, [clue.id]: true };
        return;
      }
      onClueSelect(clue.id);
      const next = { ...touchRevealById };
      delete next[clue.id];
      touchRevealById = next;
      return;
    }
    onClueSelect(clue.id);
  }

  function handleClueKeydown(event: KeyboardEvent, clue: BoardClueDefinition): void {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    onClueSelect(clue.id);
  }

  function onClueBlur(clueId: string): void {
    if (focusedClueId === clueId) {
      focusedClueId = null;
    }
    if (touchRevealById[clueId] === true) {
      const next = { ...touchRevealById };
      delete next[clueId];
      touchRevealById = next;
    }
  }

  let titleBaselineOnFocus = "";

  function handleTitleFocus(): void {
    titleBaselineOnFocus = boardDefinition.title;
  }

  function handleTitleKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      event.preventDefault();
      onTitleChange(titleBaselineOnFocus);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      (event.currentTarget as HTMLInputElement).blur();
    }
  }

  let categoryBaselineOnFocus: Record<number, string> = {};

  function handleCategoryFocus(columnIndex: number): void {
    categoryBaselineOnFocus[columnIndex] =
      boardDefinition.columnTitles[columnIndex] ?? "";
  }

  function handleCategoryKeydown(event: KeyboardEvent, columnIndex: number): void {
    if (event.key === "Escape") {
      event.preventDefault();
      const baseline = categoryBaselineOnFocus[columnIndex] ?? "";
      onColumnTitleChange(columnIndex, baseline);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      (event.currentTarget as HTMLInputElement).blur();
    }
  }
</script>

<section
  class="board-editor-grid board-editor-grid--sharp-chrome"
  class:board-editor-grid--full-bleed-blue={fullBleedBlue}
  class:board-editor-grid--embedded-host={!fullBleedBlue}
  aria-label="Board editor"
>
  <div class="board-editor-grid__title-wrap">
    <input
      type="text"
      class="board-editor-grid__title-input board-editor-grid__tile--sharp"
      value={boardDefinition.title}
      aria-label="Board title"
      onfocus={handleTitleFocus}
      onkeydown={handleTitleKeydown}
      oninput={(event) =>
        onTitleChange((event.currentTarget as HTMLInputElement).value)}
    />
  </div>

  <div
    class="board-editor-grid__frame board-editor-grid__frame--jeopardy-blue board-editor-grid__frame--sharp"
  >
    <div class="board-editor-grid__sheet">
      <div class="board-editor-grid__corner board-editor-grid__tile--sharp" aria-hidden="true"></div>

      <div class="board-editor-grid__category-strip">
        <div
          class="board-editor-grid__category-inputs"
          style:grid-template-columns={`repeat(${boardDefinition.columnCount}, minmax(0, 1fr))`}
        >
          {#each boardDefinition.columnTitles as columnTitle, columnIndex}
            <input
              type="text"
              class="board-editor-grid__category-input board-editor-grid__tile--sharp"
              value={columnTitle}
              aria-label={`Category ${columnIndex + 1} title`}
              onfocus={() => {
                handleCategoryFocus(columnIndex);
              }}
              onkeydown={(event) => {
                handleCategoryKeydown(event, columnIndex);
              }}
              oninput={(event) =>
                onColumnTitleChange(
                  columnIndex,
                  (event.currentTarget as HTMLInputElement).value,
                )}
            />
          {/each}
        </div>

        <div
          class="board-editor-grid__resize board-editor-grid__resize--column board-editor-grid__tile--sharp"
          role="group"
          aria-label="Add or remove board column"
        >
        <button
          type="button"
          class="board-editor-grid__resize-zone board-editor-grid__resize-zone--add"
          aria-label="Add column"
          onclick={() => onAddColumn()}
        >
            <span class="board-editor-grid__resize-label board-editor-grid__resize-label--add">ADD</span>
          </button>
          <button
            type="button"
            class="board-editor-grid__resize-zone board-editor-grid__resize-zone--delete"
            aria-label="Delete column"
            disabled={columnDeleteDisabled}
            onclick={() => {
              if (!columnDeleteDisabled) {
                onDeleteColumn();
              }
            }}
          >
            <span class="board-editor-grid__resize-label board-editor-grid__resize-label--delete"
              >DELETE</span
            >
          </button>
        </div>
      </div>

      {#each Array.from({ length: boardDefinition.rowCount }, (_, rowIndex) => rowIndex) as rowIndex}
        <div class="board-editor-grid__row-value-label board-editor-grid__tile--sharp">
          <input
            type="number"
            class="board-editor-grid__row-value-input"
            min="1"
            step="1"
            value={rowValueForInput(rowIndex)}
            aria-label={`Row ${rowIndex + 1} point value`}
            oninput={(event) =>
              tryEmitRowValueChange(
                rowIndex,
                (event.currentTarget as HTMLInputElement).value,
              )}
          />
        </div>

        <div
          class="board-editor-grid__clue-row"
          style:grid-template-columns={`repeat(${boardDefinition.columnCount}, minmax(0, 1fr))`}
        >
          {#each Array.from(
            { length: boardDefinition.columnCount },
            (_, columnIndex) => columnIndex,
          ) as columnIndex}
            {@const clue = clueAt(rowIndex, columnIndex)}
            {#if clue === undefined}
              <button
                type="button"
                disabled
                class="board-editor-grid__clue-tile board-editor-grid__clue-tile--sharp board-editor-grid__tile--sharp"
                aria-label={`Clue row ${rowIndex + 1}, column ${columnIndex + 1} (unavailable)`}
              ></button>
            {:else}
              {@const rowPoints = getBoardDefinitionRowValue(boardDefinition, rowIndex)}
              {@const filled = isCluePreviewFilled(clue)}
              {@const showAnswer =
                filled &&
                (hoveredClueId === clue.id ||
                  focusedClueId === clue.id ||
                  touchRevealById[clue.id] === true)}
              <button
                type="button"
                class="board-editor-grid__clue-tile board-editor-grid__clue-tile--sharp board-editor-grid__tile--sharp"
                aria-label={clueAriaLabel(
                  clue,
                  rowIndex,
                  columnIndex,
                  rowPoints,
                  filled,
                  showAnswer,
                )}
                onpointerdown={onCluePointerDown}
                onmouseenter={() => {
                  hoveredClueId = clue.id;
                }}
                onmouseleave={() => {
                  if (hoveredClueId === clue.id) {
                    hoveredClueId = null;
                  }
                }}
                onfocus={() => {
                  focusedClueId = clue.id;
                }}
                onblur={() => {
                  onClueBlur(clue.id);
                }}
                onkeydown={(event) => handleClueKeydown(event, clue)}
                onclick={() => handleClueClick(clue)}
              >
                {#if !filled}
                  <span class="board-editor-grid__clue-value">${rowPoints}</span>
                {:else}
                  <span class="board-editor-grid__clue-preview-stack">
                    {#if !showAnswer}
                      <span class="board-editor-grid__clue-face" aria-hidden="true">
                        {#if clue.prompt.trim().length > 0}
                          <span class="board-editor-grid__clue-preview-text">{clue.prompt.trim()}</span>
                        {/if}
                        {#if clue.questionMedia !== undefined}
                          <img
                            class="board-editor-grid__clue-preview-img"
                            src={clue.questionMedia.url}
                            alt={clue.questionMedia.altText?.trim() || ""}
                            draggable="false"
                          />
                        {/if}
                      </span>
                    {:else}
                      <span class="board-editor-grid__clue-face" aria-hidden="true">
                        {#if clue.response.trim().length > 0}
                          <span class="board-editor-grid__clue-preview-text">{clue.response.trim()}</span>
                        {/if}
                        {#if clue.answerMedia !== undefined}
                          <img
                            class="board-editor-grid__clue-preview-img"
                            src={clue.answerMedia.url}
                            alt={clue.answerMedia.altText?.trim() || ""}
                            draggable="false"
                          />
                        {/if}
                      </span>
                    {/if}
                  </span>
                {/if}
              </button>
            {/if}
          {/each}
        </div>
      {/each}

      <div
        class="board-editor-grid__resize board-editor-grid__resize--row board-editor-grid__tile--sharp"
        role="group"
        aria-label="Add or remove board row"
      >
        <button
          type="button"
          class="board-editor-grid__resize-zone board-editor-grid__resize-zone--add"
          aria-label="Add row"
          onclick={() => onAddRow()}
        >
          <span class="board-editor-grid__resize-label board-editor-grid__resize-label--add">ADD</span>
        </button>
        <button
          type="button"
          class="board-editor-grid__resize-zone board-editor-grid__resize-zone--delete"
          aria-label="Delete row"
          disabled={rowDeleteDisabled}
          onclick={() => {
            if (!rowDeleteDisabled) {
              onDeleteRow();
            }
          }}
        >
          <span class="board-editor-grid__resize-label board-editor-grid__resize-label--delete"
            >DELETE</span
          >
        </button>
      </div>

      <div class="board-editor-grid__row-resize-spacer" aria-hidden="true"></div>
    </div>
  </div>
</section>

<style>
  .board-editor-grid {
    box-sizing: border-box;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem 1rem 1.75rem;
    background: #0b2a4a;
    color: #efff54;
  }

  /* Full-viewport blue surround for the host board shell (page padding can still inset the section). */
  .board-editor-grid--full-bleed-blue {
    min-height: 100vh;
    min-height: 100dvh;
    background: linear-gradient(180deg, #0d3460 0%, #0b2a4a 42%, #071826 100%);
  }

  .board-editor-grid--embedded-host {
    padding-bottom: 0.35rem;
  }

  .board-editor-grid--sharp-chrome * {
    border-radius: 0;
  }

  .board-editor-grid__title-wrap {
    width: min(48rem, 100%);
  }

  .board-editor-grid__title-input {
    width: 100%;
    box-sizing: border-box;
    border: 2px solid #0f2d52;
    background: #275f97;
    color: #efff54;
    text-align: center;
    font-size: clamp(1.25rem, 2.5vw, 1.85rem);
    font-weight: 800;
    padding: 0.65rem 0.75rem;
    text-decoration: underline;
    text-underline-offset: 0.15em;
  }

  .board-editor-grid__frame {
    width: min(72rem, 100%);
    box-sizing: border-box;
    border: 3px solid #0f2d52;
    background: #275f97;
  }

  .board-editor-grid__frame--sharp {
    border-radius: 0;
  }

  .board-editor-grid__frame--jeopardy-blue {
    box-shadow: 0 12px 28px rgb(8 20 40 / 0.45);
  }

  .board-editor-grid__sheet {
    display: grid;
    grid-template-columns: minmax(4.25rem, auto) minmax(0, 1fr);
    align-items: stretch;
  }

  .board-editor-grid__corner {
    min-height: 4.5rem;
    border-bottom: 2px solid #0f2d52;
    border-right: 2px solid #0f2d52;
    background: #1e4d7a;
  }

  .board-editor-grid__category-strip {
    display: flex;
    min-height: 4.5rem;
    border-bottom: 2px solid #0f2d52;
    box-sizing: border-box;
  }

  .board-editor-grid__category-inputs {
    flex: 1;
    display: grid;
    min-width: 0;
    background: #f2dea0;
  }

  .board-editor-grid__category-input {
    box-sizing: border-box;
    border: none;
    border-right: 2px solid #0f2d52;
    background: #f2dea0;
    color: #101828;
    font-weight: 800;
    text-align: center;
    font-size: clamp(0.95rem, 1.6vw, 1.25rem);
    padding: 0.5rem 0.35rem;
  }

  .board-editor-grid__category-input:last-of-type {
    border-right: none;
  }

  .board-editor-grid__row-value-label {
    position: relative;
    margin: 0;
    border-bottom: 2px solid #0f2d52;
    border-right: 2px solid #0f2d52;
    background: #1e4d7a;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.35rem;
    min-height: 4.25rem;
  }

  .board-editor-grid__row-value-input {
    width: 100%;
    max-width: 5rem;
    box-sizing: border-box;
    border: 1px solid #0f2d52;
    background: #0f2944;
    color: #efff54;
    font-weight: 800;
    text-align: center;
    font-size: clamp(0.95rem, 1.5vw, 1.2rem);
    padding: 0.35rem 0.25rem;
  }

  .board-editor-grid__clue-row {
    display: grid;
    border-bottom: 2px solid #0f2d52;
    min-height: 4.25rem;
  }

  .board-editor-grid__clue-tile {
    border: none;
    border-right: 2px solid #0f2d52;
    background: #275f97;
    color: #efff54;
    font: inherit;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 4.25rem;
    aspect-ratio: 1;
    max-height: 6.5rem;
  }

  .board-editor-grid__clue-tile:last-child {
    border-right: none;
  }

  .board-editor-grid__clue-value {
    font-size: clamp(1rem, 2vw, 1.5rem);
    font-weight: 900;
    text-decoration: underline;
    text-underline-offset: 0.15em;
  }

  .board-editor-grid__clue-preview-stack {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    min-height: 0;
    min-width: 0;
  }

  .board-editor-grid__clue-face {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    padding: 0.2rem;
    max-width: 100%;
    max-height: 100%;
    box-sizing: border-box;
  }

  .board-editor-grid__clue-preview-text {
    font-size: clamp(0.65rem, 1.2vw, 0.95rem);
    font-weight: 700;
    text-align: center;
    line-height: 1.15;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    text-decoration: none;
  }

  .board-editor-grid__clue-preview-img {
    max-width: 100%;
    max-height: 3rem;
    object-fit: contain;
    display: block;
  }

  .board-editor-grid__resize {
    position: relative;
    width: 3.35rem;
    flex-shrink: 0;
    min-height: 4.5rem;
    border-left: 2px solid #0f2d52;
    background: #0f2944;
  }

  .board-editor-grid__resize--row {
    width: 100%;
    min-height: 3.35rem;
    border-left: none;
    border-top: 2px solid #0f2d52;
    border-right: 2px solid #0f2d52;
  }

  /*
    Each resize control stacks two full-square buttons; clip-path splits them into complementary
    triangles so ADD (top-left) and DELETE (bottom-right) are separate targets with minimal overlap
    along the diagonal only.
  */
  .board-editor-grid__resize-zone {
    position: absolute;
    inset: 0;
    margin: 0;
    padding: 0;
    border: none;
    cursor: pointer;
    font: inherit;
    color: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .board-editor-grid__resize-zone:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  .board-editor-grid__resize-zone--add {
    clip-path: polygon(0 0, 100% 0, 0 100%);
    background: linear-gradient(135deg, #16a34a, #15803d);
    justify-content: flex-start;
    align-items: flex-start;
    padding-top: 0.35rem;
    padding-left: 0.35rem;
  }

  .board-editor-grid__resize-zone--delete {
    clip-path: polygon(100% 0, 100% 100%, 0 100%);
    background: linear-gradient(135deg, #b91c1c, #991b1b);
    justify-content: flex-end;
    align-items: flex-end;
    padding-bottom: 0.35rem;
    padding-right: 0.35rem;
  }

  .board-editor-grid__resize-label {
    font-size: 0.58rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    pointer-events: none;
    line-height: 1;
  }

  .board-editor-grid__resize-label--add {
    transform: rotate(-32deg);
  }

  .board-editor-grid__resize-label--delete {
    transform: rotate(32deg);
  }

  .board-editor-grid__row-resize-spacer {
    grid-column: 2;
    border-top: 2px solid #0f2d52;
    min-height: 0;
  }

  .board-editor-grid__title-input:focus,
  .board-editor-grid__category-input:focus,
  .board-editor-grid__row-value-input:focus,
  .board-editor-grid__clue-tile:focus-visible,
  .board-editor-grid__resize-zone:focus-visible {
    outline: 2px solid #facc15;
    outline-offset: 2px;
    z-index: 1;
  }
</style>
