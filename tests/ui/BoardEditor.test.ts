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

  test("resizes the board and preserves existing clues by position", async () => {
    const updates: Array<ReturnType<typeof createBoardDefinition>> = [];
    const boardDefinition = createBoardDefinition();

    boardDefinition.clues[0] = {
      ...boardDefinition.clues[0]!,
      prompt: "Saved question",
    };

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
    expect(screen.getAllByLabelText(/Question text/i)).toHaveLength(6);
  });
});
