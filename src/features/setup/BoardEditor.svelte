<script lang="ts">
  import {
    createBoardDefinition,
    resizeBoardDefinition,
    type BoardDefinition,
  } from "./boardSchema";
  import { isSupportedImageFile, readImageFileAsClueMedia } from "../shared/media";

  type Props = {
    boardDefinition?: BoardDefinition;
    onBoardChange?: (boardDefinition: BoardDefinition) => void;
  };

  let {
    boardDefinition = createBoardDefinition(),
    onBoardChange = () => {},
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

  .editor__settings label,
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
    border: 1px solid #374151;
    border-radius: 0.75rem;
    padding: 1rem;
    display: grid;
    gap: 0.75rem;
  }

  input,
  textarea {
    width: 100%;
    box-sizing: border-box;
    border-radius: 0.5rem;
    border: 1px solid #4b5563;
    background: #111827;
    color: inherit;
    padding: 0.625rem 0.75rem;
  }

  textarea {
    min-height: 5rem;
    resize: vertical;
  }
</style>
