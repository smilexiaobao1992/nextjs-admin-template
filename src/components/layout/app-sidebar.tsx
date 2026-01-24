"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Settings,
  FolderKanban,
  FileText,
  Users,
  Package,
} from "lucide-react";

interface NavItem {
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
}

// 示例导航配置 - 请根据实际业务需求修改
const navItems: NavItem[] = [
  { name: "Dashboard", href: "/app", icon: LayoutDashboard },
  {
    name: "示例模块",
    icon: FolderKanban,
    children: [
      { name: "内容管理", href: "/app/content", icon: FileText },
      { name: "用户管理", href: "/app/users", icon: Users },
      { name: "产品管理", href: "/app/products", icon: Package },
    ],
  },
];

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const pathname = usePathname();

  // 切换子菜单展开/收起
  const toggleMenu = (name: string) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(name)) {
        newSet.delete(name);
      } else {
        newSet.add(name);
      }
      return newSet;
    });
  };

  // 检查菜单项是否激活
  const isActive = (href: string) => {
    return pathname === href || (href !== "/app" && pathname.startsWith(href + "/"));
  };

  // 检查子菜单是否有激活项
  const hasActiveChild = (item: NavItem) => {
    if (!item.children) return false;
    return item.children.some((child) => child.href && isActive(child.href));
  };

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-40 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      {/* 折叠按钮 */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm z-50"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        )}
      </button>

      {/* Logo 区域 - 请修改为你的项目名称 */}
      <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
        {!collapsed ? (
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">Admin系统</h1>
        ) : (
          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">A</span>
        )}
      </div>

      {/* 导航菜单 */}
      <nav className="p-3 space-y-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 8rem)" }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedMenus.has(item.name);
          const hasActive = hasActiveChild(item);
          const isDirectActive = item.href && isActive(item.href);

          // 一级菜单项（无子菜单）
          if (!hasChildren) {
            return (
              <Link
                key={item.name}
                href={item.href!}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isDirectActive
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                title={collapsed ? item.name : ""}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isDirectActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`} />
                {!collapsed && (
                  <span className="font-medium text-sm">{item.name}</span>
                )}
              </Link>
            );
          }

          // 一级菜单项（有子菜单）
          return (
            <div key={item.name}>
              {/* 父菜单 */}
              <button
                onClick={() => !collapsed && toggleMenu(item.name)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  hasActive
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                title={collapsed ? item.name : ""}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 flex-shrink-0 ${hasActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`} />
                  {!collapsed && (
                    <span className="font-medium text-sm">{item.name}</span>
                  )}
                </div>
                {!collapsed && (
                  <ChevronDown
                    className={`w-4 h-4 flex-shrink-0 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>

              {/* 子菜单 */}
              {!collapsed && isExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.children?.map((child) => {
                    const ChildIcon = child.icon;
                    const isChildActive = child.href && isActive(child.href);

                    return (
                      <Link
                        key={child.name}
                        href={child.href!}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isChildActive
                            ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        <ChildIcon className={`w-4 h-4 flex-shrink-0 ${isChildActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"}`} />
                        <span className="text-sm">{child.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* 底部设置 */}
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200 dark:border-gray-700">
        <Link
          href="/app/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            pathname === "/app/settings"
              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
          title={collapsed ? "设置" : ""}
        >
          <Settings className={`w-5 h-5 flex-shrink-0 ${
            pathname === "/app/settings" ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
          }`} />
          {!collapsed && (
            <span className="font-medium text-sm">设置</span>
          )}
        </Link>
      </div>
    </div>
  );
}
