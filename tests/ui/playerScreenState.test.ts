import { describe, expect, test } from "vitest";

import {
  getPlayerScreenStep,
  shouldShowPlayerScoreStrip,
} from "src/features/player/playerScreenState";
import type { GameSessionView, ScoreboardPlayer } from "src/realtime/messages";

function createPlayer(playerId = "player-1"): ScoreboardPlayer {
  return {
    id: playerId,
    displayName: "Alice",
    score: 0,
    connectionStatus: "connected",
  };
}

function createSessionView(overrides: Partial<GameSessionView> = {}): GameSessionView {
  return {
    sessionId: "session-1",
    joinCode: "abc123",
    title: "Quiz Night",
    rowCount: 2,
    columnCount: 2,
    columnTitles: ["History", "Science"],
    phase: "board",
    players: [createPlayer()],
    clues: [],
    ...overrides,
  };
}

describe("getPlayerScreenStep", () => {
  test("returns waiting before the session state arrives", () => {
    expect(getPlayerScreenStep(undefined, undefined)).toBe("waiting");
  });

  test("returns lobby while the host is still gathering players", () => {
    expect(
      getPlayerScreenStep(
        createSessionView({
          phase: "lobby",
        }),
        createPlayer(),
      ),
    ).toBe("lobby");
  });

  test("returns board after the game starts", () => {
    expect(getPlayerScreenStep(createSessionView(), createPlayer())).toBe("board");
  });

  test("returns clue when an active clue is open for a known player", () => {
    expect(
      getPlayerScreenStep(
        createSessionView({
          phase: "clue-open",
          activeClue: {
            id: "clue-1",
            columnTitle: "History",
            prompt: "Question one",
            value: 100,
            attemptedPlayerIds: [],
          },
        }),
        createPlayer(),
      ),
    ).toBe("clue");
  });

  test("returns end when the game has finished", () => {
    expect(
      getPlayerScreenStep(
        createSessionView({
          phase: "ended",
        }),
        createPlayer(),
      ),
    ).toBe("end");
  });
});

describe("shouldShowPlayerScoreStrip", () => {
  test("shows the score strip only on the board screen", () => {
    expect(shouldShowPlayerScoreStrip("board")).toBe(true);
    expect(shouldShowPlayerScoreStrip("clue")).toBe(false);
    expect(shouldShowPlayerScoreStrip("end")).toBe(false);
    expect(shouldShowPlayerScoreStrip("lobby")).toBe(false);
    expect(shouldShowPlayerScoreStrip("waiting")).toBe(false);
  });
});
