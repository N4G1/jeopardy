import { describe, expect, test } from "vitest";

import type { BoardDefinition } from "src/features/setup/boardSchema";
import { createSessionStateView } from "src/realtime/messages";
import type { SessionState } from "server/session/sessionTypes";

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
        questionMedia: {
          kind: "image",
          url: "https://example.com/question.png",
          fileName: "question.png",
        },
        answerMedia: {
          kind: "image",
          url: "https://example.com/answer.png",
          fileName: "answer.png",
        },
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

function createSessionState(): SessionState {
  return {
    sessionId: "session-1",
    joinCode: "abc123",
    board: createBoardDefinition(),
    phase: "board",
    players: [
      {
        id: "player-1",
        displayName: "Alice",
        deviceId: "device-1",
        score: 300,
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
        isConnected: false,
        joinedAtMs: 2,
      },
    ],
    answeredClueIds: new Set(["clue-2"]),
    createdAtMs: 0,
    activeClue: {
      clueId: "clue-3",
      buzzWinnerPlayerId: "player-1",
      openedAtMs: 10,
      attemptedPlayerIds: ["player-2"],
      answerRevealed: false,
    },
  };
}

describe("createSessionStateView", () => {
  test("maps session state into a client-safe game session view", () => {
    const sessionView = createSessionStateView(createSessionState());

    expect(sessionView).toMatchObject({
      sessionId: "session-1",
      joinCode: "abc123",
      title: "Quiz Night",
      rowCount: 2,
      columnCount: 2,
      phase: "board",
      buzzWinnerPlayerId: "player-1",
      players: [
        {
          id: "player-1",
          displayName: "Alice",
          score: 300,
          connectionStatus: "connected",
        },
        {
          id: "player-2",
          displayName: "Bob",
          score: 0,
          connectionStatus: "disconnected",
        },
      ],
      activeClue: {
        id: "clue-3",
        columnTitle: "History",
        prompt: "Question three",
        value: 300,
        attemptedPlayerIds: ["player-2"],
        answerRevealed: false,
        questionMedia: {
          kind: "image",
          url: "https://example.com/question.png",
          fileName: "question.png",
        },
      },
    });

    expect(sessionView.clues).toEqual(
      expect.arrayContaining([
        {
          id: "clue-1",
          rowIndex: 0,
          columnIndex: 0,
          value: 100,
          isAnswered: false,
        },
        {
          id: "clue-2",
          rowIndex: 0,
          columnIndex: 1,
          value: 200,
          isAnswered: true,
        },
      ]),
    );
  });

  test("includes answer content after the host reveals it", () => {
    const sessionState = createSessionState();
    sessionState.activeClue = {
      ...sessionState.activeClue!,
      answerRevealed: true,
    };

    const sessionView = createSessionStateView(sessionState);

    expect(sessionView.activeClue).toMatchObject({
      id: "clue-3",
      answerRevealed: true,
      response: "Answer three",
      answerMedia: {
        kind: "image",
        url: "https://example.com/answer.png",
        fileName: "answer.png",
      },
    });
  });
});
