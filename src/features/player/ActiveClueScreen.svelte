<script lang="ts">
  import { onDestroy } from "svelte";

  import type { ActiveClueView } from "src/realtime/messages";

  type Props = {
    clue: ActiveClueView;
    canBuzz: boolean;
    onBuzz: () => void;
    buttonLabel?: string;
    isSuccessState?: boolean;
    statusMessage?: string;
  };

  let {
    clue,
    canBuzz,
    onBuzz,
    buttonLabel = "Buzz in",
    isSuccessState = false,
    statusMessage,
  }: Props = $props();

  function handleBuzz(): void {
    if (!canBuzz) {
      return;
    }

    onBuzz();
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === " " || event.code === "Space") {
      event.preventDefault();
      handleBuzz();
    }
  }

  window.addEventListener("keydown", handleKeydown);

  onDestroy(() => {
    window.removeEventListener("keydown", handleKeydown);
  });
</script>

<section class="clue-screen">
  <h2 class="clue-screen__title">{clue.columnTitle} - ${clue.value}</h2>
  <div class="clue-screen__split">
    <section class="clue-screen__panel">
      <h3 class="clue-screen__panel-title">Question</h3>
      <p class="clue-screen__text">{clue.prompt}</p>
      <div class="clue-screen__media-slot">
        {#if clue.questionMedia?.kind === "image"}
          <img
            alt={clue.questionMedia.altText ?? clue.questionMedia.fileName}
            class="clue-screen__image"
            src={clue.questionMedia.url}
          />
        {:else if clue.questionMedia?.kind === "audio"}
          <audio class="clue-screen__media" controls src={clue.questionMedia.url}></audio>
        {:else if clue.questionMedia?.kind === "video"}
          <!-- svelte-ignore a11y_media_has_caption -->
          <video class="clue-screen__media" controls src={clue.questionMedia.url}></video>
        {/if}
      </div>
    </section>

    <section class="clue-screen__panel clue-screen__panel--answer">
      <h3 class="clue-screen__panel-title">Answer</h3>
      {#if clue.answerRevealed}
        <div class="clue-screen__answer-content">
          <p class="clue-screen__text">{clue.response ?? ""}</p>
          <div class="clue-screen__media-slot">
            {#if clue.answerMedia?.kind === "image"}
              <img
                alt={clue.answerMedia.altText ?? clue.answerMedia.fileName}
                class="clue-screen__image"
                src={clue.answerMedia.url}
              />
            {:else if clue.answerMedia?.kind === "audio"}
              <audio class="clue-screen__media" controls src={clue.answerMedia.url}></audio>
            {:else if clue.answerMedia?.kind === "video"}
              <!-- svelte-ignore a11y_media_has_caption -->
              <video class="clue-screen__media" controls src={clue.answerMedia.url}></video>
            {/if}
          </div>
        </div>
      {:else}
        <div aria-hidden="true" class="clue-screen__answer-content hidden-answer">
          <p class="clue-screen__text"></p>
          <div class="clue-screen__media-slot"></div>
        </div>
      {/if}
    </section>
  </div>

  <button
    type="button"
    class="clue-screen__button"
    class:clue-screen__button--success={isSuccessState}
    disabled={!canBuzz}
    onclick={handleBuzz}
  >
    {buttonLabel}
  </button>

  {#if statusMessage !== undefined}
    <p class="clue-screen__status">{statusMessage}</p>
  {/if}
</section>

<style>
  .clue-screen {
    --gameplay-tile-font-size: clamp(1.9rem, 3vw, 2.6rem);
    display: grid;
    gap: 1rem;
    border: 2px solid #0f2d52;
    padding: 1.25rem 1.5rem;
    background: #d7c898;
    color: #f8fafc;
  }

  .clue-screen__title {
    margin: 0;
    font-size: var(--gameplay-tile-font-size);
    line-height: 1.1;
  }

  .clue-screen__split {
    display: grid;
    gap: 1.5rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .clue-screen__panel {
    min-width: 0;
    display: grid;
    align-content: start;
    gap: 1rem;
  }

  .clue-screen__panel-title {
    margin: 0;
    font-size: 1rem;
    line-height: 1.15;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .clue-screen__text {
    margin: 0;
    min-height: 6rem;
    font-size: var(--gameplay-tile-font-size);
    line-height: 1.15;
  }

  .clue-screen__answer-content {
    display: grid;
    gap: 1rem;
  }

  .hidden-answer {
    visibility: hidden;
  }

  .clue-screen__media-slot {
    min-height: 18rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .clue-screen__image {
    max-width: min(100%, 42rem);
    max-height: 22rem;
    border-radius: 0;
  }

  .clue-screen__media {
    max-width: min(100%, 42rem);
    max-height: 22rem;
  }

  .clue-screen__button {
    border: 2px solid #7f1d1d;
    border-radius: 0.75rem;
    background: #dc2626;
    color: #fff7ed;
    padding: 1rem 1.25rem;
    font: inherit;
    font-size: 1.15rem;
    font-weight: 700;
    cursor: pointer;
    border-radius: 0;
  }

  .clue-screen__button--success {
    background: #16a34a;
    color: #f0fdf4;
    border-color: #166534;
  }

  .clue-screen__button:disabled {
    background: #6b7280;
    border-color: #475569;
    cursor: not-allowed;
  }

  .clue-screen__button--success:disabled {
    background: #16a34a;
    border-color: #166534;
  }

  .clue-screen__status {
    margin: 0;
  }

  @media (max-width: 900px) {
    .clue-screen__split {
      grid-template-columns: 1fr;
    }
  }
</style>
