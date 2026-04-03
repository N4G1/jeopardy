<script lang="ts">
  import {
    createBoardDefinition,
    fillBoardDefinitionWithSampleContent,
    resizeBoardDefinition,
    type BoardDefinition,
  } from "./boardSchema";
  import { isSupportedImageFile, readImageFileAsClueMedia } from "../shared/media";

  type Props = {
    boardDefinition?: BoardDefinition;
    onBoardChange?: (boardDefinition: BoardDefinition) => void;
    showDevAutofill?: boolean;
  };

  let {
    boardDefinition = createBoardDefinition(),
    onBoardChange = () => {},
    showDevAutofill = import.meta.env.DEV,
  }: Props = $props();

  let editableBoardDefinition = $state(createBoardDefinition());
  let mediaErrorMessage = $state("");

  $effect(() => {
    editableBoardDefinition = cloneBoardDefinition(boardDefinition);
  });

  function updateTitle(title: string): void {
    editableBoardDefinition = {
      ...editableBoardDefinition,
      title,
    };
    onBoardChange(editableBoardDefinition);
  }

  function updateBoardSize(nextRowCount: number, nextColumnCount: number): void {
    editableBoardDefinition = resizeBoardDefinition(
      editableBoardDefinition,
      nextRowCount,
      nextColumnCount,
    );
    onBoardChange(editableBoardDefinition);
  }

  function updateColumnTitle(columnIndex: number, title: string): void {
    editableBoardDefinition = {
      ...editableBoardDefinition,
      columnTitles: editableBoardDefinition.columnTitles.map((columnTitle, index) =>
        index === columnIndex ? title : columnTitle,
      ),
    };
    onBoardChange(editableBoardDefinition);
  }

  function fillSampleBoard(): void {
    editableBoardDefinition = fillBoardDefinitionWithSampleContent(editableBoardDefinition);
    onBoardChange(editableBoardDefinition);
  }

  function updateClue(
    clueIndex: number,
    field: "value" | "prompt" | "response",
    nextValue: BoardDefinition["clues"][number][typeof field],
  ): void {
    editableBoardDefinition = {
      ...editableBoardDefinition,
      clues: editableBoardDefinition.clues.map((clue, index) =>
        index === clueIndex ? { ...clue, [field]: nextValue } : clue,
      ),
    };
    onBoardChange(editableBoardDefinition);
  }

  async function updateClueImage(clueIndex: number, fileList: FileList | null): Promise<void> {
    const file = fileList?.[0];

    if (file === undefined) {
      editableBoardDefinition = {
        ...editableBoardDefinition,
        clues: editableBoardDefinition.clues.map((clue, index) =>
          index === clueIndex ? { ...clue, media: undefined } : clue,
        ),
      };
      onBoardChange(editableBoardDefinition);
      return;
    }

    if (!isSupportedImageFile(file)) {
      mediaErrorMessage = "Only PNG, JPEG, GIF, and WebP images are supported.";
      return;
    }

    mediaErrorMessage = "";

    const media = await readImageFileAsClueMedia(file);

    editableBoardDefinition = {
      ...editableBoardDefinition,
      clues: editableBoardDefinition.clues.map((clue, index) =>
        index === clueIndex ? { ...clue, media } : clue,
      ),
    };
    onBoardChange(editableBoardDefinition);
  }

  function cloneBoardDefinition(sourceBoardDefinition: BoardDefinition): BoardDefinition {
    return {
      ...sourceBoardDefinition,
      clues: sourceBoardDefinition.clues.map((clue) => ({
        ...clue,
        ...(clue.media !== undefined ? { media: { ...clue.media } } : {}),
      })),
    };
  }
</script>

