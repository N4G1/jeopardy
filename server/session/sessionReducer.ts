import type { BoardDefinition } from "../../src/features/setup/boardSchema.js";

import type { SessionPlayer, SessionState } from "./sessionTypes.js";

type Result<TValue> =
  | {
      ok: true;
      value: TValue;
    }
  | {
      ok: false;
      error: string;
    };

type CreateSessionStateInput = {
  sessionId: string;
  joinCode: string;
  board: BoardDefinition;
  createdAtMs: number;
  hostConnectionId?: string;
  players?: SessionPlayer[];
  answeredClueIds?: Set<string>;
  activeClue?: SessionState["activeClue"];
  phase?: SessionState["phase"];
};

type JoinPlayerInput = {
  playerId: string;
  displayName: string;
  deviceId: string;
  connectionId: string;
  joinedAtMs: number;
};

type OpenClueInput = {
  clueId: string;
  openedAtMs: number;
};

type RegisterBuzzInput = {
  playerId: string;
};

type JudgeActiveClueInput = {
  playerId: string;
  wasCorrect: boolean;
};

type ReboundActiveClueInput = {
  playerId: string;
};

type DisconnectPlayerInput = {
  playerId: string;
};

function getResolvedBoardPhase(
  sessionState: SessionState,
  answeredClueIds: Set<string>,
): SessionState["phase"] {
  return answeredClueIds.size >= sessionState.board.clues.length ? "ended" : "board";
}

function createSessionState(input: CreateSessionStateInput): SessionState {
  return {
    sessionId: input.sessionId,
    joinCode: input.joinCode,
    board: input.board,
    phase: input.phase ?? "lobby",
    players: input.players ?? [],
    answeredClueIds: input.answeredClueIds ?? new Set(),
    createdAtMs: input.createdAtMs,
    hostConnectionId: input.hostConnectionId,
    activeClue: input.activeClue,
  };
}

function joinPlayer(sessionState: SessionState, input: JoinPlayerInput): Result<SessionState> {
  const displayName = input.displayName.trim();

  if (displayName.length === 0) {
    return {
      ok: false,
      error: "Player name is required.",
    };
  }

  const reconnectingPlayer = sessionState.players.find((player) => player.id === input.playerId);
  const sameDevicePlayer = sessionState.players.find(
    (player) => player.deviceId === input.deviceId,
  );
  const sameNamePlayer = sessionState.players.find(
    (player) => player.displayName.toLocaleLowerCase() === displayName.toLocaleLowerCase(),
  );

  if (reconnectingPlayer !== undefined) {
    if (reconnectingPlayer.isConnected) {
      return {
        ok: false,
        error: "This device is already linked to another player.",
      };
    }

    if (reconnectingPlayer.deviceId !== input.deviceId) {
      return {
        ok: false,
        error: "Reconnect from the original device.",
      };
    }

    if (reconnectingPlayer.displayName.toLocaleLowerCase() !== displayName.toLocaleLowerCase()) {
      return {
        ok: false,
        error: "Reconnect with the same player name.",
      };
    }

    return {
      ok: true,
      value: {
        ...sessionState,
        players: sessionState.players.map((player) => {
          if (player.id !== input.playerId) {
            return player;
          }

          return {
            ...player,
            connectionId: input.connectionId,
            isConnected: true,
          };
        }),
      },
    };
  }

  if (sameDevicePlayer !== undefined) {
    return {
      ok: false,
      error: sameDevicePlayer.isConnected
        ? "This device is already linked to another player."
        : "Reconnect with the same player name.",
    };
  }

  if (sameNamePlayer !== undefined) {
    return {
      ok: false,
      error: sameNamePlayer.isConnected
        ? "Player name is already in use."
        : "Reconnect from the original device.",
    };
  }

  if (sessionState.phase !== "lobby") {
    return {
      ok: false,
      error: "New players cannot join after the game has started.",
    };
  }

  return {
    ok: true,
    value: {
      ...sessionState,
      players: [
        ...sessionState.players,
        {
          id: input.playerId,
          displayName,
          deviceId: input.deviceId,
          score: 0,
          connectionId: input.connectionId,
          isConnected: true,
          joinedAtMs: input.joinedAtMs,
        },
      ],
    },
  };
}

function openClue(sessionState: SessionState, input: OpenClueInput): Result<SessionState> {
  if (sessionState.answeredClueIds.has(input.clueId)) {
    return {
      ok: false,
      error: "Answered clues cannot be opened again.",
    };
  }

  const clueExists = sessionState.board.clues.some((clue) => clue.id === input.clueId);

  if (!clueExists) {
    return {
      ok: false,
      error: "Clue was not found.",
    };
  }

  return {
    ok: true,
    value: {
      ...sessionState,
      phase: "clue-open",
      activeClue: {
        clueId: input.clueId,
        openedAtMs: input.openedAtMs,
        attemptedPlayerIds: [],
      },
    },
  };
}

function registerBuzz(sessionState: SessionState, input: RegisterBuzzInput): Result<SessionState> {
  if (sessionState.activeClue?.buzzWinnerPlayerId !== undefined) {
    return {
      ok: false,
      error: "The buzzer is already locked for this clue.",
    };
  }

  if (sessionState.phase !== "clue-open" || sessionState.activeClue === undefined) {
    return {
      ok: false,
      error: "A clue must be open before players can buzz.",
    };
  }

  if (sessionState.activeClue.attemptedPlayerIds.includes(input.playerId)) {
    return {
      ok: false,
      error: "This player already attempted the clue.",
    };
  }

  const playerExists = sessionState.players.some((player) => player.id === input.playerId);

  if (!playerExists) {
    return {
      ok: false,
      error: "Player was not found.",
    };
  }

  return {
    ok: true,
    value: {
      ...sessionState,
      phase: "awaiting-judgment",
      activeClue: {
        ...sessionState.activeClue,
        buzzWinnerPlayerId: input.playerId,
      },
    },
  };
}

