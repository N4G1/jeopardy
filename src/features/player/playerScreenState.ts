import type { GameSessionView, ScoreboardPlayer } from "src/realtime/messages";

type PlayerScreenStep = "waiting" | "lobby" | "board" | "clue" | "end";

function getPlayerScreenStep(
  sessionView: GameSessionView | undefined,
  currentPlayer: ScoreboardPlayer | undefined,
): PlayerScreenStep {
  if (sessionView === undefined) {
    return "waiting";
  }

  if (sessionView.phase === "lobby" || currentPlayer === undefined) {
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

function shouldShowPlayerScoreStrip(playerScreenStep: PlayerScreenStep): boolean {
  return playerScreenStep === "board";
}

export { getPlayerScreenStep, shouldShowPlayerScoreStrip };
export type { PlayerScreenStep };
