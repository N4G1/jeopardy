import type { Server as HttpServer } from "node:http";
import { randomUUID } from "node:crypto";

import {
  createSessionStateView,
  type ClientToServerMessage,
  type ServerToClientMessage,
} from "../../src/realtime/messages.js";
import { validateBoardDefinition } from "../../src/features/setup/boardSchema.js";
import { createDefaultSessionStore, type SessionStore } from "../session/sessionStore.js";
import { WebSocketServer } from "ws";
import type WebSocket from "ws";

type ConnectionContext = {
  connectionId: string;
  role: "host" | "player";
  playerId?: string;
};

type OutgoingEnvelope = {
  audience: "all" | "self";
  message: ServerToClientMessage;
};

type HandleClientMessageOptions = {
  nowMs: number;
  createSessionId?: () => string;
  createJoinCode?: () => string;
};

type HandleClientMessageResult = {
  nextContext: ConnectionContext;
  outgoingMessages: OutgoingEnvelope[];
};

function handleClientMessage(
  sessionStore: SessionStore,
  connectionContext: ConnectionContext,
  message: ClientToServerMessage,
  options: HandleClientMessageOptions,
): HandleClientMessageResult {
  const nowMs = options.nowMs;

  switch (message.type) {
    case "host:create-session": {
      const validationIssues = validateBoardDefinition(message.board);

      if (validationIssues.length > 0) {
        return createErrorResult(
          connectionContext,
          validationIssues[0]?.message ?? "Board validation failed.",
        );
      }

      const sessionState = sessionStore.createSession({
        sessionId: options.createSessionId?.() ?? randomUUID(),
        joinCode: options.createJoinCode?.() ?? randomUUID().slice(0, 6),
        board: message.board,
        createdAtMs: nowMs,
        hostConnectionId: connectionContext.connectionId,
      });

      return createBroadcastStateResult(
        {
          ...connectionContext,
          role: "host",
        },
        sessionState,
      );
    }

    case "player:join": {
      const reconnectingPlayer = sessionStore
        .getSession()
        ?.players.find((player) => player.deviceId === message.deviceId);
      const playerId =
        reconnectingPlayer?.id ?? connectionContext.playerId ?? connectionContext.connectionId;
      const result = sessionStore.joinPlayer({
        playerId,
        displayName: message.displayName,
        deviceId: message.deviceId,
        connectionId: connectionContext.connectionId,
        joinedAtMs: nowMs,
      });

      if (!result.ok) {
        return createErrorResult(connectionContext, result.error);
      }

      return createBroadcastStateResult(
        {
          ...connectionContext,
          role: "player",
          playerId,
        },
        result.value,
      );
    }

    case "host:open-clue": {
      const result = sessionStore.openClue({
        clueId: message.clueId,
        openedAtMs: nowMs,
      });

      if (!result.ok) {
        return createErrorResult(connectionContext, result.error);
      }

      return createBroadcastStateResult(connectionContext, result.value);
    }

    case "player:buzz": {
      if (connectionContext.playerId === undefined) {
        return createErrorResult(connectionContext, "Player must join before buzzing.");
      }

      const result = sessionStore.registerBuzz({
        playerId: connectionContext.playerId,
      });

      if (!result.ok) {
        return createErrorResult(connectionContext, result.error);
      }

      return {
        nextContext: connectionContext,
        outgoingMessages: [
          {
            audience: "all",
            message: {
              type: "buzz:accepted",
              playerId: connectionContext.playerId,
            },
          },
          {
            audience: "all",
            message: {
              type: "session:state",
              session: createSessionStateView(result.value),
            },
          },
        ],
      };
    }

    case "host:judge-answer": {
      const result = sessionStore.judgeActiveClue({
        playerId: message.playerId,
        wasCorrect: message.wasCorrect,
      });

      if (!result.ok) {
        return createErrorResult(connectionContext, result.error);
      }

      return createBroadcastStateResult(connectionContext, result.value);
    }

    case "host:rebound": {
      const result = sessionStore.reboundActiveClue({
        playerId: message.playerId,
      });

      if (!result.ok) {
        return createErrorResult(connectionContext, result.error);
      }

      return createBroadcastStateResult(connectionContext, result.value);
    }

    case "host:no-contest": {
      const result = sessionStore.closeActiveClueNoContest();

      if (!result.ok) {
        return createErrorResult(connectionContext, result.error);
      }

      return createBroadcastStateResult(connectionContext, result.value);
    }

    case "host:show-answer": {
      const result = sessionStore.revealActiveClueAnswer();

      if (!result.ok) {
        return createErrorResult(connectionContext, result.error);
      }

      return createBroadcastStateResult(connectionContext, result.value);
    }

    case "host:return-to-board": {
      const result = sessionStore.returnToBoard();

      if (!result.ok) {
        return createErrorResult(connectionContext, result.error);
      }

      return createBroadcastStateResult(connectionContext, result.value);
    }
  }
}