function reboundActiveClue(
  sessionState: SessionState,
  input: ReboundActiveClueInput,
): Result<SessionState> {
  if (sessionState.phase !== "awaiting-judgment" || sessionState.activeClue === undefined) {
    return {
      ok: false,
      error: "A buzzed clue is required before a rebound.",
    };
  }

  if (sessionState.activeClue.buzzWinnerPlayerId !== input.playerId) {
    return {
      ok: false,
      error: "Only the current buzzed player can be sent to rebound.",
    };
  }

  const clue = sessionState.board.clues.find(
    (boardClue) => boardClue.id === sessionState.activeClue?.clueId,
  );

  if (clue === undefined) {
    return {
      ok: false,
      error: "Clue was not found.",
    };
  }

  const playerExists = sessionState.players.some((player) => player.id === input.playerId);

  if (!playerExists) {
    return {
      ok: false,
      error: "Player was not found.",
    };
  }

  const attemptedPlayerIds = [...sessionState.activeClue.attemptedPlayerIds, input.playerId];
  const remainingEligiblePlayerExists = sessionState.players.some(
    (player) => !attemptedPlayerIds.includes(player.id),
  );

  const players = sessionState.players.map((player) => {
    if (player.id !== input.playerId) {
      return player;
    }

    return {
      ...player,
      score: player.score - clue.value,
    };
  });

  if (!remainingEligiblePlayerExists) {
    const answeredClueIds = new Set([...sessionState.answeredClueIds, clue.id]);

    return {
      ok: true,
      value: {
        ...sessionState,
        phase: getResolvedBoardPhase(sessionState, answeredClueIds),
        players,
        answeredClueIds,
        activeClue: undefined,
      },
    };
  }

  return {
    ok: true,
    value: {
      ...sessionState,
      phase: "clue-open",
      players,
      activeClue: {
        clueId: sessionState.activeClue.clueId,
        openedAtMs: sessionState.activeClue.openedAtMs,
        attemptedPlayerIds,
      },
    },
  };
}

function closeActiveClueNoContest(sessionState: SessionState): Result<SessionState> {
  if (
    (sessionState.phase !== "clue-open" && sessionState.phase !== "awaiting-judgment") ||
    sessionState.activeClue === undefined
  ) {
    return {
      ok: false,
      error: "An open clue is required before calling no contest.",
    };
  }

  const clue = sessionState.board.clues.find(
    (boardClue) => boardClue.id === sessionState.activeClue?.clueId,
  );

  if (clue === undefined) {
    return {
      ok: false,
      error: "Clue was not found.",
    };
  }

  const answeredClueIds = new Set([...sessionState.answeredClueIds, clue.id]);

  return {
    ok: true,
    value: {
      ...sessionState,
      phase: getResolvedBoardPhase(sessionState, answeredClueIds),
      answeredClueIds,
      activeClue: undefined,
    },
  };
}

function disconnectPlayer(
  sessionState: SessionState,
  input: DisconnectPlayerInput,
): Result<SessionState> {
  const playerExists = sessionState.players.some((player) => player.id === input.playerId);

  if (!playerExists) {
    return {
      ok: false,
      error: "Player was not found.",
    };
  }

  return {
    ok: true,
    value: {
      ...sessionState,
      players: sessionState.players.map((player) => {
        if (player.id !== input.playerId) {
          return player;
        }

        return {
          ...player,
          isConnected: false,
        };
      }),
    },
  };
}

function returnToBoard(sessionState: SessionState): Result<SessionState> {
  if (sessionState.activeClue !== undefined) {
    return {
      ok: false,
      error: "The active clue must be resolved before returning to the board.",
    };
  }

  return {
    ok: true,
    value: {
      ...sessionState,
      phase: "board",
    },
  };
}

function judgeActiveClue(
  sessionState: SessionState,
  input: JudgeActiveClueInput,
): Result<SessionState> {
  if (sessionState.phase !== "awaiting-judgment" || sessionState.activeClue === undefined) {
    return {
      ok: false,
      error: "A buzzed clue is required before judgment.",
    };
  }

  const clue = sessionState.board.clues.find(
    (boardClue) => boardClue.id === sessionState.activeClue?.clueId,
  );

  if (clue === undefined) {
    return {
      ok: false,
      error: "Clue was not found.",
    };
  }

  const playerExists = sessionState.players.some((player) => player.id === input.playerId);

  if (!playerExists) {
    return {
      ok: false,
      error: "Player was not found.",
    };
  }

  const answeredClueIds = new Set([...sessionState.answeredClueIds, clue.id]);

  return {
    ok: true,
    value: {
      ...sessionState,
      phase: getResolvedBoardPhase(sessionState, answeredClueIds),
      players: sessionState.players.map((player) => {
        if (player.id !== input.playerId) {
          return player;
        }

        return {
          ...player,
          score: player.score + (input.wasCorrect ? clue.value : -clue.value),
        };
      }),
      answeredClueIds,
      activeClue: undefined,
    },
  };
}

export {
  createSessionState,
  joinPlayer,
  judgeActiveClue,
  closeActiveClueNoContest,
  disconnectPlayer,
  openClue,
  reboundActiveClue,
  registerBuzz,
  returnToBoard,
};
export type {
  CreateSessionStateInput,
  JoinPlayerInput,
  JudgeActiveClueInput,
  OpenClueInput,
  ReboundActiveClueInput,
  RegisterBuzzInput,
  DisconnectPlayerInput,
  Result,
};
