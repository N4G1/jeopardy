import { describe, expect, test } from "vitest";

import type { BoardDefinition } from "src/features/setup/boardSchema";
import {
  createSessionState,
  joinPlayer,
  judgeActiveClue,
  openClue,
  reboundActiveClue,
  revealActiveClueAnswer,
  returnToBoard,
  registerBuzz,
} from "server/session/sessionReducer";

function createBoardDefinition(): BoardDefinition {
  return {
    title: "Quiz Night",
    rowCount: 2,
    columnCount: 2,
    columnTitles: ["History", "Science"],
    clues: [
      {
        id: "clue-1",
        rowIndex: 0,
        columnIndex: 0,
        value: 100,
        prompt: "Question one",
        response: "Answer one",
      },
      {
        id: "clue-2",
        rowIndex: 0,
        columnIndex: 1,
        value: 200,
        prompt: "Question two",
        response: "Answer two",
      },
      {
        id: "clue-3",
        rowIndex: 1,
        columnIndex: 0,
        value: 300,
        prompt: "Question three",
        response: "Answer three",
      },
      {
        id: "clue-4",
        rowIndex: 1,
        columnIndex: 1,
        value: 400,
        prompt: "Question four",
        response: "Answer four",
      },
    ],
  };
}

describe("sessionReducer", () => {
  test("rejects empty player names", () => {
    const sessionState = createSessionState({
      sessionId: "session-1",
      joinCode: "abc123",
      board: createBoardDefinition(),
      createdAtMs: 0,
      hostConnectionId: "host-1",
    });

    const result = joinPlayer(sessionState, {
      playerId: "player-1",
      displayName: "  ",
      deviceId: "device-1",
      connectionId: "socket-1",
      joinedAtMs: 1,
    });

    expect(result).toEqual({
      ok: false,
      error: "Player name is required.",
    });
  });

  test("rejects duplicate player names", () => {
    const sessionState = createSessionState({
      sessionId: "session-1",
      joinCode: "abc123",
      board: createBoardDefinition(),
      createdAtMs: 0,
      hostConnectionId: "host-1",
    });

    const firstJoin = joinPlayer(sessionState, {
      playerId: "player-1",
      displayName: "Alice",
      deviceId: "device-1",
      connectionId: "socket-1",
      joinedAtMs: 1,
    });

    if (!firstJoin.ok) {
      throw new Error("Expected first join to succeed.");
    }

    const secondJoin = joinPlayer(firstJoin.value, {
      playerId: "player-2",
      displayName: "alice",
      deviceId: "device-2",
      connectionId: "socket-2",
      joinedAtMs: 2,
    });

    expect(secondJoin).toEqual({
      ok: false,
      error: "Player name is already in use.",
    });
  });

  test("rejects a second player from the same device", () => {
    const sessionState = createSessionState({
      sessionId: "session-1",
      joinCode: "abc123",
      board: createBoardDefinition(),
      createdAtMs: 0,
      hostConnectionId: "host-1",
      players: [
        {
          id: "player-1",
          displayName: "Alice",
          deviceId: "device-1",
          score: 0,
          connectionId: "socket-1",
          isConnected: true,
          joinedAtMs: 1,
        },
      ],
    });

    const result = joinPlayer(sessionState, {
      playerId: "player-2",
      displayName: "Bob",
      deviceId: "device-1",
      connectionId: "socket-2",
      joinedAtMs: 2,
    });

    expect(result).toEqual({
      ok: false,
      error: "This device is already linked to another player.",
    });
  });

  test("rejects a new player joining after the game starts", () => {
    const sessionState = createSessionState({
      sessionId: "session-1",
      joinCode: "abc123",
      board: createBoardDefinition(),
      createdAtMs: 0,
      hostConnectionId: "host-1",
      phase: "board",
      players: [
        {
          id: "player-1",
          displayName: "Alice",
          deviceId: "device-1",
          score: 0,
          connectionId: "socket-1",
          isConnected: true,
          joinedAtMs: 1,
        },
      ],
    });

    const result = joinPlayer(sessionState, {
      playerId: "player-2",
      displayName: "Bob",
      deviceId: "device-2",
      connectionId: "socket-2",
      joinedAtMs: 2,
    });

    expect(result).toEqual({
      ok: false,
      error: "New players cannot join after the game has started.",
    });
  });

  test("opens an unanswered clue and switches the session into clue-open phase", () => {
    const sessionState = createSessionState({
      sessionId: "session-1",
      joinCode: "abc123",
      board: createBoardDefinition(),
      createdAtMs: 0,
      hostConnectionId: "host-1",
    });

    const result = openClue(sessionState, {
      clueId: "clue-2",
      openedAtMs: 25,
    });

    expect(result).toEqual({
      ok: true,
      value: expect.objectContaining({
        phase: "clue-open",
        activeClue: {
          clueId: "clue-2",
          openedAtMs: 25,
          attemptedPlayerIds: [],
          answerRevealed: false,
        },
      }),
    });
  });

  test("reveals the active clue answer", () => {
    const sessionState = createSessionState({
      sessionId: "session-1",
      joinCode: "abc123",
      board: createBoardDefinition(),
      createdAtMs: 0,
      hostConnectionId: "host-1",
      activeClue: {
        clueId: "clue-2",
        openedAtMs: 25,
        attemptedPlayerIds: [],
        answerRevealed: false,
      },
      phase: "clue-open",
    });

    const result = revealActiveClueAnswer(sessionState);

    expect(result).toEqual({
      ok: true,
      value: expect.objectContaining({
        activeClue: {
          clueId: "clue-2",
          openedAtMs: 25,
          attemptedPlayerIds: [],
          answerRevealed: true,
        },
      }),
    });
  });

  test("rejects opening an already answered clue", () => {
    const sessionState = createSessionState({
      sessionId: "session-1",
      joinCode: "abc123",
      board: createBoardDefinition(),
      createdAtMs: 0,
      hostConnectionId: "host-1",
      answeredClueIds: new Set(["clue-2"]),
    });

    const result = openClue(sessionState, {
      clueId: "clue-2",
      openedAtMs: 25,
    });

    expect(result).toEqual({
      ok: false,
      error: "Answered clues cannot be opened again.",
    });
  });

  test("accepts only the first valid buzz for an open clue", () => {
    const sessionState = createSessionState({
      sessionId: "session-1",
      joinCode: "abc123",
      board: createBoardDefinition(),
      createdAtMs: 0,
      hostConnectionId: "host-1",
      players: [
        {
          id: "player-1",
          displayName: "Alice",
          deviceId: "device-1",
          score: 0,
          connectionId: "socket-1",
          isConnected: true,
          joinedAtMs: 1,
        },
        {
          id: "player-2",
          displayName: "Bob",
          deviceId: "device-2",
          score: 0,
          connectionId: "socket-2",
          isConnected: true,
          joinedAtMs: 2,
        },
      ],
      activeClue: {
        clueId: "clue-1",
        openedAtMs: 10,
        attemptedPlayerIds: [],
        answerRevealed: false,
      },
      phase: "clue-open",
    });

    const firstBuzz = registerBuzz(sessionState, {
      playerId: "player-2",
    });

    if (!firstBuzz.ok) {
      throw new Error("Expected first buzz to succeed.");
    }

    const secondBuzz = registerBuzz(firstBuzz.value, {
      playerId: "player-1",
    });

    expect(firstBuzz.value.activeClue).toEqual({
      clueId: "clue-1",
      buzzWinnerPlayerId: "player-2",
      openedAtMs: 10,
      attemptedPlayerIds: [],
      answerRevealed: false,
    });
    expect(firstBuzz.value.phase).toBe("awaiting-judgment");
    expect(secondBuzz).toEqual({
      ok: false,
      error: "The buzzer is already locked for this clue.",
    });
  });

  test("rejects a rebound player from buzzing the same clue again", () => {
    const sessionState = createSessionState({
      sessionId: "session-1",
      joinCode: "abc123",
      board: createBoardDefinition(),
      createdAtMs: 0,
      hostConnectionId: "host-1",
      players: [
        {
          id: "player-1",
          displayName: "Alice",
          deviceId: "device-1",
          score: 0,
          connectionId: "socket-1",
          isConnected: true,
          joinedAtMs: 1,
        },
        {
          id: "player-2",
          displayName: "Bob",
          deviceId: "device-2",
          score: 0,
          connectionId: "socket-2",
          isConnected: true,
          joinedAtMs: 2,
        },
      ],
      activeClue: {
        clueId: "clue-1",
        openedAtMs: 10,
        attemptedPlayerIds: ["player-1"],
        answerRevealed: false,
      },
      phase: "clue-open",
    });

    const result = registerBuzz(sessionState, {
      playerId: "player-1",
    });

    expect(result).toEqual({
      ok: false,
      error: "This player already attempted the clue.",
    });
  });

  test("moves the session from lobby into the board phase", () => {
    const sessionState = createSessionState({
      sessionId: "session-1",
      joinCode: "abc123",
      board: createBoardDefinition(),
      createdAtMs: 0,
      hostConnectionId: "host-1",
      players: [
        {
          id: "player-1",
          displayName: "Alice",
          deviceId: "device-1",
          score: 0,
          connectionId: "socket-1",
          isConnected: true,
          joinedAtMs: 1,
        },
      ],
      phase: "lobby",
    });

    const result = returnToBoard(sessionState);

    expect(result).toEqual({
      ok: true,
      value: expect.objectContaining({
        phase: "board",
      }),
    });
  });

  test("rebound deducts points and reopens the clue for remaining players", () => {
    const sessionState = createSessionState({
      sessionId: "session-1",
      joinCode: "abc123",
      board: createBoardDefinition(),
      createdAtMs: 0,
      hostConnectionId: "host-1",
      players: [
        {
          id: "player-1",
          displayName: "Alice",
          deviceId: "device-1",
          score: 200,
          connectionId: "socket-1",
          isConnected: true,
          joinedAtMs: 1,
        },
        {
          id: "player-2",
          displayName: "Bob",
          deviceId: "device-2",
          score: 0,
          connectionId: "socket-2",
          isConnected: true,
          joinedAtMs: 2,
        },
      ],
      activeClue: {
        clueId: "clue-3",
        buzzWinnerPlayerId: "player-1",
        openedAtMs: 10,
        attemptedPlayerIds: [],
        answerRevealed: true,
      },
      phase: "awaiting-judgment",
    });

    const result = reboundActiveClue(sessionState, {
      playerId: "player-1",
    });

    expect(result).toEqual({
      ok: true,
      value: expect.objectContaining({
        phase: "clue-open",
        activeClue: {
          clueId: "clue-3",
          openedAtMs: 10,
          attemptedPlayerIds: ["player-1"],
          answerRevealed: true,
        },
      }),
    });

    if (result.ok) {
      expect(result.value.players[0]?.score).toBe(-100);
      expect(result.value.answeredClueIds.has("clue-3")).toBe(false);
    }
  });

  test("rebound closes the clue when no players remain eligible", () => {
    const sessionState = createSessionState({
      sessionId: "session-1",
      joinCode: "abc123",
      board: createBoardDefinition(),
      createdAtMs: 0,
      hostConnectionId: "host-1",
      players: [
        {
          id: "player-1",
          displayName: "Alice",
          deviceId: "device-1",
          score: 200,
          connectionId: "socket-1",
          isConnected: true,
          joinedAtMs: 1,
        },
      ],
      activeClue: {
        clueId: "clue-3",
        buzzWinnerPlayerId: "player-1",
        openedAtMs: 10,
        attemptedPlayerIds: [],
        answerRevealed: false,
      },
      phase: "awaiting-judgment",
    });

    const result = reboundActiveClue(sessionState, {
      playerId: "player-1",
    });

    expect(result).toEqual({
      ok: true,
      value: expect.objectContaining({
        phase: "board",
        activeClue: undefined,
      }),
    });

    if (result.ok) {
      expect(result.value.players[0]?.score).toBe(-100);
      expect(result.value.answeredClueIds.has("clue-3")).toBe(true);
    }
  });

  test("judges the active clue, updates score, and marks the clue answered", () => {
    const sessionState = createSessionState({
      sessionId: "session-1",
      joinCode: "abc123",
      board: createBoardDefinition(),
      createdAtMs: 0,
      hostConnectionId: "host-1",
      players: [
        {
          id: "player-1",
          displayName: "Alice",
          deviceId: "device-1",
          score: 200,
          connectionId: "socket-1",
          isConnected: true,
          joinedAtMs: 1,
        },
      ],
      activeClue: {
        clueId: "clue-3",
        buzzWinnerPlayerId: "player-1",
        openedAtMs: 10,
        attemptedPlayerIds: [],
        answerRevealed: false,
      },
      phase: "awaiting-judgment",
    });

    const result = judgeActiveClue(sessionState, {
      playerId: "player-1",
      wasCorrect: false,
    });

    expect(result).toEqual({
      ok: true,
      value: expect.objectContaining({
        phase: "board",
        activeClue: undefined,
      }),
    });
    if (result.ok) {
      expect(result.value.players[0]?.score).toBe(-100);
      expect(result.value.answeredClueIds.has("clue-3")).toBe(true);
    }
  });

  test("ends the game when the last remaining clue is judged", () => {
    const sessionState = createSessionState({
      sessionId: "session-1",
      joinCode: "abc123",
      board: createBoardDefinition(),
      createdAtMs: 0,
      hostConnectionId: "host-1",
      players: [
        {
          id: "player-1",
          displayName: "Alice",
          deviceId: "device-1",
          score: 200,
          connectionId: "socket-1",
          isConnected: true,
          joinedAtMs: 1,
        },
      ],
      answeredClueIds: new Set(["clue-1", "clue-2", "clue-3"]),
      activeClue: {
        clueId: "clue-4",
        buzzWinnerPlayerId: "player-1",
        openedAtMs: 10,
        attemptedPlayerIds: [],
        answerRevealed: false,
      },
      phase: "awaiting-judgment",
    });

    const result = judgeActiveClue(sessionState, {
      playerId: "player-1",
      wasCorrect: true,
    });

    expect(result).toEqual({
      ok: true,
      value: expect.objectContaining({
        phase: "ended",
        activeClue: undefined,
      }),
    });
  });

  test("ends the game when the final clue closes on rebound", () => {
    const sessionState = createSessionState({
      sessionId: "session-1",
      joinCode: "abc123",
      board: createBoardDefinition(),
      createdAtMs: 0,
      hostConnectionId: "host-1",
      players: [
        {
          id: "player-1",
          displayName: "Alice",
          deviceId: "device-1",
          score: 200,
          connectionId: "socket-1",
          isConnected: true,
          joinedAtMs: 1,
        },
      ],
      answeredClueIds: new Set(["clue-1", "clue-2", "clue-3"]),
      activeClue: {
        clueId: "clue-4",
        buzzWinnerPlayerId: "player-1",
        openedAtMs: 10,
        attemptedPlayerIds: [],
        answerRevealed: false,
      },
      phase: "awaiting-judgment",
    });

    const result = reboundActiveClue(sessionState, {
      playerId: "player-1",
    });

    expect(result).toEqual({
      ok: true,
      value: expect.objectContaining({
        phase: "ended",
        activeClue: undefined,
      }),
    });
  });
});
