import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmSubmitButton } from "./confirm-submit-button";

describe("ConfirmSubmitButton", () => {
  it("uses the themed dialog and does not submit when cancelled", () => {
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault());

    render(
      <form onSubmit={submit}>
        <ConfirmSubmitButton confirmMessage="确认删除？">删除</ConfirmSubmitButton>
      </form>,
    );

    fireEvent.click(screen.getByRole("button", { name: "删除" }));
    expect(screen.getByRole("dialog", { name: "确认操作" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    expect(submit).not.toHaveBeenCalled();
  });

  it("submits after confirming in the dialog", () => {
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault());

    render(
      <form onSubmit={submit}>
        <ConfirmSubmitButton confirmMessage="确认删除？">删除</ConfirmSubmitButton>
      </form>,
    );

    fireEvent.click(screen.getByRole("button", { name: "删除" }));
    fireEvent.click(screen.getByRole("button", { name: "确认" }));
    expect(submit).toHaveBeenCalledTimes(1);
  });
});
