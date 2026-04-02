import type { ClientToServerMessage, ServerToClientMessage } from "./messages.js";

type RealtimeClientOptions = {
  url: string;
  onMessage: (message: ServerToClientMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (message: string) => void;
};

class RealtimeClient {
  #options: RealtimeClientOptions;
  #socket: WebSocket | undefined;

  constructor(options: RealtimeClientOptions) {
    this.#options = options;
  }

  connect(): void {
    this.disconnect();

    this.#socket = new WebSocket(this.#options.url);

    this.#socket.addEventListener("open", () => {
      this.#options.onOpen?.();
    });

    this.#socket.addEventListener("close", () => {
      this.#options.onClose?.();
    });

    this.#socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data) as ServerToClientMessage;
      this.#options.onMessage(message);
    });

    this.#socket.addEventListener("error", () => {
      this.#options.onError?.("Realtime connection failed.");
    });
  }

  disconnect(): void {
    this.#socket?.close();
    this.#socket = undefined;
  }

  send(message: ClientToServerMessage): void {
    if (this.#socket?.readyState !== WebSocket.OPEN) {
      this.#options.onError?.("Realtime connection is not ready.");
      return;
    }

    this.#socket.send(JSON.stringify(message));
  }
}

function createRealtimeClient(options: RealtimeClientOptions): RealtimeClient {
  return new RealtimeClient(options);
}

export { createRealtimeClient, RealtimeClient };
export type { RealtimeClientOptions };
