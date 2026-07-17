"use client";

import { useState } from "react";
import AppSidebar from "./app-sidebar";
import UserHeader from "./user-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { NavMenuItem } from "@/lib/rbac/permissions";

type ShellUser = {
  name: string;
  email: string;
  role: string;
  roleLabel?: string;
};

export default function AppShell({
  user,
  menus,
  children,
}: {
  user: ShellUser;
  menus: NavMenuItem[];
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only z-[100] rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        跳到主要内容
      </a>

      <div className={cn("hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:block", collapsed ? "md:w-20" : "md:w-64")}>
        <AppSidebar items={menus} collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      </div>

      <div className={cn("min-h-screen bg-background", collapsed ? "md:pl-20" : "md:pl-64")}>
        <UserHeader user={user} onOpenNavigation={() => setMobileOpen(true)} />
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-7xl px-4 py-7 outline-none sm:px-6 sm:py-9 lg:px-8 lg:py-10"
        >
          {children}
        </main>
      </div>

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent className="left-0 top-0 h-dvh w-[min(18rem,82vw)] max-w-none translate-x-0 translate-y-0 gap-0 rounded-none border-0 p-0">
          <DialogTitle className="sr-only">移动导航</DialogTitle>
          <DialogDescription className="sr-only">选择要打开的后台页面</DialogDescription>
          <AppSidebar items={menus} label="移动导航" onNavigate={() => setMobileOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
