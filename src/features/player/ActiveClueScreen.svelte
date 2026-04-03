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
  <p class="clue-screen__prompt">{clue.prompt}</p>

  <div class="clue-screen__content">
    {#if clue.media?.kind === "image"}
      <img
        alt={clue.media.altText ?? clue.media.fileName}
        class="clue-screen__image"
        src={clue.media.url}
      />
    {/if}
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

  .clue-screen__prompt {
    margin: 0;
    font-size: var(--gameplay-tile-font-size);
    line-height: 1.15;
    text-align: center;
  }

  .clue-screen__content {
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
</style>
