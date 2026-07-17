import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmSubmitButton } from "./confirm-submit-button";

describe("ConfirmSubmitButton", () => {
  it("does not submit when the user cancels confirmation", () => {
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
    vi.spyOn(window, "confirm").mockReturnValue(false);

    render(
      <form onSubmit={submit}>
        <ConfirmSubmitButton confirmMessage="确认删除？">删除</ConfirmSubmitButton>
      </form>,
    );

    fireEvent.click(screen.getByRole("button", { name: "删除" }));
    expect(submit).not.toHaveBeenCalled();
  });

  it("submits after confirmation", () => {
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <form onSubmit={submit}>
        <ConfirmSubmitButton confirmMessage="确认删除？">删除</ConfirmSubmitButton>
      </form>,
    );

    fireEvent.click(screen.getByRole("button", { name: "删除" }));
    expect(submit).toHaveBeenCalledTimes(1);
  });
});
