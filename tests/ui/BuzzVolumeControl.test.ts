import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, test, vi } from "vitest";

import BuzzVolumeControl from "src/features/shared/BuzzVolumeControl.svelte";

describe("BuzzVolumeControl", () => {
  test("reveals the slider from a speaker toggle and hides it again", async () => {
    const onChange = vi.fn();

    const { container } = render(BuzzVolumeControl, {
      props: {
        value: 0.5,
        onChange,
      },
    });

    const root = container.querySelector(".buzz-volume");
    expect(root).toBeTruthy();
    expect(screen.queryByText("Buzzer volume 50%")).toBeNull();

    await fireEvent.mouseEnter(root!);
    await fireEvent.click(screen.getByRole("button", { name: "Toggle buzzer volume" }));

    expect(screen.getByText("Buzzer volume 50%")).toBeTruthy();

    const slider = screen.getByLabelText("Buzzer volume") as HTMLInputElement;
    await fireEvent.input(slider, { target: { value: "25" } });

    expect(onChange).toHaveBeenCalledWith(0.25);

    await fireEvent.click(screen.getByRole("button", { name: "Toggle buzzer volume" }));
    expect(screen.queryByText("Buzzer volume 50%")).toBeNull();

    await fireEvent.click(screen.getByRole("button", { name: "Toggle buzzer volume" }));
    expect(screen.getByText("Buzzer volume 50%")).toBeTruthy();

    await fireEvent.mouseLeave(root!);
    expect(screen.queryByText("Buzzer volume 50%")).toBeNull();
  });

  test("tracks hover state for the semi-transparent speaker icon", async () => {
    const { container } = render(BuzzVolumeControl, {
      props: {
        value: 0.5,
      },
    });

    const root = container.querySelector(".buzz-volume");
    const button = screen.getByRole("button", { name: "Toggle buzzer volume" });

    expect(button.className).not.toContain("buzz-volume__toggle--hovered");

    await fireEvent.mouseEnter(root!);
    expect(button.className).toContain("buzz-volume__toggle--hovered");

    await fireEvent.mouseLeave(root!);
    expect(button.className).not.toContain("buzz-volume__toggle--hovered");
  });
});
