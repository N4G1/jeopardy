import type { ClientToServerMessage, ServerToClientMessage } from "./messages.js";

type HostingMode = "lan" | "internet";
const playerDeviceStorageKey = "jeopardy-player-device-id";

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

function getHostingMode(value: string): HostingMode {
  return value === "internet" ? "internet" : "lan";
}

function getOrCreatePlayerDeviceId(
  storage: Pick<Storage, "getItem" | "setItem"> = localStorage,
): string {
  const existingDeviceId = storage.getItem(playerDeviceStorageKey);

  if (existingDeviceId !== null && existingDeviceId.trim().length > 0) {
    return existingDeviceId;
  }

  const nextDeviceId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  storage.setItem(playerDeviceStorageKey, nextDeviceId);
  return nextDeviceId;
}

function getServerWebSocketUrl({
  mode,
  publicServerUrl,
  location,
}: {
  mode: HostingMode;
  publicServerUrl?: string;
  location?: Pick<Location, "protocol" | "hostname">;
}): string {
  if (mode === "internet") {
    const resolvedPublicServerUrl = publicServerUrl ?? import.meta.env.VITE_PUBLIC_SERVER_URL;

    if (resolvedPublicServerUrl === undefined || resolvedPublicServerUrl.trim().length === 0) {
      throw new Error("Internet mode is not configured.");
    }

    const publicUrl = new URL(resolvedPublicServerUrl);
    publicUrl.protocol = publicUrl.protocol === "https:" ? "wss:" : "ws:";
    return publicUrl.toString();
  }

  const resolvedLocation =
    location ??
    (typeof window === "undefined"
      ? { protocol: "http:", hostname: "localhost" }
      : window.location);
  const protocol = resolvedLocation.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${resolvedLocation.hostname}:3001`;
}

export {
  createRealtimeClient,
  getHostingMode,
  getOrCreatePlayerDeviceId,
  getServerWebSocketUrl,
  RealtimeClient,
};
export type { HostingMode, RealtimeClientOptions };
