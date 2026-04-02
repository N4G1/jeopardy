<script lang="ts">
  import { onDestroy } from "svelte";

  import type { GameSessionView, ServerToClientMessage } from "src/realtime/messages";
  import { createBoardDefinition, type BoardDefinition } from "src/features/setup/boardSchema";
  import BoardEditor from "src/features/setup/BoardEditor.svelte";
  import GameBoard from "src/features/shared/GameBoard.svelte";
  import Scoreboard from "src/features/shared/Scoreboard.svelte";

  let boardDefinition = $state(createBoardDefinition());
  let connectionStatus = $state<"disconnected" | "connecting" | "connected">("disconnected");
  let errorMessage = $state("");
  let sessionView = $state<GameSessionView | undefined>(undefined);

  let hostSocket: WebSocket | undefined;

  const joinUrl = $derived.by(() => {
    if (sessionView === undefined) {
      return "";
    }

    return `${window.location.origin}/#/join?code=${sessionView.joinCode}`;
  });

  function updateBoardDefinition(nextBoardDefinition: BoardDefinition): void {
    boardDefinition = nextBoardDefinition;
  }

  function startSession(): void {
    errorMessage = "";
    connectionStatus = "connecting";

    hostSocket?.close();
    hostSocket = new WebSocket(getServerWebSocketUrl());

    hostSocket.addEventListener("open", () => {
      connectionStatus = "connected";
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
      connectionStatus = "disconnected";
    });
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
  });
</script>

<section class="screen">
  <header class="screen__header">
    <div>
      <h1>Host game</h1>
      <p>Create the board, start the session, and control clue flow from here.</p>
    </div>

    <div class="screen__actions">
      <span class="status">Status: {connectionStatus}</span>
      <button type="button" onclick={startSession}>Start session</button>
    </div>
  </header>

  {#if errorMessage.length > 0}
    <p class="error">{errorMessage}</p>
  {/if}

  {#if sessionView === undefined}
    <BoardEditor {boardDefinition} onBoardChange={updateBoardDefinition} />
  {:else}
    <div class="screen__live">
      <section class="panel">
        <h2>{sessionView.title}</h2>
        <p>Join link: {joinUrl}</p>
      </section>

      <GameBoard
        title="Main board"
        rowCount={sessionView.rowCount}
        columnCount={sessionView.columnCount}
        clues={sessionView.clues}
        onClueSelect={openClue}
      />

      <section class="panel">
        <h2>Active clue</h2>

        {#if sessionView.activeClue === undefined}
          <p>No clue is open right now.</p>
        {:else}
          <p><strong>Value:</strong> ${sessionView.activeClue.value}</p>
          <p>{sessionView.activeClue.prompt}</p>

          {#if sessionView.activeClue.media?.kind === "image"}
            <img
              alt={sessionView.activeClue.media.altText ?? sessionView.activeClue.media.fileName}
              class="active-clue__image"
              src={sessionView.activeClue.media.url}
            />
          {/if}

          {#if sessionView.buzzWinnerPlayerId !== undefined}
            <div class="judge-actions">
              <button type="button" onclick={() => judgeAnswer(true)}>Mark correct</button>
              <button type="button" onclick={() => judgeAnswer(false)}>Mark incorrect</button>
            </div>
          {:else}
            <p>Waiting for a player to buzz in.</p>
          {/if}
        {/if}
      </section>

      <Scoreboard players={sessionView.players} />
    </div>
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

  .panel {
    border: 1px solid #374151;
    border-radius: 1rem;
    padding: 1rem 1.25rem;
    background: #111827;
  }

  .judge-actions {
    display: flex;
    gap: 0.75rem;
  }

  .active-clue__image {
    max-width: 100%;
    border-radius: 1rem;
  }

  .status {
    color: #cbd5e1;
  }

  .error {
    color: #fca5a5;
  }

  button {
    border: none;
    border-radius: 0.75rem;
    background: #2563eb;
    color: #eff6ff;
    padding: 0.75rem 1rem;
    cursor: pointer;
  }
</style>
