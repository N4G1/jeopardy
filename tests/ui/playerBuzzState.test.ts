import { describe, expect, test } from "vitest";

import { getPlayerBuzzState } from "src/features/player/playerBuzzState";

describe("getPlayerBuzzState", () => {
  test("allows buzzing when nobody has buzzed yet", () => {
    expect(
      getPlayerBuzzState({
        currentPlayerId: "player-1",
        hasAttempted: false,
        isAnswerRevealed: false,
      }),
    ).toEqual({
      canBuzz: true,
      buttonLabel: "Buzz in",
      isSuccessState: false,
      statusMessage: undefined,
    });
  });

  test("shows a personal winning state for the player who buzzed first", () => {
    expect(
      getPlayerBuzzState({
        currentPlayerId: "player-1",
        buzzWinnerPlayerId: "player-1",
        buzzWinnerDisplayName: "Alice",
        hasAttempted: false,
        isAnswerRevealed: false,
      }),
    ).toEqual({
      canBuzz: false,
      buttonLabel: "You buzzed first",
      isSuccessState: true,
      statusMessage: undefined,
    });
  });

  test("shows the other player's name when someone else buzzed first", () => {
    expect(
      getPlayerBuzzState({
        currentPlayerId: "player-1",
        buzzWinnerPlayerId: "player-2",
        buzzWinnerDisplayName: "Bob",
        hasAttempted: false,
        isAnswerRevealed: false,
      }),
    ).toEqual({
      canBuzz: false,
      buttonLabel: "Buzz locked",
      isSuccessState: false,
      statusMessage: "Bob buzzed first.",
    });
  });

  test("shows an attempted state after the player already answered the clue", () => {
    expect(
      getPlayerBuzzState({
        currentPlayerId: "player-1",
        hasAttempted: true,
        isAnswerRevealed: false,
      }),
    ).toEqual({
      canBuzz: false,
      buttonLabel: "Already answered",
      isSuccessState: false,
      statusMessage: "You already answered this clue. Waiting for another player to buzz in.",
    });
  });

  test("locks buzzing after the host reveals the answer", () => {
    expect(
      getPlayerBuzzState({
        currentPlayerId: "player-1",
        hasAttempted: false,
        isAnswerRevealed: true,
      }),
    ).toEqual({
      canBuzz: false,
      buttonLabel: "Buzz locked",
      isSuccessState: false,
      statusMessage: "The answer has been revealed.",
    });
  });
});
