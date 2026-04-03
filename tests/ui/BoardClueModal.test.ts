import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { describe, expect, test, vi } from "vitest";

import type { ClueMedia } from "src/features/setup/boardSchema";
import BoardClueModal from "src/features/setup/BoardClueModal.svelte";
import * as media from "src/features/shared/media";

/** Same shape as `BoardClueModalDraft` in BoardClueModal.svelte (Svelte module exports are not in the TS graph here). */
type BoardClueModalDraft = {
  prompt: string;
  response: string;
  questionImage?: ClueMedia;
  answerImage?: ClueMedia;
};

function createDraft(overrides: Partial<BoardClueModalDraft> = {}): BoardClueModalDraft {
  return {
    prompt: "Initial question",
    response: "Initial answer",
    ...overrides,
  };
}

describe("BoardClueModal", () => {
  test("renders nothing when isOpen is false", () => {
    const { container } = render(BoardClueModal, {
      props: {
        isOpen: false,
        draftClue: createDraft(),
        onSave: vi.fn(),
        onClose: vi.fn(),
      },
    });

    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  test("save applies question and answer text through onSave and closes", async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(BoardClueModal, {
      props: {
        isOpen: true,
        draftClue: createDraft(),
        onSave,
        onClose,
      },
    });

    const questionInput = screen.getByLabelText("Question text");
    const answerInput = screen.getByLabelText("Answer text");

    await fireEvent.input(questionInput, { target: { value: "Updated Q" } });
    await fireEvent.input(answerInput, { target: { value: "Updated A" } });
    await fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: "Updated Q",
        response: "Updated A",
      }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("cancel through close button discards edits and does not call onSave", async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();

    const { rerender } = render(BoardClueModal, {
      props: {
        isOpen: true,
        draftClue: createDraft(),
        onSave,
        onClose,
      },
    });

    await fireEvent.input(screen.getByLabelText("Question text"), {
      target: { value: "Discarded Q" },
    });
    await fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);

    await rerender({ isOpen: false, draftClue: createDraft(), onSave, onClose });
    await rerender({ isOpen: true, draftClue: createDraft(), onSave, onClose });

    expect((screen.getByLabelText("Question text") as HTMLTextAreaElement).value).toBe(
      "Initial question",
    );
  });

  test("Escape discards unsaved changes; reopening restores original draftClue", async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    const originalDraft = createDraft();

    const { rerender } = render(BoardClueModal, {
      props: {
        isOpen: true,
        draftClue: originalDraft,
        onSave,
        onClose,
      },
    });

    await fireEvent.input(screen.getByLabelText("Question text"), {
      target: { value: "Escape me" },
    });
    await fireEvent.input(screen.getByLabelText("Answer text"), {
      target: { value: "Escape answer" },
    });

    const file = new File(["x"], "escape.png", { type: "image/png" });
    await fireEvent.change(screen.getByLabelText(/question image/i), {
      target: { files: [file] },
    });
    await waitFor(() => {
      expect(screen.getByRole("img", { name: "escape.png" })).toBeTruthy();
    });

    await fireEvent.keyDown(window, { key: "Escape" });

    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);

    await rerender({ isOpen: false, draftClue: originalDraft, onSave, onClose });
    await rerender({ isOpen: true, draftClue: originalDraft, onSave, onClose });

    expect((screen.getByLabelText("Question text") as HTMLTextAreaElement).value).toBe(
      "Initial question",
    );
    expect((screen.getByLabelText("Answer text") as HTMLTextAreaElement).value).toBe(
      "Initial answer",
    );
    expect(screen.queryByRole("img", { name: "escape.png" })).toBeNull();
  });

  test("backdrop click discards unsaved changes; reopening restores original draftClue", async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    const originalDraft = createDraft();

    const { rerender } = render(BoardClueModal, {
      props: {
        isOpen: true,
        draftClue: originalDraft,
        onSave,
        onClose,
      },
    });

    await fireEvent.input(screen.getByLabelText("Answer text"), {
      target: { value: "Backdrop cancel" },
    });
    await fireEvent.input(screen.getByLabelText("Question text"), {
      target: { value: "Backdrop Q" },
    });

    await fireEvent.click(screen.getByRole("button", { name: /close modal/i }));

    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);

    await rerender({ isOpen: false, draftClue: originalDraft, onSave, onClose });
    await rerender({ isOpen: true, draftClue: originalDraft, onSave, onClose });

    expect((screen.getByLabelText("Answer text") as HTMLTextAreaElement).value).toBe(
      "Initial answer",
    );
    expect((screen.getByLabelText("Question text") as HTMLTextAreaElement).value).toBe(
      "Initial question",
    );
  });

  test("save includes question image only when only question image is set", async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    const file = new File(["x"], "q.png", { type: "image/png" });

    render(BoardClueModal, {
      props: {
        isOpen: true,
        draftClue: createDraft(),
        onSave,
        onClose,
      },
    });

    const questionImageInput = screen.getByLabelText(/question image/i);
    await fireEvent.change(questionImageInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole("img", { name: "q.png" })).toBeTruthy();
    });

    await fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });

    const payload = onSave.mock.calls[0]![0] as BoardClueModalDraft;
    expect(payload.questionImage).toMatchObject({
      kind: "image",
      fileName: "q.png",
    });
    expect(payload.questionImage?.url.startsWith("data:image/png")).toBe(true);
    expect(payload.answerImage).toBeUndefined();
  });

  test("save includes answer image only when only answer image is set", async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    const file = new File(["y"], "a.jpg", { type: "image/jpeg" });

    render(BoardClueModal, {
      props: {
        isOpen: true,
        draftClue: createDraft(),
        onSave,
        onClose,
      },
    });

    const answerImageInput = screen.getByLabelText(/answer image/i);
    await fireEvent.change(answerImageInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole("img", { name: "a.jpg" })).toBeTruthy();
    });

    await fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });

    const payload = onSave.mock.calls[0]![0] as BoardClueModalDraft;
    expect(payload.answerImage).toMatchObject({
      kind: "image",
      fileName: "a.jpg",
    });
    expect(payload.answerImage?.url.startsWith("data:image/jpeg")).toBe(true);
    expect(payload.questionImage).toBeUndefined();
  });

  test("save includes both images together", async () => {
    const onSave = vi.fn();
    const fileQ = new File(["q"], "q.webp", { type: "image/webp" });
    const fileA = new File(["a"], "a.gif", { type: "image/gif" });

    render(BoardClueModal, {
      props: {
        isOpen: true,
        draftClue: createDraft(),
        onSave,
        onClose: vi.fn(),
      },
    });

    await fireEvent.change(screen.getByLabelText(/question image/i), {
      target: { files: [fileQ] },
    });
    await fireEvent.change(screen.getByLabelText(/answer image/i), {
      target: { files: [fileA] },
    });

    await waitFor(() => {
      expect(screen.getByRole("img", { name: "q.webp" })).toBeTruthy();
      expect(screen.getByRole("img", { name: "a.gif" })).toBeTruthy();
    });

    await fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });

    const payload = onSave.mock.calls[0]![0] as BoardClueModalDraft;
    expect(payload.questionImage?.fileName).toBe("q.webp");
    expect(payload.answerImage?.fileName).toBe("a.gif");
  });

  test("saved payload merges updated text with uploaded image fields", async () => {
    const onSave = vi.fn();
    const file = new File(["z"], "z.png", { type: "image/png" });

    render(BoardClueModal, {
      props: {
        isOpen: true,
        draftClue: createDraft({ prompt: "P0", response: "R0" }),
        onSave,
        onClose: vi.fn(),
      },
    });

    await fireEvent.input(screen.getByLabelText("Question text"), {
      target: { value: "P1" },
    });
    await fireEvent.change(screen.getByLabelText(/question image/i), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByRole("img", { name: "z.png" })).toBeTruthy();
    });

    await fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });

    const payload = onSave.mock.calls[0]![0] as BoardClueModalDraft;
    expect(payload.prompt).toBe("P1");
    expect(payload.response).toBe("R0");
    expect(payload.questionImage?.kind).toBe("image");
    expect(payload.questionImage?.fileName).toBe("z.png");
  });

  test("invalid image type shows an error and does not add a preview", async () => {
    const onSave = vi.fn();

    render(BoardClueModal, {
      props: {
        isOpen: true,
        draftClue: createDraft(),
        onSave,
        onClose: vi.fn(),
      },
    });

    const badFile = new File(["x"], "notes.txt", { type: "text/plain" });
    await fireEvent.change(screen.getByLabelText(/question image/i), {
      target: { files: [badFile] },
    });

    expect(screen.getByRole("alert").textContent).toContain(
      "Only PNG, JPEG, GIF, and WebP images are supported.",
    );
    expect(screen.queryByRole("img")).toBeNull();

    await fireEvent.click(screen.getByRole("button", { name: /save/i }));

    const payload = onSave.mock.calls[0]![0] as BoardClueModalDraft;
    expect(payload.questionImage).toBeUndefined();
  });

  test("readImageFileAsClueMedia failure shows an error and does not update image state", async () => {
    const onSave = vi.fn();
    const spy = vi
      .spyOn(media, "readImageFileAsClueMedia")
      .mockRejectedValueOnce(new Error("read failed"));

    try {
      render(BoardClueModal, {
        props: {
          isOpen: true,
          draftClue: createDraft(),
          onSave,
          onClose: vi.fn(),
        },
      });

      const file = new File(["x"], "ok.png", { type: "image/png" });
      await fireEvent.change(screen.getByLabelText(/question image/i), {
        target: { files: [file] },
      });

      await waitFor(() => {
        expect(screen.getByRole("alert").textContent).toContain("Failed to read the image.");
      });

      expect(screen.queryByRole("img", { name: "ok.png" })).toBeNull();

      await fireEvent.click(screen.getByRole("button", { name: /save/i }));

      expect((onSave.mock.calls[0]![0] as BoardClueModalDraft).questionImage).toBeUndefined();
    } finally {
      spy.mockRestore();
    }
  });

  test("opening with existing question and answer images shows both previews", () => {
    const qImage: ClueMedia = {
      kind: "image",
      fileName: "q.png",
      url: "data:image/png;base64,QQ==",
      altText: "q.png",
    };
    const aImage: ClueMedia = {
      kind: "image",
      fileName: "a.png",
      url: "data:image/png;base64,QQ==",
      altText: "a.png",
    };

    render(BoardClueModal, {
      props: {
        isOpen: true,
        draftClue: createDraft({ questionImage: qImage, answerImage: aImage }),
        onSave: vi.fn(),
        onClose: vi.fn(),
      },
    });

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
    expect(images[0]!.getAttribute("src")).toBe(qImage.url);
    expect(images[0]!.getAttribute("alt")).toBe("q.png");
    expect(images[1]!.getAttribute("src")).toBe(aImage.url);
    expect(images[1]!.getAttribute("alt")).toBe("a.png");
  });

  test("moves focus to the dialog when it opens", async () => {
    render(BoardClueModal, {
      props: {
        isOpen: true,
        draftClue: createDraft(),
        onSave: vi.fn(),
        onClose: vi.fn(),
      },
    });

    const dialog = screen.getByRole("dialog");

    await waitFor(() => {
      expect(document.activeElement).toBe(dialog);
    });
  });

  test("Save stays disabled until an in-flight image read finishes", async () => {
    let finishRead!: (value: ClueMedia) => void;
    const readPromise = new Promise<ClueMedia>((resolve) => {
      finishRead = resolve;
    });

    const spy = vi.spyOn(media, "readImageFileAsClueMedia").mockReturnValueOnce(readPromise);

    try {
      render(BoardClueModal, {
        props: {
          isOpen: true,
          draftClue: createDraft(),
          onSave: vi.fn(),
          onClose: vi.fn(),
        },
      });

      const file = new File(["x"], "slow.png", { type: "image/png" });
      await fireEvent.change(screen.getByLabelText(/question image/i), {
        target: { files: [file] },
      });

      const saveButton = screen.getByRole("button", { name: /^save$/i });
      expect(saveButton.hasAttribute("disabled")).toBe(true);

      finishRead({
        kind: "image",
        fileName: "slow.png",
        url: "data:image/png;base64,eA==",
        altText: "slow.png",
      });

      await waitFor(() => {
        expect(saveButton.hasAttribute("disabled")).toBe(false);
      });
    } finally {
      spy.mockRestore();
    }
  });
});
