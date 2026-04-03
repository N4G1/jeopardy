import type { GameSessionView } from "src/realtime/messages";

type HostScreenStep = "editor" | "lobby" | "board" | "clue" | "end";

function canEnterGameBoard(sessionView: GameSessionView | undefined): boolean {
  if (sessionView === undefined) {
    return false;
  }

  return sessionView.players.length > 0;
}

function getHostScreenStep(sessionView: GameSessionView | undefined): HostScreenStep {
  if (sessionView === undefined) {
    return "editor";
  }

  if (sessionView.phase === "lobby") {
    return "lobby";
  }

  if (sessionView.phase === "ended") {
    return "end";
  }

  if (sessionView.activeClue !== undefined) {
    return "clue";
  }

  return "board";
}

export { canEnterGameBoard, getHostScreenStep };
export type { HostScreenStep };
