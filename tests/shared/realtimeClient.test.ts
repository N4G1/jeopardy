import { describe, expect, test } from "vitest";

import { getHostingMode, getServerWebSocketUrl } from "src/realtime/client";

describe("realtime client helpers", () => {
  test("defaults invalid hosting modes to lan", () => {
    expect(getHostingMode("internet")).toBe("internet");
    expect(getHostingMode("lan")).toBe("lan");
    expect(getHostingMode("weird")).toBe("lan");
  });

  test("builds lan websocket urls from the current location", () => {
    expect(
      getServerWebSocketUrl({
        mode: "lan",
        location: { protocol: "http:", hostname: "192.168.1.10" },
      }),
    ).toBe("ws://192.168.1.10:3001");

    expect(
      getServerWebSocketUrl({
        mode: "lan",
        location: { protocol: "https:", hostname: "quiz.example.com" },
      }),
    ).toBe("wss://quiz.example.com:3001");
  });

  test("builds internet websocket urls from the public backend url", () => {
    expect(
      getServerWebSocketUrl({
        mode: "internet",
        publicServerUrl: "https://jeopardy-server.onrender.com",
      }),
    ).toBe("wss://jeopardy-server.onrender.com/");
  });

  test("rejects internet mode when no public backend url is configured", () => {
    expect(() =>
      getServerWebSocketUrl({
        mode: "internet",
      }),
    ).toThrow("Internet mode is not configured.");
  });
});
