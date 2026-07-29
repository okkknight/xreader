import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ModeSwitch } from "@/components/reader/mode-switch";

describe("ModeSwitch", () => {
  it("treats the current mode as a stable selected state instead of a replay action", () => {
    const onChange = vi.fn();
    render(<ModeSwitch mode="GUIDED" onChange={onChange} />);

    expect(screen.getByRole("button", { name: "讲解" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "阅读" })).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(screen.getByRole("button", { name: "讲解" }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
