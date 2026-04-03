import { describe, expect, test } from "vitest";

import type { BoardDefinition } from "src/features/setup/boardSchema";
import { handleClientMessage, type ConnectionContext } from "server/realtime/websocketServer";
import { createDefaultSessionStore } from "server/session/sessionStore";

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

function createHostContext(): ConnectionContext {
  return {
    connectionId: "host-1",
    role: "host",
  };
}

describe("handleClientMessage", () => {
  test("creates a session and broadcasts the initial session state", () => {
    const sessionStore = createDefaultSessionStore();

    const result = handleClientMessage(
      sessionStore,
      createHostContext(),
      {
        type: "host:create-session",
        board: createBoardDefinition(),
      },
      {
        nowMs: 10,
        createSessionId: () => "session-1",
        createJoinCode: () => "abc123",
      },
    );

    expect(result.nextContext).toEqual(createHostContext());
    expect(result.outgoingMessages).toEqual([
      {
        audience: "all",
        message: {
          type: "session:state",
          session: expect.objectContaining({
            sessionId: "session-1",
            joinCode: "abc123",
            title: "Quiz Night",
            phase: "lobby",
          }),
        },
      },
    ]);
  });

  test("joins a player and returns updated connection context", () => {
    const sessionStore = createDefaultSessionStore();

    handleClientMessage(
      sessionStore,
      createHostContext(),
      {
        type: "host:create-session",
        board: createBoardDefinition(),
      },
      {
        nowMs: 10,
        createSessionId: () => "session-1",
        createJoinCode: () => "abc123",
      },
    );

    const result = handleClientMessage(
      sessionStore,
      {
        connectionId: "socket-2",
        role: "player",
      },
      {
        type: "player:join",
        displayName: "Alice",
        deviceId: "device-1",
      },
      {
        nowMs: 25,
      },
    );

    expect(result.nextContext).toEqual({
      connectionId: "socket-2",
      role: "player",
      playerId: "socket-2",
    });
    expect(result.outgoingMessages).toEqual([
      {
        audience: "all",
        message: {
          type: "session:state",
          session: expect.objectContaining({
            players: [
              expect.objectContaining({
                id: "socket-2",
                displayName: "Alice",
                connectionStatus: "connected",
              }),
            ],
          }),
        },
      },
    ]);
  });

  test("returns an error when a player buzzes before a clue is open", () => {
    const sessionStore = createDefaultSessionStore();

    handleClientMessage(
      sessionStore,
      createHostContext(),
      {
        type: "host:create-session",
        board: createBoardDefinition(),
      },
      {
        nowMs: 10,
        createSessionId: () => "session-1",
        createJoinCode: () => "abc123",
      },
    );

    const result = handleClientMessage(
      sessionStore,
      {
        connectionId: "socket-2",
        role: "player",
        playerId: "socket-2",
      },
      {
        type: "player:buzz",
      },
      {
        nowMs: 25,
      },
    );

    expect(result.outgoingMessages).toEqual([
      {
        audience: "self",
        message: {
          type: "error",
          message: "A clue must be open before players can buzz.",
        },
      },
    ]);
  });

  test("starts the game from the lobby and broadcasts board phase", () => {
    const sessionStore = createDefaultSessionStore();

    handleClientMessage(
      sessionStore,
      createHostContext(),
      {
        type: "host:create-session",
        board: createBoardDefinition(),
      },
      {
        nowMs: 10,
        createSessionId: () => "session-1",
        createJoinCode: () => "abc123",
      },
    );

    handleClientMessage(
      sessionStore,
      {
        connectionId: "socket-2",
        role: "player",
      },
      {
        type: "player:join",
        displayName: "Alice",
        deviceId: "device-1",
      },
      {
        nowMs: 20,
      },
    );

    const result = handleClientMessage(
      sessionStore,
      createHostContext(),
      {
        type: "host:return-to-board",
      },
      {
        nowMs: 25,
      },
    );

    expect(result.outgoingMessages).toEqual([
      {
        audience: "all",
        message: {
          type: "session:state",
          session: expect.objectContaining({
            phase: "board",
          }),
        },
      },
    ]);
  });

  test("rebound deducts points and reopens the clue", () => {
    const sessionStore = createDefaultSessionStore();

    handleClientMessage(
      sessionStore,
      createHostContext(),
      {
        type: "host:create-session",
        board: createBoardDefinition(),
      },
      {
        nowMs: 10,
        createSessionId: () => "session-1",
        createJoinCode: () => "abc123",
      },
    );

    handleClientMessage(
      sessionStore,
      {
        connectionId: "socket-2",
        role: "player",
      },
      {
        type: "player:join",
        displayName: "Alice",
        deviceId: "device-1",
      },
      {
        nowMs: 20,
      },
    );

    handleClientMessage(
      sessionStore,
      createHostContext(),
      {
        type: "host:return-to-board",
      },
      {
        nowMs: 25,
      },
    );

    handleClientMessage(
      sessionStore,
      createHostContext(),
      {
        type: "host:open-clue",
        clueId: "clue-1",
      },
      {
        nowMs: 30,
      },
    );

    handleClientMessage(
      sessionStore,
      {
        connectionId: "socket-2",
        role: "player",
        playerId: "socket-2",
      },
      {
        type: "player:buzz",
      },
      {
        nowMs: 35,
      },
    );

    const result = handleClientMessage(
      sessionStore,
      createHostContext(),
      {
        type: "host:rebound",
        playerId: "socket-2",
      },
      {
        nowMs: 40,
      },
    );

    expect(result.outgoingMessages).toEqual([
      {
        audience: "all",
        message: {
          type: "session:state",
          session: expect.objectContaining({
            phase: "board",
            players: [
              expect.objectContaining({
                id: "socket-2",
                score: -100,
              }),
            ],
          }),
        },
      },
    ]);
  });
});
