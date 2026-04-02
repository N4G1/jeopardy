import type {
  BoardClueDefinition,
  BoardDefinition,
  ClueMedia,
} from "../features/setup/boardSchema";

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
  SessionPhase,
  SessionStateMessage,
};
