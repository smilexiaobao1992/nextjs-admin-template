import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { menu, permission, role, rolePermission } from "@/lib/db/schema";
import { SYSTEM_ADMIN_ROLE_KEY } from "./constants";

export function isSystemAdminRole(roleKey: string | null | undefined): boolean {
  return roleKey === SYSTEM_ADMIN_ROLE_KEY;
}

export async function getRoleByKey(roleKey: string) {
  const [row] = await db.select().from(role).where(eq(role.key, roleKey)).limit(1);
  return row ?? null;
}

export async function listPermissionKeysForRoleKey(roleKey: string): Promise<Set<string>> {
  if (isSystemAdminRole(roleKey)) {
    const all = await db.select({ key: permission.key }).from(permission);
    return new Set(all.map((item) => item.key));
  }

  const rows = await db
    .select({ key: permission.key })
    .from(role)
    .innerJoin(rolePermission, eq(rolePermission.roleId, role.id))
    .innerJoin(permission, eq(permission.id, rolePermission.permissionId))
    .where(eq(role.key, roleKey));

  return new Set(rows.map((item) => item.key));
}

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

type MenuRow = {
  id: string;
  parentId: string | null;
  title: string;
  href: string;
  icon: string | null;
  permissionKey: string | null;
  sortOrder: number;
};

function buildMenuTree(rows: MenuRow[]): NavMenuItem[] {
  const byParent = new Map<string | null, MenuRow[]>();

  for (const row of rows) {
    const key = row.parentId;
    const list = byParent.get(key) ?? [];
    list.push(row);
    byParent.set(key, list);
  }

  for (const list of byParent.values()) {
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "zh-CN"));
  }

  function toItems(parentId: string | null): NavMenuItem[] {
    return (byParent.get(parentId) ?? []).map((row) => {
      const children = toItems(row.id);
      return {
        id: row.id,
        title: row.title,
        href: row.href,
        icon: row.icon,
        ...(children.length > 0 ? { children } : {}),
      };
    });
  }

  return toItems(null);
}

export async function listMenusForRoleKey(roleKey: string): Promise<NavMenuItem[]> {
  const rows = await db
    .select({
      id: menu.id,
      parentId: menu.parentId,
      title: menu.title,
      href: menu.href,
      icon: menu.icon,
      permissionKey: permission.key,
      isVisible: menu.isVisible,
      sortOrder: menu.sortOrder,
    })
    .from(menu)
    .leftJoin(permission, eq(menu.permissionId, permission.id))
    .where(eq(menu.isVisible, true))
    .orderBy(asc(menu.sortOrder), asc(menu.title));

  const allowed = isSystemAdminRole(roleKey)
    ? null
    : await listPermissionKeysForRoleKey(roleKey);

  const filtered = rows.filter((item) => {
    if (!item.permissionKey) {
      return true;
    }
    if (allowed === null) {
      return true;
    }
    return allowed.has(item.permissionKey);
  });

  const tree = buildMenuTree(
    filtered.map(({ id, parentId, title, href, icon, permissionKey, sortOrder }) => ({
      id,
      parentId,
      title,
      href,
      icon,
      permissionKey,
      sortOrder,
    })),
  );

  // Hide empty group parents when the user has no visible children under them.
  return tree.filter((item) => {
    if (item.children && item.children.length === 0 && !item.href) {
      return false;
    }
    if (item.children && item.children.length === 0 && item.href === "") {
      return false;
    }
    // Parent with children that were all filtered: children would be empty
    if ((!item.href || item.href === "") && (!item.children || item.children.length === 0)) {
      return false;
    }
    return true;
  });
}

export async function listAllRoles() {
  return db.select().from(role).orderBy(asc(role.name));
}

export async function listAllPermissions() {
  return db.select().from(permission).orderBy(asc(permission.key));
}

export async function listAllMenus() {
  return db
    .select({
      id: menu.id,
      parentId: menu.parentId,
      title: menu.title,
      href: menu.href,
      icon: menu.icon,
      sortOrder: menu.sortOrder,
      permissionId: menu.permissionId,
      permissionKey: permission.key,
      isVisible: menu.isVisible,
      createdAt: menu.createdAt,
      updatedAt: menu.updatedAt,
    })
    .from(menu)
    .leftJoin(permission, eq(menu.permissionId, permission.id))
    .orderBy(asc(menu.sortOrder), asc(menu.title));
}

export async function listPermissionIdsByRole(): Promise<Record<string, string[]>> {
  const rows = await db
    .select({ roleId: rolePermission.roleId, permissionId: rolePermission.permissionId })
    .from(rolePermission);

  return rows.reduce<Record<string, string[]>>((grouped, row) => {
    (grouped[row.roleId] ??= []).push(row.permissionId);
    return grouped;
  }, {});
}
