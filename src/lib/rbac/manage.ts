import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { menu, role, roleMenu, user, type MenuNodeType } from "@/lib/db/schema";
import { canManageRolePermissionSets } from "@/lib/auth/authorization";
import { writeAuditLog, type WriteAuditLogInput } from "@/lib/audit/persistence";
import { SYSTEM_ADMIN_ROLE_KEY } from "./constants";
import { hasSystemAdminRole, parseRoleKeys } from "./role-keys";
import { canBeDefaultRole, isValidMenuNode, isValidRoleKey } from "./validate";

export class RbacError extends Error {
  constructor(
    public readonly code:
      | "invalid_input"
      | "not_found"
      | "duplicate"
      | "system_locked"
      | "role_scope_forbidden"
      | "in_use"
      | "last_default",
  ) {
    super(code);
  }
}

function normalizeText(value: string, max = 100) {
  return value.trim().slice(0, max);
}

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Delegated role managers may only grant or revoke menu nodes they hold themselves. */
async function assertRoleGrantScope(
  tx: Transaction,
  actorRoleKey: string,
  currentMenuIds: string[],
  nextMenuIds: string[],
) {
  if (hasSystemAdminRole(actorRoleKey)) {
    return;
  }

  const actorRoleKeys = parseRoleKeys(actorRoleKey);
  const actorRoles = actorRoleKeys.length > 0
    ? await tx.select({ id: role.id }).from(role).where(inArray(role.key, actorRoleKeys))
    : [];
  if (actorRoles.length !== actorRoleKeys.length) {
    throw new RbacError("role_scope_forbidden");
  }
  const actorGrants = actorRoles.length > 0
    ? await tx
      .select({ id: roleMenu.menuId })
      .from(roleMenu)
      .where(inArray(roleMenu.roleId, actorRoles.map((item) => item.id)))
    : [];
  if (!canManageRolePermissionSets({
    actorPermissionIds: actorGrants.map((item) => item.id),
    currentPermissionIds: currentMenuIds,
    nextPermissionIds: nextMenuIds,
  })) {
    throw new RbacError("role_scope_forbidden");
  }
}

/**
 * Keep only grantable nodes (those with a permission key) and grant the parent
 * page of every checked action, so an operation is never granted without its page.
 */
async function normalizeGrantedMenuIds(tx: Transaction, menuIds: string[]) {
  const requested = [...new Set(menuIds.filter(Boolean))];
  if (requested.length === 0) {
    return [];
  }

  const nodes = await tx
    .select({ id: menu.id, parentId: menu.parentId, type: menu.type, permissionKey: menu.permissionKey })
    .from(menu);
  const byId = new Map(nodes.map((item) => [item.id, item]));
  if (requested.some((id) => !byId.has(id))) {
    throw new RbacError("invalid_input");
  }

  const granted = new Set<string>();
  for (const id of requested) {
    const node = byId.get(id)!;
    if (!node.permissionKey) {
      continue;
    }
    granted.add(id);
    const parent = node.type === "action" && node.parentId ? byId.get(node.parentId) : undefined;
    if (parent?.type === "page" && parent.permissionKey) {
      granted.add(parent.id);
    }
  }
  return [...granted];
}

async function listRoleMenuIds(tx: Transaction, roleId: string) {
  const rows = await tx.select({ id: roleMenu.menuId }).from(roleMenu).where(eq(roleMenu.roleId, roleId));
  return rows.map((item) => item.id);
}

async function replaceRoleMenus(tx: Transaction, roleId: string, menuIds: string[]) {
  await tx.delete(roleMenu).where(eq(roleMenu.roleId, roleId));
  if (menuIds.length > 0) {
    await tx.insert(roleMenu).values(menuIds.map((menuId) => ({ roleId, menuId })));
  }
}

// --- Roles ---

