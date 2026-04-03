import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, test, vi } from "vitest";

import TimedToast from "src/features/shared/TimedToast.svelte";

describe("TimedToast", () => {
  test("renders the provided message", () => {
    render(TimedToast, {
      props: {
        message: "Board saved.",
        tone: "success",
        onDismiss: vi.fn(),
      },
    });

    expect(screen.getByText("Board saved.")).toBeTruthy();
  });

  test("does not render when message is empty", () => {
    render(TimedToast, {
      props: {
        message: "",
        tone: "info",
        onDismiss: vi.fn(),
      },
    });

    expect(screen.queryByRole("status")).toBeNull();
  });

  test("calls onDismiss when dismiss button is clicked", async () => {
    const onDismiss = vi.fn();
    render(TimedToast, {
      props: {
        message: "Could not save board.",
        tone: "error",
        onDismiss,
      },
    });

    await fireEvent.click(screen.getByRole("button", { name: "Dismiss message" }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