function createJeopardyWebSocketServer({
  server,
  sessionStore = createDefaultSessionStore(),
}: {
  server: HttpServer;
  sessionStore?: SessionStore;
}): WebSocketServer {
  const websocketServer = new WebSocketServer({ server });
  const connectionContexts = new Map<WebSocket, ConnectionContext>();

  websocketServer.on("connection", (socket) => {
    const connectionContext: ConnectionContext = {
      connectionId: randomUUID(),
      role: "player",
    };

    connectionContexts.set(socket, connectionContext);

    socket.on("message", (payload) => {
      let message: ClientToServerMessage;

      try {
        message = JSON.parse(payload.toString()) as ClientToServerMessage;
      } catch {
        sendJson(socket, {
          type: "error",
          message: "Invalid message payload.",
        });
        return;
      }

      const currentContext = connectionContexts.get(socket);

      if (currentContext === undefined) {
        sendJson(socket, {
          type: "error",
          message: "Connection state was not found.",
        });
        return;
      }

      const result = handleClientMessage(sessionStore, currentContext, message, {
        nowMs: Date.now(),
      });

      connectionContexts.set(socket, result.nextContext);

      for (const outgoingMessage of result.outgoingMessages) {
        if (outgoingMessage.audience === "self") {
          sendJson(socket, outgoingMessage.message);
          continue;
        }

        for (const client of websocketServer.clients) {
          if (client.readyState !== client.OPEN) {
            continue;
          }

          const targetContext = connectionContexts.get(client);
          const canReceiveBroadcast =
            targetContext?.role === "host" ||
            (targetContext?.role === "player" && targetContext.playerId !== undefined);

          if (canReceiveBroadcast) {
            sendJson(client, outgoingMessage.message);
          }
        }
      }
    });

    socket.on("close", () => {
      const currentContext = connectionContexts.get(socket);
      connectionContexts.delete(socket);

      if (currentContext?.role !== "player" || currentContext.playerId === undefined) {
        return;
      }

      const result = sessionStore.disconnectPlayer({
        playerId: currentContext.playerId,
      });

      if (!result.ok) {
        return;
      }

      const sessionMessage: ServerToClientMessage = {
        type: "session:state",
        session: createSessionStateView(result.value),
      };

      for (const client of websocketServer.clients) {
        if (client.readyState === client.OPEN) {
          sendJson(client, sessionMessage);
        }
      }
    });
  });

  return websocketServer;
}

function createBroadcastStateResult(
  connectionContext: ConnectionContext,
  sessionState: Parameters<typeof createSessionStateView>[0],
): HandleClientMessageResult {
  return {
    nextContext: connectionContext,
    outgoingMessages: [
      {
        audience: "all",
        message: {
          type: "session:state",
          session: createSessionStateView(sessionState),
        },
      },
    ],
  };
}

function createErrorResult(
  connectionContext: ConnectionContext,
  message: string,
): HandleClientMessageResult {
  return {
    nextContext: connectionContext,
    outgoingMessages: [
      {
        audience: "self",
        message: {
          type: "error",
          message,
        },
      },
    ],
  };
}

function sendJson(socket: WebSocket, message: ServerToClientMessage): void {
  socket.send(JSON.stringify(message));
}

export { createJeopardyWebSocketServer, handleClientMessage };
export type {
  ConnectionContext,
  HandleClientMessageOptions,
  HandleClientMessageResult,
  OutgoingEnvelope,
};