export async function createRole(input: {
  key: string;
  name: string;
  description?: string;
  menuIds: string[];
  isDefault?: boolean;
}, actorRoleKey: string, audit: WriteAuditLogInput) {
  const key = input.key.trim().toLowerCase();
  const name = normalizeText(input.name);
  const description = input.description?.trim() || null;

  if (!isValidRoleKey(key) || !name) {
    throw new RbacError("invalid_input");
  }

  return db.transaction(async (tx) => {
    await tx.execute(sql`select id from role for update`);
    const existing = await tx.select({ id: role.id }).from(role).where(eq(role.key, key)).limit(1);
    if (existing.length > 0) {
      throw new RbacError("duplicate");
    }

    if (input.isDefault) {
      await tx.update(role).set({ isDefault: false, updatedAt: new Date() }).where(eq(role.isDefault, true));
    }

    const id = crypto.randomUUID();
    const menuIds = await normalizeGrantedMenuIds(tx, input.menuIds);
    await assertRoleGrantScope(tx, actorRoleKey, [], menuIds);
    await tx.insert(role).values({
      id,
      key,
      name,
      description,
      isSystem: false,
      isDefault: Boolean(input.isDefault),
    });
    await replaceRoleMenus(tx, id, menuIds);
    await writeAuditLog({ ...audit, resourceId: id }, tx);

    return id;
  });
}

export async function updateRole(input: {
  id: string;
  name: string;
  description?: string;
  menuIds: string[];
  isDefault?: boolean;
}, actorRoleKey: string, audit: WriteAuditLogInput) {
  const name = normalizeText(input.name);
  const description = input.description?.trim() || null;

  if (!input.id || !name) {
    throw new RbacError("invalid_input");
  }

  return db.transaction(async (tx) => {
    await tx.execute(sql`select id from role for update`);
    const [existing] = await tx.select().from(role).where(eq(role.id, input.id)).limit(1);
    if (!existing) {
      throw new RbacError("not_found");
    }

    if (existing.isSystem && !hasSystemAdminRole(actorRoleKey)) {
      throw new RbacError("system_locked");
    }
    if (input.isDefault && !canBeDefaultRole({ isSystem: existing.isSystem })) {
      throw new RbacError("system_locked");
    }

    if (input.isDefault) {
      await tx
        .update(role)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(and(eq(role.isDefault, true), ne(role.id, input.id)));
    } else if (existing.isDefault && input.isDefault === false) {
      const others = await tx.select({ id: role.id }).from(role).where(and(eq(role.isDefault, true), ne(role.id, input.id)));
      if (others.length === 0) {
        throw new RbacError("last_default");
      }
    }

    await tx
      .update(role)
      .set({
        name,
        description,
        isDefault: input.isDefault === undefined ? existing.isDefault : Boolean(input.isDefault),
        updatedAt: new Date(),
      })
      .where(eq(role.id, input.id));

    // The system admin is authorized by role key and receives every node automatically.
    // Ignore its submitted tree so the stored grants cannot be accidentally narrowed.
    if (existing.key === SYSTEM_ADMIN_ROLE_KEY) {
      await writeAuditLog(audit, tx);
      return;
    }

    const menuIds = await normalizeGrantedMenuIds(tx, input.menuIds);
    await assertRoleGrantScope(tx, actorRoleKey, await listRoleMenuIds(tx, input.id), menuIds);
    await replaceRoleMenus(tx, input.id, menuIds);
    await writeAuditLog(audit, tx);
  });
}

export async function deleteRole(id: string, actorRoleKey: string, audit: WriteAuditLogInput) {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(role)
      .where(eq(role.id, id))
      .limit(1)
      .for("update");
    if (!existing) {
      throw new RbacError("not_found");
    }
    if (existing.isSystem || existing.key === SYSTEM_ADMIN_ROLE_KEY) {
      throw new RbacError("system_locked");
    }

    const users = await tx
      .select({ id: user.id })
      .from(user)
      .where(sql`${existing.key} = any(string_to_array(${user.role}, ','))`)
      .limit(1);
    if (users.length > 0) {
      throw new RbacError("in_use");
    }

    if (existing.isDefault) {
      throw new RbacError("last_default");
    }

    await assertRoleGrantScope(tx, actorRoleKey, await listRoleMenuIds(tx, id), []);

    await tx.delete(role).where(eq(role.id, id));
    await writeAuditLog(audit, tx);
  });
}

// --- Menu tree ---

export type MenuNodeInput = {
  type: MenuNodeType;
  title: string;
  href?: string;
  icon?: string;
  sortOrder?: number;
  parentId?: string | null;
  permissionKey?: string | null;
  isVisible?: boolean;
};

function normalizeMenuInput(input: MenuNodeInput) {
  const permissionKey = input.permissionKey?.trim().toLowerCase() || null;
  return {
    title: normalizeText(input.title, 80),
    href: input.type === "page" ? (input.href ?? "").trim() : "",
    icon: input.type === "action" ? null : input.icon?.trim() || null,
    sortOrder: Number.isFinite(input.sortOrder) ? Number(input.sortOrder) : 0,
    parentId: input.parentId || null,
    permissionKey: input.type === "directory" ? null : permissionKey,
    isVisible: input.isVisible !== false,
  };
}

