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

  const nameAlreadyExists = sessionState.players.some(
    (player) => player.displayName.toLocaleLowerCase() === displayName.toLocaleLowerCase(),
  );

  if (nameAlreadyExists) {
    return {
      ok: false,
      error: "Player name must be unique.",
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

  return {
    ok: true,
    value: {
      ...sessionState,
      phase: "board",
      players: sessionState.players.map((player) => {
        if (player.id !== input.playerId) {
          return player;
        }

        return {
          ...player,
          score: player.score + (input.wasCorrect ? clue.value : -clue.value),
        };
      }),
      answeredClueIds: new Set([...sessionState.answeredClueIds, clue.id]),
      activeClue: undefined,
    },
  };
}

export { createSessionState, joinPlayer, judgeActiveClue, openClue, registerBuzz };
export type {
  CreateSessionStateInput,
  JoinPlayerInput,
  JudgeActiveClueInput,
  OpenClueInput,
  RegisterBuzzInput,
  Result,
};
