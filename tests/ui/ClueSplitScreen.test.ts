import { render, screen } from "@testing-library/svelte";
import { describe, expect, test } from "vitest";

import ClueSplitScreen from "src/features/shared/ClueSplitScreen.svelte";

describe("ClueSplitScreen", () => {
  test("uses a flat grid so both sides share the same row heights", () => {
    const { container } = render(ClueSplitScreen, {
      props: {
        title: "Category - $100",
        questionText: "Question text",
        questionMedia: {
          kind: "video",
          fileName: "question.mp4",
          url: "https://example.com/question.mp4",
        },
        answerText: "Answer text",
        answerMedia: {
          kind: "video",
          fileName: "answer.mp4",
          url: "https://example.com/answer.mp4",
        },
        answerVisible: false,
      },
    });

    const labels = container.querySelectorAll(".clue-shared__label");
    expect(labels).toHaveLength(2);
    expect(labels[0]!.textContent).toBe("Question");
    expect(labels[1]!.textContent).toBe("Answer");

    const texts = container.querySelectorAll(".clue-shared__text");
    expect(texts).toHaveLength(2);

    const mediaSlots = container.querySelectorAll(".clue-shared__media-slot");
    expect(mediaSlots).toHaveLength(2);

    expect(container.querySelectorAll("video")).toHaveLength(1);
  });

  test("hides answer text and media when answer is not visible", () => {
    const { container } = render(ClueSplitScreen, {
      props: {
        title: "Category - $100",
        questionText: "Some question",
        answerText: "Secret answer",
        answerMedia: {
          kind: "image",
          fileName: "a.png",
          url: "https://example.com/a.png",
        },
        answerVisible: false,
      },
    });

    const hiddenElements = container.querySelectorAll(".clue-shared--hidden");
    expect(hiddenElements.length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("Secret answer")).toBeNull();
  });

  test("text paragraphs exist in both columns even when content is empty", () => {
    const { container } = render(ClueSplitScreen, {
      props: {
        title: "Category - $100",
        questionText: "Some question",
        answerText: "",
        answerVisible: true,
      },
    });

    const texts = container.querySelectorAll(".clue-shared__text");
    expect(texts).toHaveLength(2);
    expect(texts[0]!.textContent).toBe("Some question");
    expect(texts[1]!.textContent).toBe("");
    expect(texts[0]!.className).toBe(texts[1]!.className);
  });

  test("media slot uses flex centering without forcing media to fill the slot", () => {
    const { container } = render(ClueSplitScreen, {
      props: {
        title: "Category - $200",
        questionText: "Q",
        questionMedia: {
          kind: "video",
          fileName: "q.mp4",
          url: "https://example.com/q.mp4",
        },
        answerText: "A",
        answerMedia: {
          kind: "video",
          fileName: "a.mp4",
          url: "https://example.com/a.mp4",
        },
        answerVisible: true,
      },
    });

    const videos = container.querySelectorAll("video");
    expect(videos).toHaveLength(2);

    for (const video of videos) {
      const style = video.getAttribute("style") ?? "";
      expect(style).not.toContain("height: 100%");
    }
  });
});