<section class="editor">
  <div class="editor__settings">
    <label>
      <span>Game title</span>
      <input
        type="text"
        value={editableBoardDefinition.title}
        oninput={(event) => updateTitle((event.currentTarget as HTMLInputElement).value)}
      />
    </label>

    <label>
      <span>Rows</span>
      <input
        type="number"
        min="1"
        value={editableBoardDefinition.rowCount}
        oninput={(event) =>
          updateBoardSize(
            Number((event.currentTarget as HTMLInputElement).value),
            editableBoardDefinition.columnCount,
          )}
      />
    </label>

    <label>
      <span>Columns</span>
      <input
        type="number"
        min="1"
        value={editableBoardDefinition.columnCount}
        oninput={(event) =>
          updateBoardSize(
            editableBoardDefinition.rowCount,
            Number((event.currentTarget as HTMLInputElement).value),
          )}
      />
    </label>
  </div>

  <div class="editor__settings">
    {#each editableBoardDefinition.columnTitles as columnTitle, columnIndex}
      <label>
        <span>Column title {columnIndex + 1}</span>
        <input
          type="text"
          value={columnTitle}
          oninput={(event) =>
            updateColumnTitle(columnIndex, (event.currentTarget as HTMLInputElement).value)}
        />
      </label>
    {/each}
  </div>

  {#if showDevAutofill}
    <div class="editor__actions">
      <button type="button" onclick={fillSampleBoard}>Fill sample board</button>
    </div>
  {/if}

  <div class="editor__clues">
    {#each editableBoardDefinition.clues as clue, clueIndex (clue.id)}
      <fieldset class="editor__clue">
        <legend>Clue {clue.rowIndex + 1},{clue.columnIndex + 1}</legend>

        <label>
          <span>Value</span>
          <input
            type="number"
            min="0"
            value={clue.value}
            oninput={(event) =>
              updateClue(clueIndex, "value", Number((event.currentTarget as HTMLInputElement).value))}
          />
        </label>

        <label>
          <span>Question text {clue.rowIndex + 1}-{clue.columnIndex + 1}</span>
          <textarea
            value={clue.prompt}
            oninput={(event) =>
              updateClue(clueIndex, "prompt", (event.currentTarget as HTMLTextAreaElement).value)}
          ></textarea>
        </label>

        <label>
          <span>Answer text {clue.rowIndex + 1}-{clue.columnIndex + 1}</span>
          <textarea
            value={clue.response}
            oninput={(event) =>
              updateClue(clueIndex, "response", (event.currentTarget as HTMLTextAreaElement).value)}
          ></textarea>
        </label>

        <label>
          <span>Image</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            onchange={(event) =>
              updateClueImage(clueIndex, (event.currentTarget as HTMLInputElement).files)}
          />
        </label>

        {#if clue.media?.kind === "image"}
          <img alt={clue.media.altText ?? clue.media.fileName} class="editor__preview" src={clue.media.url} />
        {/if}
      </fieldset>
    {/each}
  </div>

  {#if mediaErrorMessage.length > 0}
    <p class="editor__error">{mediaErrorMessage}</p>
  {/if}
</section>

<style>
  .editor {
    display: grid;
    gap: 1.5rem;
  }

  .editor__settings {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  }

  .editor__actions {
    display: flex;
    justify-content: flex-start;
  }

  .editor__settings label {
    display: grid;
    gap: 0.35rem;
    border: 1px solid #475569;
    border-radius: 0.85rem;
    background: #0f172a;
    padding: 0.9rem 1rem;
    box-shadow: 0 10px 24px rgb(15 23 42 / 0.18);
  }

  .editor__clue label {
    display: grid;
    gap: 0.35rem;
  }

  .editor__clues {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  }

  .editor__preview {
    max-width: 100%;
    border-radius: 0.75rem;
  }

  .editor__error {
    color: #fca5a5;
    margin: 0;
  }

  .editor__clue {
    border: 1px solid #64748b;
    border-radius: 0.9rem;
    padding: 1rem;
    display: grid;
    gap: 0.75rem;
    background: #0f172a;
    box-shadow: 0 10px 24px rgb(15 23 42 / 0.22);
  }

  legend {
    padding: 0 0.35rem;
    color: #bfdbfe;
    font-weight: 600;
  }

  input,
  textarea {
    width: 100%;
    box-sizing: border-box;
    border-radius: 0.5rem;
    border: 1px solid #94a3b8;
    background: #020617;
    color: inherit;
    padding: 0.625rem 0.75rem;
  }

  button {
    border: 1px solid #60a5fa;
    background: #0f172a;
    color: #bfdbfe;
    padding: 0.65rem 0.95rem;
    cursor: pointer;
    font: inherit;
  }

  input:focus,
  textarea:focus {
    outline: 2px solid #60a5fa;
    outline-offset: 1px;
    border-color: #60a5fa;
  }

  textarea {
    min-height: 5rem;
    resize: vertical;
  }
</style>
