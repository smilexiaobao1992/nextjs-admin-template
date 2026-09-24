import { and, asc, eq, inArray, isNotNull } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/lib/db";
import { menu, role, roleMenu } from "@/lib/db/schema";
import { hasSystemAdminRole, parseRoleKeys } from "./role-keys";

export function isSystemAdminRole(roleKey: string | null | undefined): boolean {
  return hasSystemAdminRole(roleKey);
}

export async function listRolesForRoleValue(roleValue: string) {
  const roleKeys = parseRoleKeys(roleValue);
  if (roleKeys.length === 0) {
    return [];
  }
  return db.select().from(role).where(inArray(role.key, roleKeys)).orderBy(asc(role.name));
}

export const listPermissionKeysForRoleKey = cache(async function listPermissionKeysForRoleKey(roleKey: string): Promise<Set<string>> {
  if (isSystemAdminRole(roleKey)) {
    const all = await db
      .select({ key: menu.permissionKey })
      .from(menu)
      .where(isNotNull(menu.permissionKey));
    return new Set(all.map((item) => item.key!));
  }

  const roleKeys = parseRoleKeys(roleKey);
  if (roleKeys.length === 0) {
    return new Set();
  }

  const rows = await db
    .select({ key: menu.permissionKey })
    .from(role)
    .innerJoin(roleMenu, eq(roleMenu.roleId, role.id))
    .innerJoin(menu, eq(menu.id, roleMenu.menuId))
    .where(and(inArray(role.key, roleKeys), isNotNull(menu.permissionKey)));

  return new Set(rows.map((item) => item.key!));
});

export async function roleHasPermission(roleKey: string, permissionKey: string): Promise<boolean> {
  if (isSystemAdminRole(roleKey)) {
    return true;
  }

  const keys = await listPermissionKeysForRoleKey(roleKey);
  return keys.has(permissionKey);
}

export type NavMenuItem = {
  id: string;
  title: string;
  href: string;
  icon: string | null;
  children?: NavMenuItem[];
};

function byOrder(a: { sortOrder: number; title: string }, b: { sortOrder: number; title: string }) {
  return a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "zh-CN");
}

/** Sidebar tree: visible pages the role may open, grouped under directories that still have children. */
export async function listMenusForRoleKey(roleKey: string): Promise<NavMenuItem[]> {
  const rows = await db
    .select({
      id: menu.id,
      parentId: menu.parentId,
      type: menu.type,
      title: menu.title,
      href: menu.href,
      icon: menu.icon,
      permissionKey: menu.permissionKey,
      sortOrder: menu.sortOrder,
    })
    .from(menu)
    .where(and(eq(menu.isVisible, true), inArray(menu.type, ["directory", "page"])));

  const allowed = isSystemAdminRole(roleKey) ? null : await listPermissionKeysForRoleKey(roleKey);
  const pages = rows.filter(
    (item) => item.type === "page" && (!item.permissionKey || allowed === null || allowed.has(item.permissionKey)),
  );
  const toItem = (item: (typeof rows)[number]): NavMenuItem => ({
    id: item.id,
    title: item.title,
    href: item.href,
    icon: item.icon,
  });

  const roots = [
    ...pages.filter((item) => !item.parentId),
    ...rows.filter((item) => item.type === "directory"),
  ].sort(byOrder);

  return roots.flatMap((item) => {
    if (item.type === "page") {
      return [toItem(item)];
    }
    const children = pages.filter((page) => page.parentId === item.id).sort(byOrder).map(toItem);
    return children.length > 0 ? [{ ...toItem(item), children }] : [];
  });
}

export async function listAllRoles() {
  return db.select().from(role).orderBy(asc(role.name));
}

export async function listAllMenus() {
  return db.select().from(menu).orderBy(asc(menu.sortOrder), asc(menu.title));
}

export type MenuNode = Awaited<ReturnType<typeof listAllMenus>>[number];

export async function listMenuIdsByRole(): Promise<Record<string, string[]>> {
  const rows = await db.select({ roleId: roleMenu.roleId, menuId: roleMenu.menuId }).from(roleMenu);

  return rows.reduce<Record<string, string[]>>((grouped, row) => {
    (grouped[row.roleId] ??= []).push(row.menuId);
    return grouped;
  }, {});
}
