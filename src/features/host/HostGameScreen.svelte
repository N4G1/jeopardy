<script lang="ts">
  import { onDestroy } from "svelte";

  import type { GameSessionView, ServerToClientMessage } from "src/realtime/messages";
  import { buildJoinUrl } from "src/app/navigation";
  import { createBoardDefinition, type BoardDefinition } from "src/features/setup/boardSchema";
  import { copyTextToClipboard } from "src/features/shared/clipboard";
  import BoardEditor from "src/features/setup/BoardEditor.svelte";
  import EndScreen from "src/features/shared/EndScreen.svelte";
  import GameBoard from "src/features/shared/GameBoard.svelte";
  import Scoreboard from "src/features/shared/Scoreboard.svelte";
  import { canEnterGameBoard, getHostScreenStep } from "./hostScreenState";

  let boardDefinition = $state(createBoardDefinition());
  let errorMessage = $state("");
  let joinLinkCopyMessage = $state("");
  let sessionView = $state<GameSessionView | undefined>(undefined);
  let joinLinkCopyMessageTimeout: ReturnType<typeof setTimeout> | undefined;

  let hostSocket: WebSocket | undefined;
  const hostScreenStep = $derived(getHostScreenStep(sessionView));
  const canOpenGameBoard = $derived(canEnterGameBoard(sessionView));
  const isGameplayStep = $derived(
    hostScreenStep === "board" || hostScreenStep === "clue" || hostScreenStep === "end",
  );
  const buzzWinnerDisplayName = $derived.by(() => {
    if (sessionView?.buzzWinnerPlayerId === undefined) {
      return undefined;
    }

    return sessionView.players.find((player) => player.id === sessionView.buzzWinnerPlayerId)?.displayName;
  });

  const joinUrl = $derived.by(() => {
    if (sessionView === undefined) {
      return "";
    }

    return buildJoinUrl(window.location.origin, sessionView.joinCode);
  });

  function updateBoardDefinition(nextBoardDefinition: BoardDefinition): void {
    boardDefinition = nextBoardDefinition;
  }

  function startSession(): void {
    errorMessage = "";
    joinLinkCopyMessage = "";

    hostSocket?.close();
    hostSocket = new WebSocket(getServerWebSocketUrl());

    hostSocket.addEventListener("open", () => {
      sendMessage({
        type: "host:create-session",
        board: boardDefinition,
      });
    });

    hostSocket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data) as ServerToClientMessage;

      if (message.type === "session:state") {
        sessionView = message.session;
        return;
      }

      if (message.type === "error") {
        errorMessage = message.message;
      }
    });

    hostSocket.addEventListener("close", () => {
    });
  }

  function startGame(): void {
    if (!canOpenGameBoard) {
      errorMessage = "At least one player must join before the game can start.";
      return;
    }

    errorMessage = "";
    sendMessage({
      type: "host:return-to-board",
    });
  }

  async function copyJoinLink(): Promise<void> {
    if (joinUrl.length === 0) {
      return;
    }

    try {
      await copyTextToClipboard(joinUrl);
      joinLinkCopyMessage = "Join link copied.";
      clearTimeout(joinLinkCopyMessageTimeout);
      joinLinkCopyMessageTimeout = setTimeout(() => {
        joinLinkCopyMessage = "";
      }, 3000);
    } catch {
      errorMessage = "Could not copy the join link.";
    }
  }

  function openClue(clueId: string): void {
    sendMessage({
      type: "host:open-clue",
      clueId,
    });
  }

  function judgeAnswer(wasCorrect: boolean): void {
    if (sessionView?.buzzWinnerPlayerId === undefined) {
      return;
    }

    sendMessage({
      type: "host:judge-answer",
      playerId: sessionView.buzzWinnerPlayerId,
      wasCorrect,
    });
  }

  function rebound(): void {
    if (sessionView?.buzzWinnerPlayerId === undefined) {
      return;
    }

    sendMessage({
      type: "host:rebound",
      playerId: sessionView.buzzWinnerPlayerId,
    });
  }

  function sendMessage(message: object): void {
    if (hostSocket?.readyState !== WebSocket.OPEN) {
      errorMessage = "Server connection is not ready.";
      return;
    }

    hostSocket.send(JSON.stringify(message));
  }

  function getServerWebSocketUrl(): string {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.hostname}:3001`;
  }

  onDestroy(() => {
    hostSocket?.close();
    clearTimeout(joinLinkCopyMessageTimeout);
  });
</script>

<section class:screen--gameplay={isGameplayStep} class="screen">
  {#if errorMessage.length > 0}
    <p class="error">{errorMessage}</p>
  {/if}

  {#if hostScreenStep === "editor"}
    <header class="screen__header">
      <div>
        <h1>Host game</h1>
        <p>Create the board, then start the session.</p>
      </div>

      <div class="screen__actions">
        <button type="button" onclick={startSession}>Create Lobby</button>
      </div>
    </header>

    <BoardEditor {boardDefinition} onBoardChange={updateBoardDefinition} />
  {:else if hostScreenStep === "lobby" && sessionView !== undefined}
    <div class="screen__live">
      <section class="panel panel--lobby">
        <h1>{sessionView.title}</h1>
        <p>Share this join link before starting the game.</p>
        <button type="button" class="panel__copy-link" onclick={copyJoinLink}>{joinUrl}</button>
        {#if joinLinkCopyMessage.length > 0}
          <p class="panel__success">{joinLinkCopyMessage}</p>
        {/if}
        {#if !canOpenGameBoard}
          <p class="panel__notice">At least one player must join before the game can start.</p>
        {/if}
        <div class="screen__actions screen__actions--inline">
          <button type="button" disabled={!canOpenGameBoard} onclick={startGame}>
            Start Game
          </button>
        </div>
      </section>

      <Scoreboard
        players={sessionView.players}
        title="Players joined"
        emptyMessage="No players have joined yet."
      />
    </div>
  {:else if hostScreenStep === "board" && sessionView !== undefined}
    <div class:screen__live--gameplay={isGameplayStep} class="screen__live">
      <GameBoard
        title={sessionView.title}
        rowCount={sessionView.rowCount}
        columnCount={sessionView.columnCount}
        columnTitles={sessionView.columnTitles}
        clues={sessionView.clues}
        onClueSelect={openClue}
      />
      <Scoreboard players={sessionView.players} variant="strip" />
    </div>
  {:else if hostScreenStep === "clue" && sessionView?.activeClue !== undefined}
    <div class:screen__live--gameplay={isGameplayStep} class="screen__live">
      <section class="active-clue">
        <h2 class="active-clue__title">
          {sessionView.activeClue.columnTitle} - ${sessionView.activeClue.value}
        </h2>
        <p class="active-clue__prompt">{sessionView.activeClue.prompt}</p>

        <div class="active-clue__content">
          {#if sessionView.activeClue.media?.kind === "image"}
            <img
              alt={sessionView.activeClue.media.altText ?? sessionView.activeClue.media.fileName}
              class="active-clue__image"
              src={sessionView.activeClue.media.url}
            />
          {/if}
        </div>

        {#if sessionView.buzzWinnerPlayerId !== undefined}
          <p class="panel__buzzed-player">
            <strong>Buzzed player:</strong> {buzzWinnerDisplayName ?? "Unknown player"}
          </p>
          <div class="judge-actions">
            <button type="button" onclick={() => judgeAnswer(true)}>Mark correct</button>
            <button type="button" onclick={() => judgeAnswer(false)}>Mark incorrect</button>
            <button type="button" onclick={rebound}>Rebound</button>
          </div>
        {:else}
          <p>Waiting for a player to buzz in.</p>
        {/if}
      </section>
    </div>
  {:else if hostScreenStep === "end" && sessionView !== undefined}
    <EndScreen players={sessionView.players} title={sessionView.title} />
  {/if}
</section>

<style>
  .screen {
    max-width: 80rem;
    margin: 0 auto;
    padding: 2rem;
    display: grid;
    gap: 1.5rem;
  }

  .screen--gameplay {
    max-width: none;
    min-height: 100vh;
    padding: 0;
    gap: 0;
    align-content: start;
  }

  .screen__header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
  }

  .screen__actions {
    display: grid;
    gap: 0.75rem;
    justify-items: end;
  }

  .screen__live {
    display: grid;
    gap: 1.5rem;
  }

  .screen__live--gameplay {
    gap: 0;
    align-content: start;
  }

  .panel {
    border: 1px solid #475569;
    border-radius: 1rem;
    padding: 1rem 1.25rem;
    background: #0f172a;
    box-shadow: 0 12px 32px rgb(15 23 42 / 0.28);
  }

  .panel--lobby {
    max-width: 44rem;
  }

  .judge-actions {
    display: flex;
    gap: 0;
    flex-wrap: wrap;
  }

  .panel__notice {
    color: #fcd34d;
  }

  .panel__success {
    color: #86efac;
    margin: 0;
  }

  .panel__buzzed-player {
    margin: 0;
    padding: 0.45rem 0.65rem;
    background: #f8fafc;
    color: #111827;
    font-size: 1.1rem;
    font-weight: 700;
  }

  .active-clue {
    --gameplay-tile-font-size: clamp(1.9rem, 3vw, 2.6rem);
    display: grid;
    gap: 1rem;
    border: 2px solid #0f2d52;
    padding: 1.25rem 1.5rem;
    background: #d7c898;
    color: #f8fafc;
  }

  .active-clue__title {
    margin: 0;
    font-size: var(--gameplay-tile-font-size);
    line-height: 1.1;
  }

  .active-clue__prompt {
    margin: 0;
    font-size: var(--gameplay-tile-font-size);
    line-height: 1.15;
    text-align: center;
  }

  .active-clue__content {
    min-height: 18rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .active-clue__image {
    max-width: min(100%, 42rem);
    max-height: 22rem;
    border-radius: 0;
  }

  .screen__actions--inline {
    justify-items: start;
  }

  .error {
    color: #fca5a5;
  }

  button {
    border: 2px solid #1d4ed8;
    border-radius: 0;
    background: #2563eb;
    color: #eff6ff;
    padding: 0.45rem 0.8rem;
    font: inherit;
    font-size: 0.95rem;
    font-weight: 700;
    line-height: 1.1;
    cursor: pointer;
  }

  button:disabled {
    background: #475569;
    border-color: #334155;
    color: #cbd5e1;
    cursor: not-allowed;
  }

  .judge-actions button {
    border-color: #1f2937;
    background: #f8fafc;
    color: #101828;
  }

  .judge-actions button + button {
    border-left: none;
  }

  .panel__copy-link {
    width: 100%;
    border: 1px solid #334155;
    border-radius: 0;
    padding: 0.85rem 1rem;
    background: #020617;
    color: #bfdbfe;
    word-break: break-all;
    text-align: left;
    font: inherit;
  }
</style>
