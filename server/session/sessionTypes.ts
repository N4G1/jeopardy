import type { BoardDefinition } from "../../src/features/setup/boardSchema.js";

type SessionPhase = "lobby" | "board" | "clue-open" | "awaiting-judgment" | "ended";

type SessionPlayer = {
  id: string;
  displayName: string;
  score: number;
  connectionId: string;
  isConnected: boolean;
  joinedAtMs: number;
};

type ActiveClueState = {
  clueId: string;
  buzzWinnerPlayerId?: string;
  openedAtMs: number;
  attemptedPlayerIds: string[];
};

type SessionState = {
  sessionId: string;
  joinCode: string;
  board: BoardDefinition;
  phase: SessionPhase;
  players: SessionPlayer[];
  answeredClueIds: Set<string>;
  createdAtMs: number;
  hostConnectionId?: string | undefined;
  activeClue?: ActiveClueState | undefined;
};

export type { ActiveClueState, SessionPhase, SessionPlayer, SessionState };
