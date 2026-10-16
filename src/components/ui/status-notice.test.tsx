import { render, screen } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StatusNotice } from "./status-notice";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const messages = {
  created: "创建成功。",
  duplicate_key: "标识已存在。",
};

describe("StatusNotice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/app/roles?page=2&notice=created");
  });

  it("renders status banner, fires success toast, and strips notice query param", () => {
    const replaceSpy = vi.spyOn(window.history, "replaceState");

    render(<StatusNotice notice="created" messages={messages} />);

    expect(screen.getByRole("status")).toHaveTextContent("创建成功。");
    expect(toast.success).toHaveBeenCalledWith("创建成功。", {
      id: "notice:created",
    });
    expect(replaceSpy).toHaveBeenCalledWith({}, "", "/app/roles?page=2");
  });

  it("renders alert banner and fires error toast for non-success notice keys", () => {
    window.history.replaceState({}, "", "/app/roles?notice=duplicate_key");

    render(<StatusNotice notice="duplicate_key" messages={messages} />);

    expect(screen.getByRole("alert")).toHaveTextContent("标识已存在。");
    expect(toast.error).toHaveBeenCalledWith("标识已存在。", {
      id: "notice:duplicate_key",
    });
  });

  it("renders nothing when notice is missing or unknown", () => {
    const { container } = render(
      <StatusNotice notice="unknown" messages={messages} />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
