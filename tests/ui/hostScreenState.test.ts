import { describe, expect, test } from "vitest";

import type { GameSessionView } from "src/realtime/messages";
import { canEnterGameBoard, getHostScreenStep } from "src/features/host/hostScreenState";

function createSessionView(overrides: Partial<GameSessionView> = {}): GameSessionView {
  return {
    sessionId: "session-1",
    joinCode: "abc123",
    title: "Quiz Night",
    rowCount: 2,
    columnCount: 2,
    columnTitles: ["History", "Science"],
    phase: "board",
    players: [],
    clues: [],
    ...overrides,
  };
}

describe("getHostScreenStep", () => {
  test("returns editor when no session exists", () => {
    expect(getHostScreenStep(undefined)).toBe("editor");
  });

  test("returns lobby while the session is still waiting for the game to start", () => {
    expect(
      getHostScreenStep(
        createSessionView({
          phase: "lobby",
        }),
      ),
    ).toBe("lobby");
  });

  test("returns board after the game has started", () => {
    expect(getHostScreenStep(createSessionView())).toBe("board");
  });

  test("returns clue when an active clue is open during the live game", () => {
    expect(
      getHostScreenStep(
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
      ),
    ).toBe("clue");
  });

  test("returns end when the session has finished", () => {
    expect(
      getHostScreenStep(
        createSessionView({
          phase: "ended",
        }),
      ),
    ).toBe("end");
  });
});

describe("canEnterGameBoard", () => {
  test("returns false when no players have joined yet", () => {
    expect(canEnterGameBoard(createSessionView())).toBe(false);
  });

  test("returns true when at least one player has joined", () => {
    expect(
      canEnterGameBoard(
        createSessionView({
          players: [
            {
              id: "player-1",
              displayName: "Alice",
              score: 0,
              connectionStatus: "connected",
            },
          ],
        }),
      ),
    ).toBe(true);
  });
});
