import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GuardedEditForm } from "./guarded-edit-form";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("guarded RBAC editing", () => {
  it("asks in the themed dialog before leaving a dirty editor", () => {
    render(
      <>
        <GuardedEditForm>
          <input aria-label="名称" />
        </GuardedEditForm>
        <a href="/app">应用概览</a>
      </>,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "名称" }), { target: { value: "changed" } });
    expect(fireEvent.click(screen.getByRole("link", { name: "应用概览" }))).toBe(false);
    expect(screen.getByRole("dialog", { name: "放弃未保存的修改？" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "继续编辑" }));
    expect(push).not.toHaveBeenCalled();
  });

  it("continues the pending navigation after confirmation", () => {
    render(
      <>
        <GuardedEditForm>
          <input aria-label="名称" />
        </GuardedEditForm>
        <a href="/app">应用概览</a>
      </>,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "名称" }), { target: { value: "changed" } });
    fireEvent.click(screen.getByRole("link", { name: "应用概览" }));
    fireEvent.click(screen.getByRole("button", { name: "放弃修改" }));

    expect(push).toHaveBeenCalledWith("/app");
  });
});
