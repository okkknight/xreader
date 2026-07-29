import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { AppShell } from "@/components/ui/app-shell";

it("renders product identity and supplied children", () => {
  render(
    <AppShell>
      <p>content</p>
    </AppShell>,
  );

  expect(screen.getByRole("banner")).toHaveTextContent("XReader");
  expect(screen.getByText("content")).toBeVisible();
});
