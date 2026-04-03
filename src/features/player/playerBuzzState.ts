type PlayerBuzzState = {
  canBuzz: boolean;
  buttonLabel: string;
  isSuccessState: boolean;
  statusMessage?: string;
};

type GetPlayerBuzzStateInput = {
  currentPlayerId?: string;
  buzzWinnerPlayerId?: string;
  buzzWinnerDisplayName?: string;
  hasAttempted: boolean;
  isAnswerRevealed: boolean;
};

function getPlayerBuzzState(input: GetPlayerBuzzStateInput): PlayerBuzzState {
  if (input.hasAttempted) {
    return {
      canBuzz: false,
      buttonLabel: "Already answered",
      isSuccessState: false,
      statusMessage: "You already answered this clue. Waiting for another player to buzz in.",
    };
  }

  if (input.isAnswerRevealed) {
    return {
      canBuzz: false,
      buttonLabel: "Buzz locked",
      isSuccessState: false,
      statusMessage: "The answer has been revealed.",
    };
  }

  if (input.buzzWinnerPlayerId === undefined) {
    return {
      canBuzz: true,
      buttonLabel: "Buzz in",
      isSuccessState: false,
    };
  }

  if (input.currentPlayerId === input.buzzWinnerPlayerId) {
    return {
      canBuzz: false,
      buttonLabel: "You buzzed first",
      isSuccessState: true,
    };
  }

  return {
    canBuzz: false,
    buttonLabel: "Buzz locked",
    isSuccessState: false,
    statusMessage:
      input.buzzWinnerDisplayName === undefined
        ? "A player buzzed first."
        : `${input.buzzWinnerDisplayName} buzzed first.`,
  };
}

export { getPlayerBuzzState };
export type { GetPlayerBuzzStateInput, PlayerBuzzState };
