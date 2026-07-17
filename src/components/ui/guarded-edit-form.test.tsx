import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GuardedEditForm } from "./guarded-edit-form";

describe("guarded RBAC editing", () => {
  it("asks before leaving a dirty editor", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
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
    expect(confirm).toHaveBeenCalledWith("当前修改尚未保存，确认放弃并切换吗？");
  });
});
