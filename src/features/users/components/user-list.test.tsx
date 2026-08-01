import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UserList } from "./user-list";

vi.mock("@/features/users/actions", () => ({
  setUserRoleAction: vi.fn(),
  setUserBannedAction: vi.fn(),
  resetUserPasswordAction: vi.fn(),
  revokeUserSessionsAction: vi.fn(),
}));

const user = {
  id: "user-1",
  name: "只读成员",
  email: "readonly@example.com",
  emailVerified: false,
  image: null,
  role: "member",
  banned: false,
  banReason: null,
  banExpires: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

const roles = [
  {
    id: "role-member",
    key: "member",
    name: "普通成员",
    description: null,
    isSystem: false,
    isDefault: true,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  },
  {
    id: "role-ops",
    key: "ops",
    name: "高级运营",
    description: null,
    isSystem: false,
    isDefault: false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  },
];

describe("UserList", () => {
  it("renders role information without mutation controls for read-only users", () => {
    render(<UserList users={[user]} roles={roles} canWrite={false} total={1} />);

    expect(screen.getByText("普通成员")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "保存角色" })).not.toBeInTheDocument();
  });

  it("shows only roles the server marked assignable", () => {
    render(
      <UserList
        users={[user]}
        roles={roles}
        assignableRoles={[roles[0]]}
        canWrite
        total={1}
      />,
    );

    expect(screen.getByRole("option", { name: "普通成员", hidden: true })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "高级运营", hidden: true })).not.toBeInTheDocument();
  });

  it("hides mutation controls for the current user row", () => {
    render(
      <UserList
        users={[user]}
        roles={roles}
        canWrite
        currentUserId={user.id}
        total={1}
      />,
    );

    expect(screen.getByText("当前登录账号")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "封禁" })).not.toBeInTheDocument();
  });
});
