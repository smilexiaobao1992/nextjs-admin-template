import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UserList } from "./user-list";

vi.mock("@/features/users/actions", () => ({
  setUserRolesAction: vi.fn(),
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
    expect(screen.queryByRole("button", { name: "管理 readonly@example.com" })).not.toBeInTheDocument();
  });

  it("shows only roles the server marked assignable inside the management dialog", async () => {
    const interaction = userEvent.setup();
    render(
      <UserList
        users={[user]}
        roles={roles}
        assignableRoles={[roles[0]]}
        canWrite
        total={1}
      />,
    );

    await interaction.click(screen.getByRole("button", { name: "管理 readonly@example.com" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "普通成员" })).toBeChecked();
    expect(screen.queryByRole("checkbox", { name: "高级运营" })).not.toBeInTheDocument();
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
    expect(screen.queryByRole("button", { name: "管理 readonly@example.com" })).not.toBeInTheDocument();
  });

  it("shows out-of-scope target users as read-only", () => {
    render(
      <UserList
        users={[user]}
        roles={roles}
        canWrite
        manageableUserIds={new Set()}
        total={1}
      />,
    );

    expect(screen.getByText("只读")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "管理 readonly@example.com" })).not.toBeInTheDocument();
  });

  it("renders and preselects all assigned roles", async () => {
    const interaction = userEvent.setup();
    render(
      <UserList
        users={[{ ...user, role: "member,ops" }]}
        roles={roles}
        canWrite
        total={1}
      />,
    );

    expect(screen.getByText("普通成员、高级运营")).toBeInTheDocument();
    await interaction.click(screen.getByRole("button", { name: "管理 readonly@example.com" }));
    expect(screen.getByRole("checkbox", { name: "普通成员" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "高级运营" })).toBeChecked();
  });

  it("keeps multiple role checkboxes selected at the same time", async () => {
    const interaction = userEvent.setup();
    render(<UserList users={[user]} roles={roles} canWrite total={1} />);

    await interaction.click(screen.getByRole("button", { name: "管理 readonly@example.com" }));
    await interaction.click(screen.getByRole("checkbox", { name: "高级运营" }));

    expect(screen.getByRole("checkbox", { name: "普通成员" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "高级运营" })).toBeChecked();
    expect(screen.getByText("已选择 2 个角色")).toBeInTheDocument();
  });
});
