"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminTheme } from "@/lib/admin-theme";
import type { NavMenuItem } from "@/lib/rbac/permissions";
import { SignOutButton } from "./sign-out-button";
import ThemeSwitcher from "./theme-switcher";

type HeaderUser = {
  name: string;
  email: string;
  role: string;
  roleLabel?: string;
};

const FALLBACK_BREADCRUMBS: Record<string, string[]> = {
  "/app": ["概览"],
  "/app/profile": ["账号设置", "个人中心"],
  "/app/users": ["系统设置", "用户"],
  "/app/roles": ["系统设置", "角色"],
  "/app/menus": ["系统设置", "菜单权限"],
  "/app/audit": ["系统设置", "审计日志"],
};

function findMenuTrail(
  items: NavMenuItem[],
  pathname: string,
  exactOnly: boolean,
  parents: string[] = [],
): string[] | null {
  for (const item of items) {
    const nextTrail = [...parents, item.title];
    const isMatch = exactOnly
      ? Boolean(item.href && pathname === item.href)
      : Boolean(
          item.href &&
            item.href !== "/app" &&
            pathname.startsWith(`${item.href}/`),
        );

    if (isMatch) {
      return nextTrail;
    }
    if (item.children?.length) {
      const childMatch = findMenuTrail(
        item.children,
        pathname,
        exactOnly,
        nextTrail,
      );
      if (childMatch) {
        return childMatch;
      }
    }
  }
  return null;
}

function resolveBreadcrumbTrail(
  pathname: string,
  menus: NavMenuItem[],
): string[] {
  const exactTrail = findMenuTrail(menus, pathname, true);
  if (exactTrail && exactTrail.length > 0) {
    return exactTrail;
  }

  const prefixTrail = findMenuTrail(menus, pathname, false);
  if (prefixTrail && prefixTrail.length > 0) {
    return prefixTrail;
  }

  return FALLBACK_BREADCRUMBS[pathname] ?? ["控制台"];
}

export default function UserHeader({
  user,
  menus = [],
  onOpenNavigation,
  theme,
  onThemeChange,
}: {
  user: HeaderUser;
  menus?: NavMenuItem[];
  onOpenNavigation: () => void;
  theme: AdminTheme;
  onThemeChange: (theme: AdminTheme) => void;
}) {
  const pathname = usePathname() ?? "/app";
  const breadcrumbs = resolveBreadcrumbTrail(pathname, menus);
  const initials = (user.name || user.email).slice(0, 2).toUpperCase();
  const roleLabel = user.roleLabel || user.role;

  return (
    <header className="admin-header sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border/70 bg-card/95 px-4 shadow-[0_1px_0_rgba(62,47,35,0.04),0_8px_24px_rgba(62,47,35,0.04)] sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="打开导航"
          onClick={onOpenNavigation}
        >
          <Menu aria-hidden="true" />
        </Button>

        <nav aria-label="面包屑" className="min-w-0">
          <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <Fragment key={`${index}-${crumb}`}>
                  {index > 0 ? (
                    <li aria-hidden="true" className="hidden sm:inline-flex">
                      <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" />
                    </li>
                  ) : null}
                  <li className={isLast ? "min-w-0" : "hidden min-w-0 sm:block"}>
                    <span
                      aria-current={isLast ? "page" : undefined}
                      className={
                        isLast
                          ? "block truncate font-medium text-foreground"
                          : "block truncate"
                      }
                    >
                      {crumb}
                    </span>
                  </li>
                </Fragment>
              );
            })}
          </ol>
        </nav>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-3">
        <ThemeSwitcher value={theme} onChange={onThemeChange} />
        <Link
          href="/app/profile"
          className="hidden rounded-lg px-2 py-1 text-right transition-[background-color] hover:bg-accent sm:block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title="个人中心"
        >
          <p className="max-w-56 truncate text-sm font-medium">{user.name || user.email}</p>
          <p className="max-w-56 truncate text-xs text-muted-foreground">{roleLabel}</p>
        </Link>
        <Link
          href="/app/profile"
          aria-label="个人中心"
          className="inline-flex size-9 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold text-primary transition-[transform,background-color] hover:bg-primary/18 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {initials}
        </Link>
        <SignOutButton />
      </div>
    </header>
  );
}
