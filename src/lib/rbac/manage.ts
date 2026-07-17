import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { menu, permission, role, rolePermission, user } from "@/lib/db/schema";
import { SYSTEM_ADMIN_ROLE_KEY } from "./constants";
import {
  canBeDefaultRole,
  isSafeInternalHref,
  isValidMenuParentSelection,
  isValidPermissionKey,
  isValidRoleKey,
} from "./validate";

export class RbacError extends Error {
  constructor(
    public readonly code:
      | "invalid_input"
      | "not_found"
      | "duplicate"
      | "system_locked"
      | "in_use"
      | "last_default",
  ) {
    super(code);
  }
}

function normalizeText(value: string, max = 100) {
  return value.trim().slice(0, max);
}

// --- Permissions ---

export async function createPermission(input: { key: string; name: string; description?: string }) {
  const key = input.key.trim().toLowerCase();
  const name = normalizeText(input.name);
  const description = input.description?.trim() || null;

  if (!isValidPermissionKey(key) || !name) {
    throw new RbacError("invalid_input");
  }

  return db.transaction(async (tx) => {
    const existing = await tx.select({ id: permission.id }).from(permission).where(eq(permission.key, key)).limit(1);
    if (existing.length > 0) {
      throw new RbacError("duplicate");
    }

    const id = crypto.randomUUID();
    await tx.insert(permission).values({ id, key, name, description, isSystem: false });

    return id;
  });
}

export async function updatePermission(input: {
  id: string;
  name: string;
  description?: string;
}) {
  const name = normalizeText(input.name);
  const description = input.description?.trim() || null;

  if (!input.id || !name) {
    throw new RbacError("invalid_input");
  }

  const [existing] = await db.select().from(permission).where(eq(permission.id, input.id)).limit(1);
  if (!existing) {
    throw new RbacError("not_found");
  }

  await db
    .update(permission)
    .set({ name, description, updatedAt: new Date() })
    .where(eq(permission.id, input.id));
}

export async function deletePermission(id: string) {
  return db.transaction(async (tx) => {
    const [existing] = await tx.select().from(permission).where(eq(permission.id, id)).limit(1);
    if (!existing) {
      throw new RbacError("not_found");
    }
    if (existing.isSystem) {
      throw new RbacError("system_locked");
    }

    const [roleReference, menuReference] = await Promise.all([
      tx
        .select({ id: rolePermission.roleId })
        .from(rolePermission)
        .innerJoin(role, eq(role.id, rolePermission.roleId))
        .where(and(eq(rolePermission.permissionId, id), ne(role.key, SYSTEM_ADMIN_ROLE_KEY)))
        .limit(1),
      tx.select({ id: menu.id }).from(menu).where(eq(menu.permissionId, id)).limit(1),
    ]);
    if (roleReference.length > 0 || menuReference.length > 0) {
      throw new RbacError("in_use");
    }

    // Older installations may still have a redundant admin binding. Remove
    // only that row so a concurrent ordinary-role grant remains protected by
    // the permission foreign key's RESTRICT behavior.
    const [adminRole] = await tx
      .select({ id: role.id })
      .from(role)
      .where(eq(role.key, SYSTEM_ADMIN_ROLE_KEY))
      .limit(1);
    if (adminRole) {
      await tx
        .delete(rolePermission)
        .where(and(eq(rolePermission.permissionId, id), eq(rolePermission.roleId, adminRole.id)));
    }
    await tx.delete(permission).where(eq(permission.id, id));
  });
}

// --- Roles ---

export async function createRole(input: {
  key: string;
  name: string;
  description?: string;
  permissionIds: string[];
  isDefault?: boolean;
}) {
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
    await tx.insert(role).values({
      id,
      key,
      name,
      description,
      isSystem: false,
      isDefault: Boolean(input.isDefault),
    });

    const uniquePermissionIds = [...new Set(input.permissionIds.filter(Boolean))];
    if (uniquePermissionIds.length > 0) {
      await tx.insert(rolePermission).values(
        uniquePermissionIds.map((permissionId) => ({ roleId: id, permissionId })),
      );
    }

    return id;
  });
}

export async function updateRole(input: {
  id: string;
  name: string;
  description?: string;
  permissionIds: string[];
  isDefault?: boolean;
}, actorRoleKey: string) {
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

    if (existing.isSystem && actorRoleKey !== SYSTEM_ADMIN_ROLE_KEY) {
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

    // The system admin is authorized by role key and receives new permissions automatically.
    // Ignore its submitted checkbox list so the stored bindings cannot be accidentally narrowed.
    if (existing.key === SYSTEM_ADMIN_ROLE_KEY) {
      return;
    }

    await tx.delete(rolePermission).where(eq(rolePermission.roleId, input.id));
    const uniquePermissionIds = [...new Set(input.permissionIds.filter(Boolean))];
    if (uniquePermissionIds.length > 0) {
      await tx.insert(rolePermission).values(
        uniquePermissionIds.map((permissionId) => ({ roleId: input.id, permissionId })),
      );
    }
  });
}

