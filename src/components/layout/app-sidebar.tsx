"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createElement, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveMenuIcon } from "@/components/layout/menu-icons";
import { cn } from "@/lib/utils";
import type { NavMenuItem } from "@/lib/rbac/permissions";

function MenuIcon({ name, className }: { name: string | null | undefined; className?: string }) {
  return createElement(resolveMenuIcon(name), {
    "aria-hidden": true,
    className,
  });
}

type AppSidebarProps = {
  items: NavMenuItem[];
  collapsed?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
  label?: string;
};

function isPathActive(pathname: string, href: string) {
  if (!href) {
    return false;
  }
  return pathname === href || (href !== "/app" && pathname.startsWith(`${href}/`));
}

function isGroupActive(pathname: string, item: NavMenuItem): boolean {
  if (isPathActive(pathname, item.href)) {
    return true;
  }
  return Boolean(item.children?.some((child) => isGroupActive(pathname, child)));
}

function NavLink({
  item,
  pathname,
  collapsed,
  onNavigate,
  nested = false,
}: {
  item: NavMenuItem;
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
  nested?: boolean;
}) {
  const active = isPathActive(pathname, item.href);

  if (!item.href) {
    return null;
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? item.title : undefined}
      title={collapsed ? item.title : undefined}
      className={cn(
        "flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-[background-color,color,box-shadow,transform] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        active
          ? "bg-primary text-primary-foreground shadow-[0_7px_18px_rgba(113,42,22,0.24)]"
          : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        collapsed && "justify-center px-0",
        nested && !collapsed && "pl-8",
      )}
    >
      <MenuIcon name={item.icon} className="size-4 shrink-0" />
      {collapsed ? null : <span className="min-w-0 truncate">{item.title}</span>}
    </Link>
  );
}

function NavGroup({
  item,
  pathname,
  collapsed,
  onNavigate,
}: {
  item: NavMenuItem;
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const children = item.children ?? [];
  const groupActive = isGroupActive(pathname, item);
  const [open, setOpen] = useState(groupActive);
  const [closedOnPath, setClosedOnPath] = useState<string | null>(null);
  const expanded = open || (groupActive && closedOnPath !== pathname);
  const toggleExpanded = () => {
    if (expanded) {
      setOpen(false);
      setClosedOnPath(pathname);
    } else {
      setOpen(true);
      setClosedOnPath(null);
    }
  };

  if (children.length === 0) {
    return <NavLink item={item} pathname={pathname} collapsed={collapsed} onNavigate={onNavigate} />;
  }

  if (collapsed) {
    // Collapsed rail: jump to the first child (or parent href if present).
    const target = item.href || children[0]?.href || "/app";
    return (
      <Link
        href={target}
        onClick={onNavigate}
        aria-label={item.title}
        title={item.title}
        className={cn(
          "flex min-h-10 items-center justify-center rounded-lg text-sm font-medium transition-[background-color,color,box-shadow,transform] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          groupActive
            ? "bg-primary text-primary-foreground shadow-[0_7px_18px_rgba(113,42,22,0.24)]"
            : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        )}
      >
        <MenuIcon name={item.icon} className="size-4 shrink-0" />
      </Link>
    );
  }

  return (
    <div className="space-y-1">
      <div
        className={cn(
          "flex min-h-10 items-center rounded-lg text-sm font-medium transition-[background-color,color]",
          groupActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        )}
      >
        {item.href ? (
          <Link
            href={item.href}
            onClick={onNavigate}
            aria-current={isPathActive(pathname, item.href) ? "page" : undefined}
            className="flex min-h-10 min-w-0 flex-1 items-center gap-3 rounded-l-lg px-3 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <MenuIcon name={item.icon} className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate text-left">{item.title}</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={toggleExpanded}
            aria-expanded={expanded}
            className="flex min-h-10 min-w-0 flex-1 items-center gap-3 rounded-lg px-3 text-left transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <MenuIcon name={item.icon} className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate text-left">{item.title}</span>
            <ChevronDown
              aria-hidden="true"
              className={cn("size-4 shrink-0 transition-transform", expanded ? "rotate-0" : "-rotate-90")}
            />
          </button>
        )}
        {item.href ? (
          <button
            type="button"
            onClick={toggleExpanded}
            aria-expanded={expanded}
            aria-label={`${expanded ? "收起" : "展开"}${item.title}`}
            className="flex size-10 shrink-0 items-center justify-center rounded-r-lg transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <ChevronDown
              aria-hidden="true"
              className={cn("size-4 transition-transform", expanded ? "rotate-0" : "-rotate-90")}
            />
          </button>
        ) : null}
      </div>
      {expanded ? (
        <div className="ml-4 space-y-1 pl-1" role="group" aria-label={item.title}>
          {children.map((child) => (
            <NavLink
              key={child.id}
              item={child}
              pathname={pathname}
              collapsed={collapsed}
              onNavigate={onNavigate}
              nested
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function AppSidebar({
  items,
  collapsed = false,
  onToggle,
  onNavigate,
  label = "主导航",
}: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className={cn("relative flex h-16 items-center", collapsed ? "justify-center px-2" : "px-4")}>
        <Link
          href="/app"
          onClick={onNavigate}
          aria-label={collapsed ? "管理中心首页" : undefined}
          className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck aria-hidden="true" className="size-5" />
          </span>
          {collapsed ? null : (
            <span className="truncate text-sm font-semibold tracking-[-0.012em] text-sidebar-foreground">管理中心</span>
          )}
        </Link>

        {onToggle ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={collapsed ? "展开侧栏" : "收起侧栏"}
            title={collapsed ? "展开侧栏" : "收起侧栏"}
            onClick={onToggle}
            className="absolute right-0 top-1/2 z-10 h-10 w-10 -translate-y-1/2 translate-x-1/2 rounded-full bg-sidebar-accent text-sidebar-muted shadow-[0_6px_18px_rgba(18,16,14,0.28)] hover:bg-primary hover:text-primary-foreground focus-visible:ring-sidebar-ring"
          >
            {collapsed ? <ChevronRight aria-hidden="true" /> : <ChevronLeft aria-hidden="true" />}
          </Button>
        ) : null}
      </div>

      <nav aria-label={label} className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.length > 0 ? (
          items.map((item) => (
            <NavGroup
              key={item.id}
              item={item}
              pathname={pathname}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))
        ) : collapsed ? null : (
          <p className="px-3 py-6 text-center text-sm text-sidebar-muted">暂无可访问菜单</p>
        )}
      </nav>
    </div>
  );
}
