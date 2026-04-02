<script lang="ts">
  import { onDestroy } from "svelte";

  import type { GameSessionView, ScoreboardPlayer, ServerToClientMessage } from "src/realtime/messages";
  import { createRealtimeClient } from "src/realtime/client";
  import ActiveClueScreen from "./ActiveClueScreen.svelte";
  import GameBoard from "../shared/GameBoard.svelte";
  import Scoreboard from "../shared/Scoreboard.svelte";

  let connectionStatus = $state<"connecting" | "connected" | "disconnected">("connecting");
  let errorMessage = $state("");
  let sessionView = $state<GameSessionView | undefined>(undefined);

  const playerName = getHashSearchParam("name");
  const joinCode = getHashSearchParam("code");

  const realtimeClient = createRealtimeClient({
    url: getServerWebSocketUrl(),
    onOpen: () => {
      connectionStatus = "connected";
      realtimeClient.send({
        type: "player:join",
        displayName: playerName,
      });
    },
    onClose: () => {
      connectionStatus = "disconnected";
    },
    onError: (message) => {
      errorMessage = message;
    },
    onMessage: (message: ServerToClientMessage) => {
      if (message.type === "session:state") {
        sessionView = message.session;
        return;
      }

      if (message.type === "error") {
        errorMessage = message.message;
      }
    },
  });

  if (typeof window !== "undefined" && playerName.length > 0) {
    realtimeClient.connect();
  } else {
    connectionStatus = "disconnected";
    errorMessage = "A player name is required before joining the live board.";
  }

  const currentPlayer = $derived.by<ScoreboardPlayer | undefined>(() =>
    sessionView?.players.find((player) => player.displayName === playerName),
  );

  const buzzStatusMessage = $derived.by(() => {
    if (sessionView?.buzzWinnerPlayerId === undefined) {
      return undefined;
    }

    const buzzWinner = sessionView.players.find(
      (player) => player.id === sessionView.buzzWinnerPlayerId,
    );

    return buzzWinner === undefined
      ? "A player buzzed first."
      : `${buzzWinner.displayName} buzzed first.`;
  });

  function buzzIn(): void {
    realtimeClient.send({
      type: "player:buzz",
    });
  }

  onDestroy(() => {
    realtimeClient.disconnect();
  });

  function getServerWebSocketUrl(): string {
    if (typeof window === "undefined") {
      return "ws://localhost:3001";
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.hostname}:3001`;
  }

  function getHashSearchParam(key: string): string {
    if (typeof window === "undefined") {
      return "";
    }

    const query = window.location.hash.split("?")[1] ?? "";
    return new URLSearchParams(query).get(key) ?? "";
  }
</script>

<section class="screen">
  <header class="screen__header">
    <div>
      <h1>Player screen</h1>
      <p>
        {#if joinCode.length > 0}
          Joined game code: {joinCode}
        {:else}
          Waiting for game details
        {/if}
      </p>
    </div>
    <span>Status: {connectionStatus}</span>
  </header>

  {#if errorMessage.length > 0}
    <p class="error">{errorMessage}</p>
  {/if}

  {#if sessionView === undefined}
    <p>Waiting for the host session to start.</p>
  {:else}
    {#if sessionView.activeClue === undefined || currentPlayer === undefined}
      <GameBoard
        title={sessionView.title}
        rowCount={sessionView.rowCount}
        columnCount={sessionView.columnCount}
        clues={sessionView.clues}
      />
    {:else}
      <ActiveClueScreen
        clue={sessionView.activeClue}
        score={currentPlayer.score}
        canBuzz={sessionView.buzzWinnerPlayerId === undefined}
        onBuzz={buzzIn}
        statusMessage={buzzStatusMessage}
      />
    {/if}

    <Scoreboard players={sessionView.players} />
  {/if}
</section>

<style>
  .screen {
    max-width: 72rem;
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

  .error {
    color: #fca5a5;
  }
</style>
