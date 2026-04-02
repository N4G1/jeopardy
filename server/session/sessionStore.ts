import {
  createSessionState,
  joinPlayer,
  judgeActiveClue,
  openClue,
  registerBuzz,
} from "./sessionReducer.js";
import type {
  CreateSessionStateInput,
  JoinPlayerInput,
  JudgeActiveClueInput,
  OpenClueInput,
  RegisterBuzzInput,
  Result,
} from "./sessionReducer.js";
import type { SessionState } from "./sessionTypes.js";

type CreateStoreSessionInput = Omit<CreateSessionStateInput, "sessionId" | "joinCode"> & {
  sessionId: string;
  joinCode: string;
};

class SessionStore {
  #sessionState?: SessionState;

  createSession(input: CreateStoreSessionInput): SessionState {
    this.#sessionState = createSessionState(input);
    return this.#sessionState;
  }

  getSession(): SessionState | undefined {
    return this.#sessionState;
  }

  joinPlayer(input: JoinPlayerInput): Result<SessionState> {
    return this.#apply((sessionState) => joinPlayer(sessionState, input));
  }

  openClue(input: OpenClueInput): Result<SessionState> {
    return this.#apply((sessionState) => openClue(sessionState, input));
  }

  registerBuzz(input: RegisterBuzzInput): Result<SessionState> {
    return this.#apply((sessionState) => registerBuzz(sessionState, input));
  }

  judgeActiveClue(input: JudgeActiveClueInput): Result<SessionState> {
    return this.#apply((sessionState) => judgeActiveClue(sessionState, input));
  }

  #apply(operation: (sessionState: SessionState) => Result<SessionState>): Result<SessionState> {
    if (this.#sessionState === undefined) {
      return {
        ok: false,
        error: "No active session exists.",
      };
    }

    const result = operation(this.#sessionState);

    if (result.ok) {
      this.#sessionState = result.value;
    }

    return result;
  }
}

function createDefaultSessionStore(): SessionStore {
  return new SessionStore();
}

export { createDefaultSessionStore, SessionStore };
export type { CreateStoreSessionInput };
