import type {
  BoardClueDefinition,
  BoardDefinition,
  ClueMedia,
} from "../features/setup/boardSchema.js";

type ConnectionStatus = "connected" | "disconnected";
type SessionPhase = "lobby" | "board" | "clue-open" | "awaiting-judgment";

type ScoreboardPlayer = {
  id: string;
  displayName: string;
  score: number;
  connectionStatus: ConnectionStatus;
};

type BoardClueView = Pick<BoardClueDefinition, "id" | "rowIndex" | "columnIndex" | "value"> & {
  isAnswered: boolean;
};

type ActiveClueView = {
  id: string;
  prompt: string;
  value: number;
  media?: ClueMedia;
};

type GameSessionView = {
  sessionId: string;
  joinCode: string;
  title: string;
  rowCount: number;
  columnCount: number;
  phase: SessionPhase;
  players: ScoreboardPlayer[];
  clues: BoardClueView[];
  activeClue?: ActiveClueView;
  buzzWinnerPlayerId?: string;
};

type HostCreateSessionMessage = {
  type: "host:create-session";
  board: BoardDefinition;
};

type PlayerJoinMessage = {
  type: "player:join";
  displayName: string;
};

type HostOpenClueMessage = {
  type: "host:open-clue";
  clueId: string;
};

type PlayerBuzzMessage = {
  type: "player:buzz";
};

type HostJudgeAnswerMessage = {
  type: "host:judge-answer";
  playerId: string;
  wasCorrect: boolean;
};

type HostReturnToBoardMessage = {
  type: "host:return-to-board";
};

type ClientToServerMessage =
  | HostCreateSessionMessage
  | PlayerJoinMessage
  | HostOpenClueMessage
  | PlayerBuzzMessage
  | HostJudgeAnswerMessage
  | HostReturnToBoardMessage;

type SessionStateMessage = {
  type: "session:state";
  session: GameSessionView;
};

type BuzzAcceptedMessage = {
  type: "buzz:accepted";
  playerId: string;
};

type ErrorMessage = {
  type: "error";
  message: string;
};

type ServerToClientMessage = SessionStateMessage | BuzzAcceptedMessage | ErrorMessage;

type SessionStateSource = {
  sessionId: string;
  joinCode: string;
  board: BoardDefinition;
  phase: SessionPhase;
  players: Array<{
    id: string;
    displayName: string;
    score: number;
    isConnected: boolean;
  }>;
  answeredClueIds: Set<string>;
  activeClue?:
    | {
        clueId: string;
        buzzWinnerPlayerId?: string;
      }
    | undefined;
};

function createSessionStateView(sessionState: SessionStateSource): GameSessionView {
  const activeClueDefinition = sessionState.activeClue
    ? sessionState.board.clues.find((clue) => clue.id === sessionState.activeClue?.clueId)
    : undefined;

  return {
    sessionId: sessionState.sessionId,
    joinCode: sessionState.joinCode,
    title: sessionState.board.title,
    rowCount: sessionState.board.rowCount,
    columnCount: sessionState.board.columnCount,
    phase: sessionState.phase,
    players: sessionState.players.map((player) => ({
      id: player.id,
      displayName: player.displayName,
      score: player.score,
      connectionStatus: player.isConnected ? "connected" : "disconnected",
    })),
    clues: sessionState.board.clues.map((clue) => ({
      id: clue.id,
      rowIndex: clue.rowIndex,
      columnIndex: clue.columnIndex,
      value: clue.value,
      isAnswered: sessionState.answeredClueIds.has(clue.id),
    })),
    ...(activeClueDefinition
      ? {
          activeClue: {
            id: activeClueDefinition.id,
            prompt: activeClueDefinition.prompt,
            value: activeClueDefinition.value,
            ...(activeClueDefinition.media !== undefined
              ? { media: activeClueDefinition.media }
              : {}),
          },
        }
      : {}),
    ...(sessionState.activeClue?.buzzWinnerPlayerId !== undefined
      ? {
          buzzWinnerPlayerId: sessionState.activeClue.buzzWinnerPlayerId,
        }
      : {}),
  };
}

export type {
  ActiveClueView,
  BoardClueView,
  ClientToServerMessage,
  ConnectionStatus,
  ErrorMessage,
  GameSessionView,
  HostCreateSessionMessage,
  HostJudgeAnswerMessage,
  HostOpenClueMessage,
  HostReturnToBoardMessage,
  PlayerBuzzMessage,
  PlayerJoinMessage,
  ScoreboardPlayer,
  ServerToClientMessage,
  SessionStateSource,
  SessionPhase,
  SessionStateMessage,
};
export { createSessionStateView };