async function findParentType(tx: Transaction, parentId: string | null): Promise<MenuNodeType | null> {
  if (!parentId) {
    return null;
  }
  const [parent] = await tx.select({ type: menu.type }).from(menu).where(eq(menu.id, parentId)).limit(1);
  if (!parent) {
    throw new RbacError("invalid_input");
  }
  return parent.type;
}

async function assertPermissionKeyAvailable(tx: Transaction, permissionKey: string | null, menuId?: string) {
  if (!permissionKey) {
    return;
  }
  const [taken] = await tx
    .select({ id: menu.id })
    .from(menu)
    .where(menuId
      ? and(eq(menu.permissionKey, permissionKey), ne(menu.id, menuId))
      : eq(menu.permissionKey, permissionKey))
    .limit(1);
  if (taken) {
    throw new RbacError("duplicate");
  }
}

export async function createMenu(input: MenuNodeInput, audit: WriteAuditLogInput) {
  const values = normalizeMenuInput(input);
  if (!values.title) {
    throw new RbacError("invalid_input");
  }

  return db.transaction(async (tx) => {
    // Tree writes are rare. Serializing them prevents two concurrent
    // re-parent operations from both validating against stale tree state.
    await tx.execute(sql`lock table menu in share row exclusive mode`);

    const parentType = await findParentType(tx, values.parentId);
    if (!isValidMenuNode({ type: input.type, parentType, permissionKey: values.permissionKey, href: values.href })) {
      throw new RbacError("invalid_input");
    }
    await assertPermissionKeyAvailable(tx, values.permissionKey);

    const id = crypto.randomUUID();
    await tx.insert(menu).values({ id, type: input.type, ...values, isSystem: false });
    await writeAuditLog({ ...audit, resourceId: id }, tx);
    return id;
  });
}

/** A node's type is fixed at creation. System nodes may only change title, icon, order, and visibility. */
export async function updateMenu(input: Omit<MenuNodeInput, "type"> & { id: string }, audit: WriteAuditLogInput) {
  if (!input.id) {
    throw new RbacError("invalid_input");
  }

  return db.transaction(async (tx) => {
    await tx.execute(sql`lock table menu in share row exclusive mode`);

    const [existing] = await tx.select().from(menu).where(eq(menu.id, input.id)).limit(1);
    if (!existing) {
      throw new RbacError("not_found");
    }

    const submitted = normalizeMenuInput({ ...input, type: existing.type });
    const values = existing.isSystem
      ? { ...submitted, href: existing.href, parentId: existing.parentId, permissionKey: existing.permissionKey }
      : submitted;
    if (!values.title || values.parentId === existing.id) {
      throw new RbacError("invalid_input");
    }

    const parentType = await findParentType(tx, values.parentId);
    if (!isValidMenuNode({ type: existing.type, parentType, permissionKey: values.permissionKey, href: values.href })) {
      throw new RbacError("invalid_input");
    }
    await assertPermissionKeyAvailable(tx, values.permissionKey, existing.id);

    await tx.update(menu).set({ ...values, updatedAt: new Date() }).where(eq(menu.id, existing.id));
    if (!values.permissionKey) {
      // Grants only apply to nodes that carry a permission key.
      await tx.delete(roleMenu).where(eq(roleMenu.menuId, existing.id));
    }
    await writeAuditLog(audit, tx);
  });
}

export async function deleteMenu(id: string, audit: WriteAuditLogInput) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`lock table menu in share row exclusive mode`);

    const [existing] = await tx.select({ id: menu.id, isSystem: menu.isSystem }).from(menu).where(eq(menu.id, id)).limit(1);
    if (!existing) {
      throw new RbacError("not_found");
    }
    if (existing.isSystem) {
      throw new RbacError("system_locked");
    }

    const [[child], [grant]] = await Promise.all([
      tx.select({ id: menu.id }).from(menu).where(eq(menu.parentId, id)).limit(1),
      tx.select({ id: roleMenu.roleId }).from(roleMenu).where(eq(roleMenu.menuId, id)).limit(1),
    ]);
    if (child || grant) {
      throw new RbacError("in_use");
    }

    await tx.delete(menu).where(eq(menu.id, id));
    await writeAuditLog(audit, tx);
  });
}
