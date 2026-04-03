import { describe, expect, test } from "vitest";

import {
  buildJoinUrl,
  buildPlayerPath,
  getSearchParam,
  resolveRoutePath,
} from "src/app/navigation";

describe("navigation helpers", () => {
  test("builds clean join and player urls without hash routing", () => {
    expect(buildJoinUrl("http://localhost:5174", "6a684a", "internet")).toBe(
      "http://localhost:5174/join?code=6a684a&mode=internet",
    );
    expect(buildPlayerPath("6a684a", "Alice", "internet")).toBe(
      "/player?code=6a684a&name=Alice&mode=internet",
    );
  });

  test("builds urls and resolves routes under a github pages base path", () => {
    expect(buildJoinUrl("https://bartek.github.io", "6a684a", "internet", "/jeopardy/")).toBe(
      "https://bartek.github.io/jeopardy/join?code=6a684a&mode=internet",
    );
    expect(buildPlayerPath("6a684a", "Alice", "internet", "/jeopardy/")).toBe(
      "/jeopardy/player?code=6a684a&name=Alice&mode=internet",
    );
    expect(resolveRoutePath("/jeopardy/join", "/jeopardy/")).toBe("/join");
    expect(resolveRoutePath("/jeopardy/player", "/jeopardy/")).toBe("/player");
  });

  test("reads search params from the real query string", () => {
    expect(getSearchParam("?code=6a684a&name=Alice", "code")).toBe("6a684a");
    expect(getSearchParam("?code=6a684a&name=Alice", "name")).toBe("Alice");
    expect(getSearchParam("?code=6a684a&name=Alice", "missing")).toBe("");
  });

  test("resolves supported clean routes by pathname", () => {
    expect(resolveRoutePath("/")).toBe("/");
    expect(resolveRoutePath("/join")).toBe("/join");
    expect(resolveRoutePath("/player")).toBe("/player");
    expect(resolveRoutePath("/unknown")).toBe("*");
  });
});
