<script lang="ts">
  import { onDestroy } from "svelte";

  import type { GameSessionView, ScoreboardPlayer, ServerToClientMessage } from "src/realtime/messages";
  import { getSearchParam } from "src/app/navigation";
  import {
    createRealtimeClient,
    getHostingMode,
    getOrCreatePlayerDeviceId,
    getServerWebSocketUrl,
  } from "src/realtime/client";
  import { getPlayerBuzzState } from "./playerBuzzState";
  import { getPlayerScreenStep, shouldShowPlayerScoreStrip } from "./playerScreenState";
  import ActiveClueScreen from "./ActiveClueScreen.svelte";
  import EndScreen from "../shared/EndScreen.svelte";
  import GameBoard from "../shared/GameBoard.svelte";
  import Scoreboard from "../shared/Scoreboard.svelte";
  import TimedToast from "../shared/TimedToast.svelte";
  import { createBuzzSoundPlayer } from "../shared/buzzSound";
  import { createTimedToastManager } from "../shared/timedToastManager";

  let connectionStatus = $state<"connecting" | "connected" | "disconnected">("connecting");
  let toastMessage = $state("");
  let toastTone = $state<"info" | "success" | "error">("error");
  let sessionView = $state<GameSessionView | undefined>(undefined);

  const playerName = getLocationSearchParam("name");
  const joinCode = getLocationSearchParam("code");
  const hostingMode = getHostingMode(getLocationSearchParam("mode"));
  const playerDeviceId =
    typeof window === "undefined" ? "" : getOrCreatePlayerDeviceId(window.localStorage);
  let connectionSetupError = "";

  let realtimeClient:
    | ReturnType<typeof createRealtimeClient>
    | undefined;
  const buzzSoundPlayer =
    typeof window === "undefined" ? undefined : createBuzzSoundPlayer();
  const toastManager = createTimedToastManager({
    setMessage: (next) => {
      toastMessage = next;
    },
    setTone: (next) => {
      toastTone = next;
    },
  });

  try {
    realtimeClient = createRealtimeClient({
      url: getServerWebSocketUrl({ mode: hostingMode }),
      onOpen: () => {
        connectionStatus = "connected";
        realtimeClient?.send({
          type: "player:join",
          displayName: playerName,
          deviceId: playerDeviceId,
        });
      },
      onClose: () => {
        connectionStatus = "disconnected";
      },
      onError: (message) => {
        toastManager.show(message, "error");
      },
      onMessage: (message: ServerToClientMessage) => {
        if (message.type === "buzz:accepted") {
          void buzzSoundPlayer?.play();
          return;
        }

        if (message.type === "session:state") {
          sessionView = message.session;
          return;
        }

        if (message.type === "error") {
          toastManager.show(message.message, "error");
        }
      },
    });
  } catch (error) {
    connectionStatus = "disconnected";
    connectionSetupError =
      error instanceof Error ? error.message : "Could not start the realtime connection.";
    toastManager.show(connectionSetupError, "error");
  }

  if (typeof window !== "undefined" && playerName.length > 0 && realtimeClient !== undefined) {
    realtimeClient.connect();
  } else if (connectionSetupError.length === 0) {
    connectionStatus = "disconnected";
    toastManager.show("A player name is required before joining the live board.", "error");
  }

  const currentPlayer = $derived.by<ScoreboardPlayer | undefined>(() =>
    sessionView?.players.find((player) => player.displayName === playerName),
  );
  const playerScreenStep = $derived(getPlayerScreenStep(sessionView, currentPlayer));
  const currentPlayerHasAttempted = $derived.by(() => {
    if (sessionView?.activeClue === undefined || currentPlayer === undefined) {
      return false;
    }

    return sessionView.activeClue.attemptedPlayerIds.includes(currentPlayer.id);
  });
  const buzzWinnerDisplayName = $derived.by(() => {
    if (sessionView?.buzzWinnerPlayerId === undefined) {
      return undefined;
    }

    return sessionView.players.find((player) => player.id === sessionView.buzzWinnerPlayerId)?.displayName;
  });
  const playerBuzzState = $derived.by(() =>
    getPlayerBuzzState({
      currentPlayerId: currentPlayer?.id,
      buzzWinnerPlayerId: sessionView?.buzzWinnerPlayerId,
      buzzWinnerDisplayName,
      hasAttempted: currentPlayerHasAttempted,
      isAnswerRevealed: sessionView?.activeClue?.answerRevealed ?? false,
    }),
  );
  const isGameplayStep = $derived(
    playerScreenStep === "board" || playerScreenStep === "clue" || playerScreenStep === "end",
  );
  const showPlayerScoreStrip = $derived(shouldShowPlayerScoreStrip(playerScreenStep));

  function buzzIn(): void {
    realtimeClient?.send({
      type: "player:buzz",
    });
  }

  onDestroy(() => {
    realtimeClient?.disconnect();
    toastManager.destroy();
  });

  function getLocationSearchParam(key: string): string {
    if (typeof window === "undefined") {
      return "";
    }

    return getSearchParam(window.location.search, key);
  }
</script>

<section class:screen--gameplay={isGameplayStep} class="screen">
  <TimedToast
    message={toastMessage}
    tone={toastTone}
    onDismiss={() => {
      toastManager.clear();
    }}
  />
  {#if playerScreenStep === "waiting" || playerScreenStep === "lobby"}
    <header class="screen__header">
      <div>
        <h1>Lobby</h1>
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
  {/if}

  {#if playerScreenStep === "waiting"}
    <p>Waiting for the host session to start.</p>
  {:else if playerScreenStep === "lobby" && sessionView !== undefined}
    <section class="panel">
      <h2>{sessionView.title}</h2>
      <p>Waiting for the host to start the game.</p>

      <section class="player-list">
        <h3>Players joined</h3>

        {#if sessionView.players.length === 0}
          <p>No players have joined yet.</p>
        {:else}
          <ul>
            {#each sessionView.players as player (player.id)}
              <li>{player.displayName}</li>
            {/each}
          </ul>
        {/if}
      </section>
    </section>
  {:else}
    {#if playerScreenStep === "board" && sessionView !== undefined}
      <GameBoard
        title={sessionView.title}
        rowCount={sessionView.rowCount}
        columnCount={sessionView.columnCount}
        columnTitles={sessionView.columnTitles}
        clues={sessionView.clues}
      />
    {:else if sessionView?.activeClue !== undefined && currentPlayer !== undefined}
      <ActiveClueScreen
        clue={sessionView.activeClue}
        buttonLabel={playerBuzzState.buttonLabel}
        canBuzz={playerBuzzState.canBuzz}
        isSuccessState={playerBuzzState.isSuccessState}
        onBuzz={buzzIn}
        statusMessage={playerBuzzState.statusMessage}
      />
    {:else if playerScreenStep === "end" && sessionView !== undefined}
      <EndScreen players={sessionView.players} title={sessionView.title} />
    {/if}

    {#if showPlayerScoreStrip}
      <Scoreboard players={sessionView.players} variant="strip" />
    {/if}
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

  .panel {
    border: 1px solid #475569;
    border-radius: 1rem;
    padding: 1.25rem;
    background: #0f172a;
    display: grid;
    gap: 1rem;
  }

  .player-list {
    display: grid;
    gap: 0.75rem;
  }

  .player-list ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.5rem;
  }

  .player-list li {
    border: 1px solid #374151;
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    background: #111827;
  }
</style>
