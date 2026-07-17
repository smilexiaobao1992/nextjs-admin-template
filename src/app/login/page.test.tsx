import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginForm from "./login-form";

const { push, refresh, signIn } = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: { email: signIn },
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("login page", () => {
  beforeEach(() => {
    signIn.mockResolvedValue({ data: {}, error: null });
  });

  it("exposes accessible credential fields without a public registration link", () => {
    render(<LoginForm nextPath="/app/users" />);

    expect(screen.getByLabelText("邮箱")).toHaveAttribute("name", "email");
    expect(screen.getByLabelText("邮箱")).toHaveAttribute("autocomplete", "email");
    expect(screen.getByLabelText("密码")).toHaveAttribute("autocomplete", "current-password");
    expect(screen.queryByRole("link", { name: /注册/ })).not.toBeInTheDocument();
  });

  it("logs in through Better Auth and returns to a safe local path", async () => {
    const user = userEvent.setup();
    render(<LoginForm nextPath="/app/users" />);

    await user.type(screen.getByLabelText("邮箱"), "admin@example.com");
    await user.type(screen.getByLabelText("密码"), "admin-template-2026");
    await user.click(screen.getByRole("button", { name: "登录" }));

    expect(signIn).toHaveBeenCalledWith({
      email: "admin@example.com",
      password: "admin-template-2026",
    });
    expect(push).toHaveBeenCalledWith("/app/users");
    expect(refresh).toHaveBeenCalled();
  });

  it("announces a generic login error", async () => {
    signIn.mockResolvedValue({ data: null, error: { message: "internal detail" } });
    const user = userEvent.setup();
    render(<LoginForm nextPath="/app/users" />);

    await user.type(screen.getByLabelText("邮箱"), "admin@example.com");
    await user.type(screen.getByLabelText("密码"), "wrong-password-1");
    await user.click(screen.getByRole("button", { name: "登录" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("邮箱或密码不正确");
    expect(screen.queryByText("internal detail")).not.toBeInTheDocument();
  });
});
