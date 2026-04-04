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

  import { isSupportedClueMediaFile, readFileAsClueMedia } from "../shared/media";

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
  let mediaError = $state("");
  let pendingMediaReads = $state(0);
  let modalEpoch = 0;
  let dialogPanelEl = $state<HTMLDivElement | null>(null);
  const mediaInputAccept =
    "image/png,image/jpeg,image/gif,image/webp,audio/mpeg,audio/mp4,audio/ogg,audio/wav,audio/webm,video/mp4,video/ogg,video/quicktime,video/webm";

  function previewTitle(media: ClueMedia): string {
    return media.fileName;
  }

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
    mediaError = "";

    void tick().then(() => {
      dialogPanelEl?.focus();
    });
  });

  function handleCancel(): void {
    onClose();
  }

  function handleSave(): void {
    if (pendingMediaReads > 0) {
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
      mediaError = "";
      return;
    }

    if (!isSupportedClueMediaFile(file)) {
      mediaError = "Only supported image, audio, and video files are allowed.";
      return;
    }

    mediaError = "";
    pendingMediaReads += 1;

    try {
      const media = await readFileAsClueMedia(file);

      if (epoch !== modalEpoch) {
        return;
      }

      localDraft = { ...localDraft, questionImage: media };
    } catch {
      if (epoch === modalEpoch) {
        mediaError = "Failed to read the media.";
      }
    } finally {
      pendingMediaReads -= 1;
    }
  }

  async function handleAnswerImageChange(fileList: FileList | null): Promise<void> {
    const file = fileList?.[0];
    const epoch = modalEpoch;

    if (file === undefined) {
      localDraft = { ...localDraft, answerImage: undefined };
      mediaError = "";
      return;
    }

    if (!isSupportedClueMediaFile(file)) {
      mediaError = "Only supported image, audio, and video files are allowed.";
      return;
    }

    mediaError = "";
    pendingMediaReads += 1;

    try {
      const media = await readFileAsClueMedia(file);

      if (epoch !== modalEpoch) {
        return;
      }

      localDraft = { ...localDraft, answerImage: media };
    } catch {
      if (epoch === modalEpoch) {
        mediaError = "Failed to read the media.";
      }
    } finally {
      pendingMediaReads -= 1;
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

      <div class="board-clue-modal__columns">
        <section class="board-clue-modal__pane" aria-label="Question pane">
          <h3 class="board-clue-modal__pane-title">Question</h3>

          <label class="board-clue-modal__field">
            <span>Question text</span>
            <textarea bind:value={localDraft.prompt} rows="10"></textarea>
          </label>

          <div class="board-clue-modal__field">
            <span id="question-image-label">Question media (optional)</span>
            <input
              type="file"
              accept={mediaInputAccept}
              aria-labelledby="question-image-label"
              onchange={(event) =>
                void handleQuestionImageChange((event.currentTarget as HTMLInputElement).files)}
            />
            <p class="board-clue-modal__hint">
              Supported: PNG, JPG/JPEG, GIF, WebP, MP3, M4A, OGG, WAV, WEBM, MP4, MOV, OGV.
              Requires a browser-detected supported MIME type.
            </p>
            {#if localDraft.questionImage}
              <div class="board-clue-modal__preview-wrap">
                <p class="board-clue-modal__preview-title">{previewTitle(localDraft.questionImage)}</p>
                {#if localDraft.questionImage.kind === "image"}
                  <img
                    class="board-clue-modal__preview"
                    src={localDraft.questionImage.url}
                    alt={localDraft.questionImage.fileName}
                  />
                {:else if localDraft.questionImage.kind === "audio"}
                  <audio
                    class="board-clue-modal__media-preview"
                    controls
                    src={localDraft.questionImage.url}
                  ></audio>
                {:else if localDraft.questionImage.kind === "video"}
                  <!-- svelte-ignore a11y_media_has_caption -->
                  <video
                    class="board-clue-modal__media-preview"
                    controls
                    src={localDraft.questionImage.url}
                  ></video>
                {/if}
              </div>
            {/if}
          </div>
        </section>

        <section class="board-clue-modal__pane" aria-label="Answer pane">
          <h3 class="board-clue-modal__pane-title">Answer</h3>

          <label class="board-clue-modal__field">
            <span>Answer text</span>
            <textarea bind:value={localDraft.response} rows="10"></textarea>
          </label>

          <div class="board-clue-modal__field">
            <span id="answer-image-label">Answer media (optional)</span>
            <input
              type="file"
              accept={mediaInputAccept}
              aria-labelledby="answer-image-label"
              onchange={(event) =>
                void handleAnswerImageChange((event.currentTarget as HTMLInputElement).files)}
            />
            <p class="board-clue-modal__hint">
              Supported: PNG, JPG/JPEG, GIF, WebP, MP3, M4A, OGG, WAV, WEBM, MP4, MOV, OGV.
              Requires a browser-detected supported MIME type.
            </p>
            {#if localDraft.answerImage}
              <div class="board-clue-modal__preview-wrap">
                <p class="board-clue-modal__preview-title">{previewTitle(localDraft.answerImage)}</p>
                {#if localDraft.answerImage.kind === "image"}
                  <img
                    class="board-clue-modal__preview"
                    src={localDraft.answerImage.url}
                    alt={localDraft.answerImage.fileName}
                  />
                {:else if localDraft.answerImage.kind === "audio"}
                  <audio
                    class="board-clue-modal__media-preview"
                    controls
                    src={localDraft.answerImage.url}
                  ></audio>
                {:else if localDraft.answerImage.kind === "video"}
                  <!-- svelte-ignore a11y_media_has_caption -->
                  <video
                    class="board-clue-modal__media-preview"
                    controls
                    src={localDraft.answerImage.url}
                  ></video>
                {/if}
              </div>
            {/if}
          </div>
        </section>
      </div>

      {#if mediaError}
        <p class="board-clue-modal__error" role="alert">{mediaError}</p>
      {/if}

      <div class="board-clue-modal__actions">
        <button type="button" onclick={handleCancel}>Cancel</button>
        <button type="button" disabled={pendingMediaReads > 0} onclick={handleSave}>Save</button>
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
    width: min(64rem, 100%);
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

  .board-clue-modal__columns {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }

  .board-clue-modal__pane {
    display: grid;
    align-content: start;
    gap: 0.85rem;
    min-width: 0;
  }

  .board-clue-modal__pane-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: #f8fafc;
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
    min-height: 4rem;
    height: 5rem;
  }

  .board-clue-modal__field input[type="file"] {
    font: inherit;
    color: inherit;
  }

  .board-clue-modal__preview {
    width: 100%;
    max-height: 18rem;
    object-fit: contain;
    border: 1px solid #475569;
    border-radius: 2px;
  }

  .board-clue-modal__media-preview {
    width: 100%;
    max-height: 18rem;
    border: 1px solid #475569;
    border-radius: 2px;
    background: #020617;
  }

  .board-clue-modal__preview-wrap {
    display: grid;
    gap: 0.5rem;
  }

  .board-clue-modal__preview-title {
    margin: 0;
    font-size: 0.8rem;
    color: #94a3b8;
    word-break: break-word;
  }

  .board-clue-modal__hint {
    margin: 0;
    font-size: 0.78rem;
    line-height: 1.35;
    color: #94a3b8;
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

  @media (max-width: 900px) {
    .board-clue-modal__columns {
      grid-template-columns: 1fr;
    }
  }
</style>
