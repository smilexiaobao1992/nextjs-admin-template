import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MenuGrantTree, toggleGrant, type GrantTreeNode } from "./menu-grant-tree";

const nodes: GrantTreeNode[] = [
  { id: "dashboard", parentId: null, type: "page", title: "概览", permissionKey: "dashboard:view", sortOrder: 10 },
  { id: "settings", parentId: null, type: "directory", title: "系统设置", permissionKey: null, sortOrder: 20 },
  { id: "users", parentId: "settings", type: "page", title: "用户", permissionKey: "users:read", sortOrder: 21 },
  { id: "users-write", parentId: "users", type: "action", title: "管理用户", permissionKey: "users:write", sortOrder: 1 },
  { id: "help", parentId: "settings", type: "page", title: "帮助", permissionKey: null, sortOrder: 22 },
];

function submittedIds(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLInputElement>('input[name="menuIds"]')].map((input) => input.value).sort();
}

describe("toggleGrant", () => {
  it("grants the parent page together with an action", () => {
    expect([...toggleGrant(nodes, new Set(), "users-write", true)].sort()).toEqual(["users", "users-write"]);
  });

  it("revokes a page's actions together with the page", () => {
    expect([...toggleGrant(nodes, new Set(["users", "users-write"]), "users", false)]).toEqual([]);
  });

  it("ignores nodes without a permission key", () => {
    expect([...toggleGrant(nodes, new Set(), "help", true)]).toEqual([]);
  });
});

describe("MenuGrantTree", () => {
  it("submits linked grants and selects a whole directory", async () => {
    const user = userEvent.setup();
    const { container } = render(<MenuGrantTree nodes={nodes} grantedIds={[]} editableIds={null} />);

    await user.click(screen.getByRole("checkbox", { name: /管理用户/ }));
    expect(submittedIds(container)).toEqual(["users", "users-write"]);

    await user.click(screen.getByRole("checkbox", { name: /用户\s*users:read/ }));
    expect(submittedIds(container)).toEqual([]);

    await user.click(screen.getByRole("checkbox", { name: "全选系统设置" }));
    expect(submittedIds(container)).toEqual(["users", "users-write"]);
  });

  it("locks nodes outside the actor's scope", () => {
    render(<MenuGrantTree nodes={nodes} grantedIds={[]} editableIds={["dashboard"]} />);

    expect(screen.getByRole("checkbox", { name: /概览/ })).toBeEnabled();
    expect(screen.getByRole("checkbox", { name: /管理用户/ })).toBeDisabled();
  });
});
