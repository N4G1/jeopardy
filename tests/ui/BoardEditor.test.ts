import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, test } from "vitest";

import BoardEditor from "src/features/setup/BoardEditor.svelte";
import { createBoardDefinition } from "src/features/setup/boardSchema";

describe("BoardEditor", () => {
  test("renders the current title and lets the host update it", async () => {
    const updates: Array<ReturnType<typeof createBoardDefinition>> = [];

    render(BoardEditor, {
      props: {
        boardDefinition: createBoardDefinition(),
        onBoardChange: (nextBoardDefinition: ReturnType<typeof createBoardDefinition>) => {
          updates.push(nextBoardDefinition);
        },
      },
    });

    const titleInput = screen.getByLabelText("Game title");

    await fireEvent.input(titleInput, {
      target: { value: "Friday Finals" },
    });

    expect(updates.at(-1)?.title).toBe("Friday Finals");
  });

  test("renders column title inputs and lets the host update them", async () => {
    const updates: Array<ReturnType<typeof createBoardDefinition>> = [];

    render(BoardEditor, {
      props: {
        boardDefinition: createBoardDefinition(),
        onBoardChange: (nextBoardDefinition: ReturnType<typeof createBoardDefinition>) => {
          updates.push(nextBoardDefinition);
        },
      },
    });

    const firstColumnTitleInput = screen.getByLabelText("Column title 1");

    await fireEvent.input(firstColumnTitleInput, {
      target: { value: "Literature" },
    });

    expect(updates.at(-1)?.columnTitles[0]).toBe("Literature");
  });

  test("resizes the board and preserves existing clues by position", async () => {
    const updates: Array<ReturnType<typeof createBoardDefinition>> = [];
    const boardDefinition = createBoardDefinition({
      rowCount: 2,
      columnCount: 2,
    });

    boardDefinition.clues[0] = {
      ...boardDefinition.clues[0]!,
      prompt: "Saved question",
    };
    boardDefinition.columnTitles[0] = "Saved category";

    render(BoardEditor, {
      props: {
        boardDefinition,
        onBoardChange: (nextBoardDefinition: ReturnType<typeof createBoardDefinition>) => {
          updates.push(nextBoardDefinition);
        },
      },
    });

    const rowCountInput = screen.getByLabelText("Rows");

    await fireEvent.input(rowCountInput, {
      target: { value: "3" },
    });

    const latestBoardDefinition = updates.at(-1);

    expect(latestBoardDefinition?.rowCount).toBe(3);
    expect(latestBoardDefinition?.clues).toHaveLength(6);
    expect(latestBoardDefinition?.clues[0]?.prompt).toBe("Saved question");
    expect(latestBoardDefinition?.columnTitles[0]).toBe("Saved category");
    expect(screen.getAllByLabelText(/Question text/i)).toHaveLength(6);
  });

  test("shows a dev-only autofill action that fills categories, questions, and answers", async () => {
    const updates: Array<ReturnType<typeof createBoardDefinition>> = [];

    render(BoardEditor, {
      props: {
        boardDefinition: createBoardDefinition(),
        showDevAutofill: true,
        onBoardChange: (nextBoardDefinition: ReturnType<typeof createBoardDefinition>) => {
          updates.push(nextBoardDefinition);
        },
      },
    });

    await fireEvent.click(screen.getByRole("button", { name: "Fill sample board" }));

    const latestBoardDefinition = updates.at(-1);

    expect(latestBoardDefinition?.columnTitles[0]).toBe("Category 1");
    expect(latestBoardDefinition?.clues[0]?.prompt).toBe("Sample question 1-1");
    expect(latestBoardDefinition?.clues[0]?.response).toBe("Sample answer 1-1");
  });

  test("hides the autofill action outside dev mode", () => {
    render(BoardEditor, {
      props: {
        boardDefinition: createBoardDefinition(),
        showDevAutofill: false,
      },
    });

    expect(screen.queryByRole("button", { name: "Fill sample board" })).toBeNull();
  });
});
