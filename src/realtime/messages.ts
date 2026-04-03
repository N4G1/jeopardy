import type {
  BoardClueDefinition,
  BoardDefinition,
  ClueMedia,
} from "../features/setup/boardSchema.js";

type ConnectionStatus = "connected" | "disconnected";
type SessionPhase = "lobby" | "board" | "clue-open" | "awaiting-judgment" | "ended";

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
  columnTitle: string;
  prompt: string;
  value: number;
  attemptedPlayerIds: string[];
  answerRevealed: boolean;
  questionMedia?: ClueMedia;
  response?: string;
  answerMedia?: ClueMedia;
};

type GameSessionView = {
  sessionId: string;
  joinCode: string;
  title: string;
  rowCount: number;
  columnCount: number;
  columnTitles: string[];
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
  deviceId: string;
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

type HostReboundMessage = {
  type: "host:rebound";
  playerId: string;
};

type HostNoContestMessage = {
  type: "host:no-contest";
};

type HostShowAnswerMessage = {
  type: "host:show-answer";
};

type ClientToServerMessage =
  | HostCreateSessionMessage
  | PlayerJoinMessage
  | HostOpenClueMessage
  | PlayerBuzzMessage
  | HostJudgeAnswerMessage
  | HostReturnToBoardMessage
  | HostReboundMessage
  | HostNoContestMessage
  | HostShowAnswerMessage;

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
        attemptedPlayerIds: string[];
        answerRevealed: boolean;
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
    columnTitles: sessionState.board.columnTitles,
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
            columnTitle:
              sessionState.board.columnTitles[activeClueDefinition.columnIndex] ??
              `Column ${activeClueDefinition.columnIndex + 1}`,
            prompt: activeClueDefinition.prompt,
            value: activeClueDefinition.value,
            attemptedPlayerIds: sessionState.activeClue?.attemptedPlayerIds ?? [],
            answerRevealed: sessionState.activeClue?.answerRevealed ?? false,
            ...(activeClueDefinition.questionMedia !== undefined
              ? { questionMedia: activeClueDefinition.questionMedia }
              : {}),
            ...(sessionState.activeClue?.answerRevealed
              ? {
                  response: activeClueDefinition.response,
                  ...(activeClueDefinition.answerMedia !== undefined
                    ? { answerMedia: activeClueDefinition.answerMedia }
                    : {}),
                }
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
  HostNoContestMessage,
  HostOpenClueMessage,
  HostReboundMessage,
  HostReturnToBoardMessage,
  HostShowAnswerMessage,
  PlayerBuzzMessage,
  PlayerJoinMessage,
  ScoreboardPlayer,
  ServerToClientMessage,
  SessionStateSource,
  SessionPhase,
  SessionStateMessage,
};
export { createSessionStateView };
