import { fireEvent, render, screen } from "@testing-library/react";
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

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const password = screen.getByLabelText("密码");
    expect(password).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "显示密码" }));
    expect(password).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: "隐藏密码" }));
    expect(password).toHaveAttribute("type", "password");
  });

  it("logs in through Better Auth and returns to a safe local path", async () => {
    const user = userEvent.setup();
    render(<LoginForm nextPath="/app/users" />);

    fireEvent.change(screen.getByLabelText("邮箱"), { target: { value: "admin@example.com" } });
    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "admin-template-2026" } });
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

    fireEvent.change(screen.getByLabelText("邮箱"), { target: { value: "admin@example.com" } });
    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "wrong-password-1" } });
    await user.click(screen.getByRole("button", { name: "登录" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("邮箱或密码不正确");
    expect(screen.queryByText("internal detail")).not.toBeInTheDocument();
  });

  it.each([
    [{ status: 429, message: "Too many requests" }, "登录尝试过于频繁"],
    [{ status: 403, code: "BANNED_USER", message: "banned" }, "该账号已被停用"],
  ])("distinguishes rate limiting and banned accounts", async (error, expected) => {
    signIn.mockResolvedValue({ data: null, error });
    const user = userEvent.setup();
    render(<LoginForm nextPath="/app/users" />);

    fireEvent.change(screen.getByLabelText("邮箱"), { target: { value: "admin@example.com" } });
    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "admin-template-2026" } });
    await user.click(screen.getByRole("button", { name: "登录" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(expected);
  });
});
