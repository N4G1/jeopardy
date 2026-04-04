<script lang="ts">
  import type { Snippet } from "svelte";
  import type { ClueMedia } from "src/features/setup/boardSchema";

  type Props = {
    title: string;
    questionText: string;
    questionMedia?: ClueMedia;
    answerText?: string;
    answerMedia?: ClueMedia;
    answerVisible: boolean;
    preserveAnswerSpace?: boolean;
    footer?: Snippet;
  };

  let {
    title,
    questionText,
    questionMedia,
    answerText = "",
    answerMedia,
    answerVisible,
    preserveAnswerSpace = true,
    footer,
  }: Props = $props();
</script>

<section class="clue-shared" style="height: 100vh; height: 100dvh; overflow: hidden;">
  <h2 class="clue-shared__title">{title}</h2>

  <div class="clue-shared__grid">
    <h3 class="clue-shared__label">Question</h3>
    <h3 class="clue-shared__label" class:clue-shared--hidden={!answerVisible && preserveAnswerSpace}>Answer</h3>

    <p class="clue-shared__text">{questionText}</p>
    {#if answerVisible}
      <p class="clue-shared__text">{answerText}</p>
    {:else}
      <p class="clue-shared__text clue-shared--hidden" aria-hidden="true"></p>
    {/if}

    <div class="clue-shared__media-slot">
      {#if questionMedia?.kind === "image"}
        <img
          alt={questionMedia.altText ?? questionMedia.fileName}
          class="clue-shared__image"
          src={questionMedia.url}
        />
      {:else if questionMedia?.kind === "audio"}
        <audio class="clue-shared__media" controls src={questionMedia.url}></audio>
      {:else if questionMedia?.kind === "video"}
        <!-- svelte-ignore a11y_media_has_caption -->
        <video class="clue-shared__media" controls src={questionMedia.url}></video>
      {/if}
    </div>

    {#if answerVisible}
      <div class="clue-shared__media-slot">
        {#if answerMedia?.kind === "image"}
          <img
            alt={answerMedia.altText ?? answerMedia.fileName}
            class="clue-shared__image"
            src={answerMedia.url}
          />
        {:else if answerMedia?.kind === "audio"}
          <audio class="clue-shared__media" controls src={answerMedia.url}></audio>
        {:else if answerMedia?.kind === "video"}
          <!-- svelte-ignore a11y_media_has_caption -->
          <video class="clue-shared__media" controls src={answerMedia.url}></video>
        {/if}
      </div>
    {:else if preserveAnswerSpace}
      <div class="clue-shared__media-slot clue-shared--hidden" aria-hidden="true"></div>
    {/if}
  </div>

  <div class="clue-shared__footer">
    {@render footer?.()}
  </div>
</section>

<style>
  .clue-shared {
    --gameplay-tile-font-size: clamp(1.9rem, 3vw, 2.6rem);
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: 1rem;
    border: 2px solid #0f2d52;
    padding: 1.25rem 1.5rem;
    background: #d7c898;
    color: #f8fafc;
    box-sizing: border-box;
  }

  .clue-shared__title {
    margin: 0;
    font-size: var(--gameplay-tile-font-size);
    line-height: 1.1;
  }

  .clue-shared__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto 1fr;
    gap: 0.5rem 1.5rem;
    min-height: 0;
  }

  .clue-shared__label {
    margin: 0;
    font-size: 1rem;
    line-height: 1.15;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .clue-shared__text {
    margin: 0;
    font-size: var(--gameplay-tile-font-size);
    line-height: 1.15;
    min-height: 1.15em;
  }

  .clue-shared--hidden {
    visibility: hidden;
  }

  .clue-shared__media-slot {
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .clue-shared__image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 0;
  }

  video.clue-shared__media {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  audio.clue-shared__media {
    width: 100%;
    min-height: 2.5rem;
  }

  .clue-shared__footer:empty {
    display: none;
  }

  @media (max-width: 900px) {
    .clue-shared__grid {
      grid-template-columns: 1fr;
    }
  }
</style>
