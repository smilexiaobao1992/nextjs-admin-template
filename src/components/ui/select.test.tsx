import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Select } from "./select";

describe("select", () => {
  it("uses a Radix trigger while preserving native form submission", () => {
    const { container } = render(
      <form>
        <Select name="role" defaultValue="member" aria-label="角色">
          <option value="member">成员</option>
          <option value="admin">管理员</option>
        </Select>
      </form>,
    );

    const trigger = screen.getByRole("combobox", { name: "角色" });
    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger).toHaveAttribute("data-state", "closed");
    expect(new FormData(container.querySelector("form")!).get("role")).toBe("member");
  });
});
