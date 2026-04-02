<script lang="ts">
  import { onDestroy } from "svelte";

  import type { ActiveClueView } from "src/realtime/messages";

  type Props = {
    clue: ActiveClueView;
    score: number;
    canBuzz: boolean;
    onBuzz: () => void;
    statusMessage?: string;
  };

  let { clue, score, canBuzz, onBuzz, statusMessage }: Props = $props();

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
  <p class="clue-screen__score">Your score: {score}</p>
  <p class="clue-screen__value">This clue is worth ${clue.value}</p>
  <h2>{clue.prompt}</h2>

  {#if clue.media?.kind === "image"}
    <img alt={clue.media.altText ?? clue.media.fileName} class="clue-screen__image" src={clue.media.url} />
  {/if}

  <button type="button" disabled={!canBuzz} onclick={handleBuzz}>Buzz in</button>

  {#if statusMessage !== undefined}
    <p class="clue-screen__status">{statusMessage}</p>
  {/if}
</section>

<style>
  .clue-screen {
    display: grid;
    gap: 1rem;
    border: 1px solid #374151;
    border-radius: 1rem;
    padding: 1.5rem;
    background: #111827;
  }

  .clue-screen__score,
  .clue-screen__value,
  .clue-screen__status {
    margin: 0;
  }

  .clue-screen__image {
    max-width: 100%;
    border-radius: 1rem;
  }

  button {
    border: none;
    border-radius: 0.75rem;
    background: #dc2626;
    color: #fff7ed;
    padding: 1rem 1.25rem;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
  }

  button:disabled {
    background: #6b7280;
    cursor: not-allowed;
  }
</style>
