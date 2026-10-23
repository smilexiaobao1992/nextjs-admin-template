import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Avatar, getInitials } from "./avatar";
import { Badge } from "./badge";
import { Checkbox } from "./checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { EmptyState } from "./empty-state";
import { Separator } from "./separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";
import { Skeleton } from "./skeleton";
import { StatCard } from "./stat-card";
import { Switch } from "./switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Textarea } from "./textarea";

describe("UI primitives", () => {
  it("renders Badge variants with data attributes", () => {
    render(
      <div>
        <Badge variant="success">正常</Badge>
        <Badge variant="destructive">已封禁</Badge>
      </div>,
    );

    expect(screen.getByText("正常")).toHaveAttribute("data-variant", "success");
    expect(screen.getByText("已封禁")).toHaveAttribute(
      "data-variant",
      "destructive",
    );
  });

  it("renders Textarea and forwards input props", () => {
    render(
      <Textarea
        aria-label="角色描述"
        defaultValue="初始描述"
        maxLength={200}
      />,
    );

    const textarea = screen.getByRole("textbox", { name: "角色描述" });
    expect(textarea).toHaveValue("初始描述");
    expect(textarea).toHaveAttribute("maxLength", "200");
  });

  it("toggles Checkbox and Switch state", () => {
    const onCheckboxChange = vi.fn();
    const onSwitchChange = vi.fn();

    render(
      <div>
        <Checkbox aria-label="勾选权限" onChange={onCheckboxChange} />
        <Switch aria-label="启用状态" onChange={onSwitchChange} />
      </div>,
    );

    const checkbox = screen.getByRole("checkbox", { name: "勾选权限" });
    fireEvent.click(checkbox);
    expect(onCheckboxChange).toHaveBeenCalledTimes(1);
    expect(checkbox).toBeChecked();

    const switchEl = screen.getByRole("switch", { name: "启用状态" });
    fireEvent.click(switchEl);
    expect(onSwitchChange).toHaveBeenCalledTimes(1);
    expect(switchEl).toBeChecked();
  });

  it("renders Tabs and switches active tab content", () => {
    render(
      <Tabs defaultValue="basic">
        <TabsList>
          <TabsTrigger value="basic">基础设置</TabsTrigger>
          <TabsTrigger value="security">安全设置</TabsTrigger>
        </TabsList>
        <TabsContent value="basic">基础表单内容</TabsContent>
        <TabsContent value="security">安全表单内容</TabsContent>
      </Tabs>,
    );

    expect(screen.getByText("基础表单内容")).toBeVisible();
    const securityTab = screen.getByRole("tab", { name: "安全设置" });
    fireEvent.click(securityTab);
    expect(screen.getByText("安全表单内容")).toBeVisible();
  });

  it("renders DropdownMenu, navigates items via keyboard, and closes on selection", () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <button type="button">更多操作</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>账号操作</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>编辑资料</DropdownMenuItem>
          <DropdownMenuItem variant="destructive">禁用账号</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    const menu = screen.getByRole("menu");
    const editItem = screen.getByRole("menuitem", { name: "编辑资料" });
    const disableItem = screen.getByRole("menuitem", { name: "禁用账号" });

    expect(screen.getByText("账号操作")).toBeInTheDocument();
    expect(disableItem).toHaveAttribute("data-variant", "destructive");

    fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(editItem).toHaveFocus();

    fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(disableItem).toHaveFocus();

    fireEvent.keyDown(menu, { key: "ArrowUp" });
    expect(editItem).toHaveFocus();

    fireEvent.click(editItem);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("renders Avatar initials, EmptyState, StatCard, Skeleton, Separator, and Sheet", () => {
    expect(getInitials("Admin User")).toBe("AU");
    expect(getInitials("管理员")).toBe("管");

    render(
      <div>
        <Avatar name="Admin User" />
        <StatCard label="活跃会话" value={12} detail="正常在线" />
        <EmptyState title="暂无记录" description="稍后再来看看" />
        <Skeleton data-testid="skeleton-box" className="h-4 w-20" />
        <Separator decorative={false} />
        <Sheet>
          <SheetTrigger asChild>
            <button type="button">查看抽屉</button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>审计详情</SheetTitle>
              <SheetDescription>查看完整元数据</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </div>,
    );

    expect(screen.getByText("AU")).toBeInTheDocument();
    expect(screen.getByText("活跃会话")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("暂无记录")).toBeInTheDocument();
    expect(screen.getByTestId("skeleton-box")).toBeInTheDocument();
    expect(screen.getByRole("separator")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "查看抽屉" }));
    expect(screen.getByText("审计详情")).toBeInTheDocument();
  });
});