export async function deleteRole(id: string) {
  return db.transaction(async (tx) => {
    const [existing] = await tx.select().from(role).where(eq(role.id, id)).limit(1);
    if (!existing) {
      throw new RbacError("not_found");
    }
    if (existing.isSystem || existing.key === SYSTEM_ADMIN_ROLE_KEY) {
      throw new RbacError("system_locked");
    }

    const users = await tx.select({ id: user.id }).from(user).where(eq(user.role, existing.key)).limit(1);
    if (users.length > 0) {
      throw new RbacError("in_use");
    }

    if (existing.isDefault) {
      throw new RbacError("last_default");
    }

    await tx.delete(role).where(eq(role.id, id));
  });
}

// --- Menus ---

export async function createMenu(input: {
  title: string;
  href: string;
  icon?: string;
  sortOrder?: number;
  parentId?: string | null;
  permissionId?: string | null;
  isVisible?: boolean;
}) {
  const title = normalizeText(input.title, 80);
  const href = input.href.trim();
  const icon = input.icon?.trim() || null;
  const sortOrder = Number.isFinite(input.sortOrder) ? Number(input.sortOrder) : 0;
  const parentId = input.parentId || null;

  if (!title || !isSafeInternalHref(href)) {
    throw new RbacError("invalid_input");
  }

  return db.transaction(async (tx) => {
    // Menu hierarchy writes are rare. Serializing them prevents two concurrent
    // re-parent operations from both validating against stale tree state.
    await tx.execute(sql`lock table menu in share row exclusive mode`);

    if (parentId) {
      const [parent] = await tx
        .select({ id: menu.id, parentId: menu.parentId })
        .from(menu)
        .where(eq(menu.id, parentId))
        .limit(1);
      if (!parent || !isValidMenuParentSelection({ parentId, parentParentId: parent.parentId })) {
        throw new RbacError("invalid_input");
      }
    }

    if (input.permissionId) {
      const [perm] = await tx.select({ id: permission.id }).from(permission).where(eq(permission.id, input.permissionId)).limit(1);
      if (!perm) {
        throw new RbacError("invalid_input");
      }
    }

    const id = crypto.randomUUID();
    await tx.insert(menu).values({
      id,
      parentId,
      title,
      href,
      icon,
      sortOrder,
      permissionId: input.permissionId || null,
      isVisible: input.isVisible !== false,
    });
    return id;
  });
}

export async function updateMenu(input: {
  id: string;
  title: string;
  href: string;
  icon?: string;
  sortOrder?: number;
  parentId?: string | null;
  permissionId?: string | null;
  isVisible?: boolean;
}) {
  const title = normalizeText(input.title, 80);
  const href = input.href.trim();
  const icon = input.icon?.trim() || null;
  const sortOrder = Number.isFinite(input.sortOrder) ? Number(input.sortOrder) : 0;
  const parentId = input.parentId || null;

  if (!input.id || !title || !isSafeInternalHref(href)) {
    throw new RbacError("invalid_input");
  }

  return db.transaction(async (tx) => {
    await tx.execute(sql`lock table menu in share row exclusive mode`);

    const [existing] = await tx.select({ id: menu.id }).from(menu).where(eq(menu.id, input.id)).limit(1);
    if (!existing) {
      throw new RbacError("not_found");
    }

    if (parentId) {
      const [[parent], children] = await Promise.all([
        tx
          .select({ id: menu.id, parentId: menu.parentId })
          .from(menu)
          .where(eq(menu.id, parentId))
          .limit(1),
        tx.select({ id: menu.id }).from(menu).where(eq(menu.parentId, input.id)).limit(1),
      ]);
      if (
        !parent ||
        !isValidMenuParentSelection({
          menuId: input.id,
          parentId,
          parentParentId: parent.parentId,
          menuHasChildren: children.length > 0,
        })
      ) {
        throw new RbacError("invalid_input");
      }
    }

    if (input.permissionId) {
      const [perm] = await tx.select({ id: permission.id }).from(permission).where(eq(permission.id, input.permissionId)).limit(1);
      if (!perm) {
        throw new RbacError("invalid_input");
      }
    }

    await tx
      .update(menu)
      .set({
        parentId,
        title,
        href,
        icon,
        sortOrder,
        permissionId: input.permissionId || null,
        isVisible: input.isVisible !== false,
        updatedAt: new Date(),
      })
      .where(eq(menu.id, input.id));
  });
}

export async function deleteMenu(id: string) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`lock table menu in share row exclusive mode`);

    const [existing] = await tx.select({ id: menu.id }).from(menu).where(eq(menu.id, id)).limit(1);
    if (!existing) {
      throw new RbacError("not_found");
    }

    const children = await tx.select({ id: menu.id }).from(menu).where(eq(menu.parentId, id)).limit(1);
    if (children.length > 0) {
      throw new RbacError("in_use");
    }

    await tx.delete(menu).where(eq(menu.id, id));
  });
}
