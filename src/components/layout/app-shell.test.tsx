import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AppShell from "./app-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/users",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: { signOut: vi.fn() },
}));

const baseMenus = [
  { id: "m1", title: "概览", href: "/app", icon: "LayoutDashboard" },
];

describe("app shell", () => {
  it("labels the primary navigation and mobile menu", () => {
    render(
      <AppShell
        user={{ name: "普通用户", email: "user@example.com", role: "member" }}
        menus={baseMenus}
      >
        <p>页面内容</p>
      </AppShell>,
    );

    expect(screen.getByRole("navigation", { name: "主导航" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "打开导航" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "概览" })).toHaveAttribute("href", "/app");
    expect(screen.queryByRole("link", { name: "用户" })).not.toBeInTheDocument();
    expect(screen.getByText("页面内容")).toBeInTheDocument();
  });

  it("renders nested system settings menus for the current role", () => {
    render(
      <AppShell
        user={{ name: "管理员", email: "admin@example.com", role: "admin" }}
        menus={[
          ...baseMenus,
          {
            id: "settings",
            title: "系统设置",
            href: "",
            icon: "Settings",
            children: [
              { id: "m2", title: "用户", href: "/app/users", icon: "Users" },
              { id: "m3", title: "角色", href: "/app/roles", icon: "Shield" },
            ],
          },
        ]}
      >
        <p>页面内容</p>
      </AppShell>,
    );

    expect(screen.getByRole("button", { name: /系统设置/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "用户" })).toHaveAttribute("href", "/app/users");
    expect(screen.getByRole("link", { name: "角色" })).toHaveAttribute("href", "/app/roles");

    fireEvent.click(screen.getByRole("button", { name: "收起系统设置" }));
    expect(screen.getByRole("button", { name: "展开系统设置" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "用户" })).not.toBeInTheDocument();
  });
});
