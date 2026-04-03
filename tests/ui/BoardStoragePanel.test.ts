import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, test, vi } from "vitest";

import BoardStoragePanel from "src/features/setup/BoardStoragePanel.svelte";

describe("BoardStoragePanel", () => {
  test("submits the entered board name when saving", async () => {
    const onSaveBoard = vi.fn();

    render(BoardStoragePanel, {
      props: {
        hasDraft: false,
        savedBoards: [],
        onSaveBoard,
        onLoadBoard: vi.fn(),
        onDeleteBoard: vi.fn(),
        onClearDraft: vi.fn(),
        onExportJson: vi.fn(),
        onImportJson: vi.fn(),
      },
    });

    await fireEvent.input(screen.getByLabelText("Board name"), {
      target: { value: "Friday Quiz" },
    });
    await fireEvent.click(screen.getByRole("button", { name: "Save board" }));

    expect(onSaveBoard).toHaveBeenCalledWith("Friday Quiz");
  });

  test("renders saved boards with load and delete actions", async () => {
    const onLoadBoard = vi.fn();
    const onDeleteBoard = vi.fn();

    render(BoardStoragePanel, {
      props: {
        hasDraft: true,
        savedBoards: [
          {
            id: "board-1",
            name: "Friday Quiz",
            title: "Quiz Night",
            updatedAt: "2026-04-03T10:00:00.000Z",
          },
        ],
        onSaveBoard: vi.fn(),
        onLoadBoard,
        onDeleteBoard,
        onClearDraft: vi.fn(),
        onExportJson: vi.fn(),
        onImportJson: vi.fn(),
      },
    });

    expect(screen.getByText("Friday Quiz")).toBeTruthy();

    await fireEvent.click(screen.getByRole("button", { name: "Load Friday Quiz" }));
    await fireEvent.click(screen.getByRole("button", { name: "Delete Friday Quiz" }));

    expect(onLoadBoard).toHaveBeenCalledWith("board-1");
    expect(onDeleteBoard).toHaveBeenCalledWith("board-1");
  });

  test("shows the clear draft action when a draft exists", () => {
    render(BoardStoragePanel, {
      props: {
        hasDraft: true,
        savedBoards: [],
        onSaveBoard: vi.fn(),
        onLoadBoard: vi.fn(),
        onDeleteBoard: vi.fn(),
        onClearDraft: vi.fn(),
        onExportJson: vi.fn(),
        onImportJson: vi.fn(),
      },
    });

    expect(screen.getByRole("button", { name: "Clear draft" })).toBeTruthy();
  });
});
