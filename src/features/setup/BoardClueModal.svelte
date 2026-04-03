<script lang="ts" module>
  import type { ClueMedia } from "./boardSchema";

  export type BoardClueModalDraft = {
    prompt: string;
    response: string;
    questionImage?: ClueMedia;
    answerImage?: ClueMedia;
  };
</script>

<script lang="ts">
  import { tick } from "svelte";

  import { isSupportedImageFile, readImageFileAsClueMedia } from "../shared/media";

  type Props = {
    isOpen: boolean;
    draftClue: BoardClueModalDraft;
    onSave: (draft: BoardClueModalDraft) => void;
    onClose: () => void;
  };

  let { isOpen, draftClue, onSave, onClose }: Props = $props();

  let localDraft = $state<BoardClueModalDraft>({
    prompt: "",
    response: "",
  });
  let imageError = $state("");
  let pendingImageReads = $state(0);
  let modalEpoch = 0;
  let dialogPanelEl = $state<HTMLDivElement | null>(null);

  $effect(() => {
    if (!isOpen) {
      return;
    }

    modalEpoch += 1;

    localDraft = {
      prompt: draftClue.prompt,
      response: draftClue.response,
      questionImage: draftClue.questionImage,
      answerImage: draftClue.answerImage,
    };
    imageError = "";

    void tick().then(() => {
      dialogPanelEl?.focus();
    });
  });

  function handleCancel(): void {
    onClose();
  }

  function handleSave(): void {
    if (pendingImageReads > 0) {
      return;
    }

    onSave({
      prompt: localDraft.prompt,
      response: localDraft.response,
      questionImage: localDraft.questionImage,
      answerImage: localDraft.answerImage,
    });
    onClose();
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (!isOpen) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      handleCancel();
    }
  }

  async function handleQuestionImageChange(fileList: FileList | null): Promise<void> {
    const file = fileList?.[0];
    const epoch = modalEpoch;

    if (file === undefined) {
      localDraft = { ...localDraft, questionImage: undefined };
      imageError = "";
      return;
    }

    if (!isSupportedImageFile(file)) {
      imageError = "Only PNG, JPEG, GIF, and WebP images are supported.";
      return;
    }

    imageError = "";
    pendingImageReads += 1;

    try {
      const media = await readImageFileAsClueMedia(file);

      if (epoch !== modalEpoch) {
        return;
      }

      localDraft = { ...localDraft, questionImage: media };
    } catch {
      if (epoch === modalEpoch) {
        imageError = "Failed to read the image.";
      }
    } finally {
      pendingImageReads -= 1;
    }
  }

  async function handleAnswerImageChange(fileList: FileList | null): Promise<void> {
    const file = fileList?.[0];
    const epoch = modalEpoch;

    if (file === undefined) {
      localDraft = { ...localDraft, answerImage: undefined };
      imageError = "";
      return;
    }

    if (!isSupportedImageFile(file)) {
      imageError = "Only PNG, JPEG, GIF, and WebP images are supported.";
      return;
    }

    imageError = "";
    pendingImageReads += 1;

    try {
      const media = await readImageFileAsClueMedia(file);

      if (epoch !== modalEpoch) {
        return;
      }

      localDraft = { ...localDraft, answerImage: media };
    } catch {
      if (epoch === modalEpoch) {
        imageError = "Failed to read the image.";
      }
    } finally {
      pendingImageReads -= 1;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <div class="board-clue-modal">
    <button type="button" class="board-clue-modal__backdrop" aria-label="Close modal" onclick={handleCancel}></button>

    <div
      bind:this={dialogPanelEl}
      class="board-clue-modal__panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="board-clue-modal-title"
      tabindex="-1"
    >
      <h2 id="board-clue-modal-title" class="board-clue-modal__title">Edit clue</h2>

      <label class="board-clue-modal__field">
        <span>Question text</span>
        <textarea bind:value={localDraft.prompt} rows="3"></textarea>
      </label>

      <label class="board-clue-modal__field">
        <span>Answer text</span>
        <textarea bind:value={localDraft.response} rows="3"></textarea>
      </label>

      <div class="board-clue-modal__field">
        <span id="question-image-label">Question image (optional)</span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          aria-labelledby="question-image-label"
          onchange={(event) => void handleQuestionImageChange((event.currentTarget as HTMLInputElement).files)}
        />
        {#if localDraft.questionImage}
          <img
            class="board-clue-modal__preview"
            src={localDraft.questionImage.url}
            alt={localDraft.questionImage.fileName}
          />
        {/if}
      </div>

      <div class="board-clue-modal__field">
        <span id="answer-image-label">Answer image (optional)</span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          aria-labelledby="answer-image-label"
          onchange={(event) => void handleAnswerImageChange((event.currentTarget as HTMLInputElement).files)}
        />
        {#if localDraft.answerImage}
          <img
            class="board-clue-modal__preview"
            src={localDraft.answerImage.url}
            alt={localDraft.answerImage.fileName}
          />
        {/if}
      </div>

      {#if imageError}
        <p class="board-clue-modal__error" role="alert">{imageError}</p>
      {/if}

      <div class="board-clue-modal__actions">
        <button type="button" onclick={handleCancel}>Cancel</button>
        <button type="button" disabled={pendingImageReads > 0} onclick={handleSave}>Save</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .board-clue-modal {
    position: fixed;
    inset: 0;
    z-index: 40;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .board-clue-modal__backdrop {
    position: absolute;
    inset: 0;
    margin: 0;
    padding: 0;
    border: none;
    background: rgba(15, 23, 42, 0.75);
    cursor: pointer;
  }

  .board-clue-modal__panel {
    position: relative;
    z-index: 1;
    width: min(32rem, 100%);
    max-height: min(90vh, 100%);
    overflow: auto;
    display: grid;
    gap: 1rem;
    padding: 1.25rem;
    border: 1px solid #475569;
    background: #111827;
    color: #e2e8f0;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  }

  .board-clue-modal__title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
  }

  .board-clue-modal__field {
    display: grid;
    gap: 0.35rem;
    font-size: 0.875rem;
  }

  .board-clue-modal__field span {
    color: #cbd5e1;
  }

  .board-clue-modal__field textarea {
    font: inherit;
    padding: 0.5rem;
    border: 1px solid #475569;
    border-radius: 2px;
    background: #0f172a;
    color: inherit;
    resize: vertical;
  }

  .board-clue-modal__field input[type="file"] {
    font: inherit;
    color: inherit;
  }

  .board-clue-modal__preview {
    width: 6rem;
    height: 6rem;
    object-fit: cover;
    border: 1px solid #475569;
    border-radius: 2px;
  }

  .board-clue-modal__error {
    margin: 0;
    font-size: 0.875rem;
    color: #fca5a5;
  }

  .board-clue-modal__actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    margin-top: 0.25rem;
  }

  .board-clue-modal__actions button {
    font: inherit;
    padding: 0.45rem 0.9rem;
    border: 1px solid #475569;
    border-radius: 2px;
    background: #1e293b;
    color: inherit;
    cursor: pointer;
  }

  .board-clue-modal__actions button:hover {
    background: #334155;
  }

  .board-clue-modal__actions button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .board-clue-modal__actions button:disabled:hover {
    background: #1e293b;
  }
</style>
