<script lang="ts">
  import { onDestroy } from "svelte";

  import ClueSplitScreen from "src/features/shared/ClueSplitScreen.svelte";
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

<ClueSplitScreen
  answerMedia={clue.answerMedia}
  answerText={clue.response ?? ""}
  answerVisible={clue.answerRevealed}
  questionMedia={clue.questionMedia}
  questionText={clue.prompt}
  title={`${clue.columnTitle} - $${clue.value}`}
>
  {#snippet footer()}
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
  {/snippet}
</ClueSplitScreen>

<style>
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
    width: stretch;
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
