<script lang="ts">
  import { onDestroy, onMount } from "svelte";

  import type { GameSessionView, ServerToClientMessage } from "src/realtime/messages";
  import { buildJoinUrl } from "src/app/navigation";
  import { getServerWebSocketUrl, type HostingMode } from "src/realtime/client";
  import { exportBoardDefinitionToJson, importBoardDefinitionFromJson } from "src/features/setup/boardFile";
  import { normalizeBoardEditorBoard } from "src/features/setup/boardEditorState";
  import {
    createBoardDefinition,
    fillBoardDefinitionWithSampleContent,
    type BoardDefinition,
  } from "src/features/setup/boardSchema";
  import {
    normalizeBoardForHostEditor,
    normalizeImportedBoardDefinition,
    normalizePlayableBoardOrThrow,
  } from "./boardDefinitionApply";
  import BoardStoragePanel from "src/features/setup/BoardStoragePanel.svelte";
  import {
    clearDraftBoard,
    deleteSavedBoard,
    listSavedBoards,
    loadDraftBoard,
    loadSavedBoard,
    saveDraftBoard,
    saveNamedBoard,
    type SavedBoardSummary,
  } from "src/features/setup/boardStorage";
  import { copyTextToClipboard } from "src/features/shared/clipboard";
  import BoardEditor from "src/features/setup/BoardEditor.svelte";
  import EndScreen from "src/features/shared/EndScreen.svelte";
  import GameBoard from "src/features/shared/GameBoard.svelte";
  import Scoreboard from "src/features/shared/Scoreboard.svelte";
  import TimedToast from "src/features/shared/TimedToast.svelte";
  import { createTimedToastManager } from "src/features/shared/timedToastManager";
  import { canEnterGameBoard, getHostScreenStep } from "./hostScreenState";

  let boardDefinition = $state(createBoardDefinition());
  let toastMessage = $state("");
  let toastTone = $state<"info" | "success" | "error">("info");
  let sessionView = $state<GameSessionView | undefined>(undefined);
  let hasPersistedDraft = $state(false);
  let isStorageReady = $state(false);
  let savedBoards = $state<SavedBoardSummary[]>([]);
  let hostingMode = $state<HostingMode>("lan");
  const toastManager = createTimedToastManager({
    setMessage: (next) => {
      toastMessage = next;
    },
    setTone: (next) => {
      toastTone = next;
    },
  });

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

    return buildJoinUrl(window.location.origin, sessionView.joinCode, hostingMode);
  });

  function updateBoardDefinition(nextBoardDefinition: BoardDefinition): void {
    boardDefinition = nextBoardDefinition;
  }

  function dismissToast(): void {
    toastManager.clear();
  }

  function showToast(
    message: string,
    tone: "info" | "success" | "error" = "info",
  ): void {
    toastManager.show(message, tone);
  }

  function fillSampleBoard(): void {
    updateBoardDefinition(
      normalizePlayableBoardOrThrow(fillBoardDefinitionWithSampleContent(boardDefinition)),
    );
  }

  async function saveCurrentBoard(name: string): Promise<void> {
    const safeName = name.trim();

    if (safeName.length === 0) {
      showToast("Board name is required before saving.", "error");
      return;
    }

    try {
      await saveNamedBoard(safeName, boardDefinition);
      await refreshSavedBoards();
      showToast("Board saved.", "success");
    } catch {
      showToast("Could not save the board.", "error");
    }
  }

  async function loadSavedBoardIntoEditor(savedBoardId: string): Promise<void> {
    try {
      const savedBoard = await loadSavedBoard(savedBoardId);

      if (savedBoard === undefined) {
        showToast("Saved board was not found.", "error");
        return;
      }

      boardDefinition = normalizeBoardForHostEditor(savedBoard.boardDefinition);
      showToast(`Loaded ${savedBoard.name}.`, "success");
      hasPersistedDraft = true;
    } catch {
      showToast("Could not load the saved board.", "error");
    }
  }

  async function deleteSavedBoardFromLibrary(savedBoardId: string): Promise<void> {
    try {
      await deleteSavedBoard(savedBoardId);
      await refreshSavedBoards();
      showToast("Board deleted.", "success");
    } catch {
      showToast("Could not delete the saved board.", "error");
    }
  }

  async function clearDraft(): Promise<void> {
    try {
      await clearDraftBoard();
      boardDefinition = createBoardDefinition();
      hasPersistedDraft = false;
      showToast("Draft cleared.", "success");
    } catch {
      showToast("Could not clear the draft.", "error");
    }
  }

  function exportBoardToJson(): void {
    try {
      const fileName = `${boardDefinition.title || "jeopardy-board"}.json`;
      const json = exportBoardDefinitionToJson(boardDefinition);
      const blob = new Blob([json], { type: "application/json" });
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = downloadUrl;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(downloadUrl);
      showToast("Board exported.", "success");
    } catch {
      showToast("Could not export the board.", "error");
    }
  }

  async function importBoardFromJson(fileList: FileList | null): Promise<void> {
    const file = fileList?.[0];

    if (file === undefined) {
      return;
    }

    try {
      boardDefinition = normalizeImportedBoardDefinition(
        importBoardDefinitionFromJson(await file.text()),
      );
      hasPersistedDraft = true;
      showToast(`Imported ${file.name}.`, "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not import the board.", "error");
    }
  }

  function startSession(): void {
    dismissToast();

    hostSocket?.close();

    try {
      hostSocket = new WebSocket(getServerWebSocketUrl({ mode: hostingMode }));
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not start the realtime connection.",
        "error",
      );
      return;
    }

    hostSocket.addEventListener("open", () => {
      sendMessage({
        type: "host:create-session",
        board: normalizeBoardEditorBoard(boardDefinition),
      });
    });

    hostSocket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data) as ServerToClientMessage;

      if (message.type === "session:state") {
        sessionView = message.session;
        return;
      }

      if (message.type === "error") {
        showToast(message.message, "error");
      }
    });

    hostSocket.addEventListener("close", () => {
    });
  }

  function startGame(): void {
    if (!canOpenGameBoard) {
      showToast("At least one player must join before the game can start.", "error");
      return;
    }

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
      showToast("Join link copied.", "success");
    } catch {
      showToast("Could not copy the join link.", "error");
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

  function noContest(): void {
    sendMessage({
      type: "host:no-contest",
    });
  }

  function sendMessage(message: object): void {
    if (hostSocket?.readyState !== WebSocket.OPEN) {
      showToast("Server connection is not ready.", "error");
      return;
    }

    hostSocket.send(JSON.stringify(message));
  }

  async function refreshSavedBoards(): Promise<void> {
    savedBoards = await listSavedBoards();
  }

  async function loadInitialBoardState(): Promise<void> {
    try {
      const draftBoard = await loadDraftBoard();
      savedBoards = await listSavedBoards();

      if (draftBoard !== undefined) {
        try {
          boardDefinition = normalizeBoardForHostEditor(draftBoard);
          hasPersistedDraft = true;
          showToast("Draft restored.", "success");
        } catch {
          showToast("Could not restore the saved draft.", "error");
        }
      }
    } catch {
      showToast("Could not access browser board storage.", "error");
    } finally {
      isStorageReady = true;
    }
  }

  onMount(() => {
    void loadInitialBoardState();
  });

  $effect(() => {
    if (!isStorageReady || hostScreenStep !== "editor") {
      return;
    }

    void saveDraftBoard(boardDefinition)
      .then(() => {
        hasPersistedDraft = true;
      })
      .catch(() => {
        showToast("Could not autosave the board draft.", "error");
      });
  });

  onDestroy(() => {
    hostSocket?.close();
    toastManager.destroy();
  });
</script>

<section
  class:screen--gameplay={isGameplayStep}
  class:screen--host-editor={hostScreenStep === "editor"}
  class="screen"
>
  <TimedToast message={toastMessage} tone={toastTone} onDismiss={dismissToast} />

  {#if hostScreenStep === "editor"}
    <div class="host-editor">
      <header class="host-editor__banner">
        <h1 class="host-editor__title">Host game</h1>
        <p class="host-editor__subtitle">Create the board, then start the session.</p>
      </header>

      <BoardEditor
        {boardDefinition}
        fullBleedBlue={false}
        onBoardChange={updateBoardDefinition}
        showDevAutofill={false}
      />

      <div class="host-editor__dock">
        <fieldset class="host-editor__mode-selector">
          <legend class="host-editor__legend">Hosting mode</legend>
          <div class="host-editor__mode-options">
            <label class="host-editor__mode-label">
              <input bind:group={hostingMode} type="radio" value="lan" />
              <span>LAN</span>
            </label>
            <label class="host-editor__mode-label">
              <input bind:group={hostingMode} type="radio" value="internet" />
              <span>Internet</span>
            </label>
          </div>
        </fieldset>

        <BoardStoragePanel
          hasDraft={hasPersistedDraft}
          {savedBoards}
          onClearDraft={clearDraft}
          onDeleteBoard={deleteSavedBoardFromLibrary}
          onExportJson={exportBoardToJson}
          onImportJson={importBoardFromJson}
          onLoadBoard={loadSavedBoardIntoEditor}
          onSaveBoard={saveCurrentBoard}
        />

        <div class="host-editor__cta-row">
          {#if import.meta.env.DEV}
            <button type="button" class="host-editor__cta host-editor__cta--secondary" onclick={fillSampleBoard}>
              Fill sample board
            </button>
          {/if}
          <button type="button" class="host-editor__cta" onclick={startSession}>Create Lobby</button>
        </div>
      </div>
    </div>
  {:else if hostScreenStep === "lobby" && sessionView !== undefined}
    <div class="screen__live">
      <section class="panel panel--lobby">
        <h1>{sessionView.title}</h1>
        <p>Share this join link before starting the game.</p>
        <button type="button" class="panel__copy-link" onclick={copyJoinLink}>{joinUrl}</button>
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
            <button type="button" onclick={noContest}>No contest</button>
          </div>
        {:else}
          <p>Waiting for a player to buzz in.</p>
          <div class="judge-actions">
            <button type="button" onclick={noContest}>No contest</button>
          </div>
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

  .screen--host-editor {
    max-width: none;
    padding: 0;
    gap: 0;
  }

  .host-editor {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    background: linear-gradient(180deg, #0d3460 0%, #0b2a4a 38%, #071826 100%);
    min-height: 100vh;
    min-height: 100dvh;
  }

  .host-editor__banner {
    text-align: center;
    padding: 1.25rem 1rem 0.75rem;
    color: #efff54;
  }

  .host-editor__title {
    margin: 0;
    font-size: clamp(1.35rem, 3vw, 2rem);
    font-weight: 800;
    letter-spacing: 0.02em;
  }

  .host-editor__subtitle {
    margin: 0.35rem 0 0;
    font-size: clamp(0.9rem, 1.8vw, 1.05rem);
    color: #dbeafe;
    font-weight: 600;
  }

  .host-editor__dock {
    box-sizing: border-box;
    width: min(90vw, 120rem);
    margin: 0 auto;
    padding: 1rem 1rem 1.5rem;
    border: 3px solid #0f2d52;
    background: #275f97;
    box-shadow: 0 12px 28px rgb(8 20 40 / 0.35);
    display: grid;
    gap: 1rem;
  }

  .host-editor__mode-selector {
    margin: 0;
    border: 2px solid #0f2d52;
    padding: 0.65rem 0.85rem;
    background: #1e4d7a;
    color: #efff54;
  }

  .host-editor__legend {
    padding: 0 0.25rem;
    font-weight: 800;
    font-size: 0.85rem;
    letter-spacing: 0.04em;
  }

  .host-editor__mode-options {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
    margin-top: 0.35rem;
  }

  .host-editor__mode-label {
    display: flex;
    gap: 0.45rem;
    align-items: center;
    font-weight: 700;
    color: #f8fafc;
    cursor: pointer;
  }

  .host-editor__cta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
    justify-content: flex-end;
    padding-top: 0.25rem;
    border-top: 2px solid #0f2d52;
  }

  .host-editor__cta {
    border: 2px solid #0f2d52;
    border-radius: 0;
    background: #16a34a;
    color: #f0fdf4;
    padding: 0.55rem 1rem;
    font: inherit;
    font-size: 0.95rem;
    font-weight: 800;
    line-height: 1.1;
    cursor: pointer;
  }

  .host-editor__cta--secondary {
    background: #0f2944;
    color: #efff54;
    border-color: #0f2d52;
    font-weight: 700;
  }

  .host-editor__cta:disabled {
    background: #475569;
    border-color: #334155;
    color: #cbd5e1;
    cursor: not-allowed;
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
