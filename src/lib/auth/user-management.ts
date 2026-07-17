import { hashPassword } from "better-auth/crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { account, role, rolePermission, user } from "@/lib/db/schema";
import { DEFAULT_MEMBER_ROLE_KEY, SYSTEM_ADMIN_ROLE_KEY } from "@/lib/rbac/constants";
import {
  canChangeRole,
  canManageRolePermissionSets,
  canManageSystemRole,
  validateCredentialPassword,
} from "./authorization";

export class UserManagementError extends Error {
  constructor(
    public readonly code:
      | "invalid_input"
      | "email_taken"
      | "last_admin"
      | "not_found"
      | "invalid_role"
      | "system_role_forbidden"
      | "role_scope_forbidden",
  ) {
    super(code);
  }
}

export function validateCredentialUserInput({ name, email, password }: { name: string; email: string; password: string }) {
  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

  if (!normalizedName || normalizedName.length > 100 || !emailValid || !validateCredentialPassword(password)) {
    throw new UserManagementError("invalid_input");
  }

  return { name: normalizedName, email: normalizedEmail, password };
}

export async function createCredentialUser(input: {
  name: string;
  email: string;
  password: string;
  role?: string;
}, actorRoleKey: string) {
  const values = validateCredentialUserInput(input);
  const password = await hashPassword(values.password);

  return db.transaction(async (tx) => {
    let resolvedRole = DEFAULT_MEMBER_ROLE_KEY;
    let resolvedRoleId = "";
    let resolvedRoleIsSystem = false;

    if (input.role) {
      const [existingRole] = await tx
        .select({ id: role.id, key: role.key, isSystem: role.isSystem })
        .from(role)
        .where(eq(role.key, input.role))
        .limit(1);
      if (!existingRole) {
        throw new UserManagementError("invalid_role");
      }
      if (
        !canManageSystemRole({
          actorRole: actorRoleKey,
          currentRoleIsSystem: false,
          nextRoleIsSystem: existingRole.isSystem || existingRole.key === SYSTEM_ADMIN_ROLE_KEY,
        })
      ) {
        throw new UserManagementError("system_role_forbidden");
      }
      resolvedRole = existingRole.key;
      resolvedRoleId = existingRole.id;
      resolvedRoleIsSystem = existingRole.isSystem;
    } else {
      const [defaultRole] = await tx
        .select({ id: role.id, key: role.key, isSystem: role.isSystem })
        .from(role)
        .where(eq(role.isDefault, true))
        .limit(1);
      if (defaultRole) {
        resolvedRole = defaultRole.key;
        resolvedRoleId = defaultRole.id;
        resolvedRoleIsSystem = defaultRole.isSystem;
      }
    }

    if (!resolvedRoleId) {
      const [fallbackRole] = await tx
        .select({ id: role.id, key: role.key, isSystem: role.isSystem })
        .from(role)
        .where(eq(role.key, resolvedRole))
        .limit(1);
      if (!fallbackRole) {
        throw new UserManagementError("invalid_role");
      }
      resolvedRoleId = fallbackRole.id;
      resolvedRoleIsSystem = fallbackRole.isSystem;
    }

    if (actorRoleKey !== SYSTEM_ADMIN_ROLE_KEY) {
      if (resolvedRoleIsSystem) {
        throw new UserManagementError("system_role_forbidden");
      }
      const [actorRole] = await tx.select({ id: role.id }).from(role).where(eq(role.key, actorRoleKey)).limit(1);
      if (!actorRole) {
        throw new UserManagementError("role_scope_forbidden");
      }
      const [actorPermissions, nextPermissions] = await Promise.all([
        tx.select({ id: rolePermission.permissionId }).from(rolePermission).where(eq(rolePermission.roleId, actorRole.id)),
        tx.select({ id: rolePermission.permissionId }).from(rolePermission).where(eq(rolePermission.roleId, resolvedRoleId)),
      ]);
      if (!canManageRolePermissionSets({
        actorPermissionIds: actorPermissions.map((item) => item.id),
        nextPermissionIds: nextPermissions.map((item) => item.id),
      })) {
        throw new UserManagementError("role_scope_forbidden");
      }
    }

    const existing = await tx.select({ id: user.id }).from(user).where(eq(user.email, values.email)).limit(1);

    if (existing.length > 0) {
      throw new UserManagementError("email_taken");
    }

    const userId = crypto.randomUUID();
    await tx.insert(user).values({
      id: userId,
      name: values.name,
      email: values.email,
      role: resolvedRole,
    });
    await tx.insert(account).values({
      id: crypto.randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password,
    });

    return userId;
  });
}

export async function setUserRole(userId: string, nextRole: string, actorRoleKey: string) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select id from "user" where role = ${SYSTEM_ADMIN_ROLE_KEY} for update`);

    const [roleRow] = await tx
      .select({ id: role.id, key: role.key, isSystem: role.isSystem })
      .from(role)
      .where(eq(role.key, nextRole))
      .limit(1);
    if (!roleRow) {
      throw new UserManagementError("invalid_role");
    }

    const [target] = await tx.select({ id: user.id, role: user.role }).from(user).where(eq(user.id, userId)).limit(1);
    if (!target) {
      throw new UserManagementError("not_found");
    }

    const [currentRoleRow] = await tx
      .select({ id: role.id, isSystem: role.isSystem })
      .from(role)
      .where(eq(role.key, target.role))
      .limit(1);

    if (
      !canManageSystemRole({
        actorRole: actorRoleKey,
        currentRoleIsSystem: Boolean(currentRoleRow?.isSystem) || target.role === SYSTEM_ADMIN_ROLE_KEY,
        nextRoleIsSystem: roleRow.isSystem || roleRow.key === SYSTEM_ADMIN_ROLE_KEY,
      })
    ) {
      throw new UserManagementError("system_role_forbidden");
    }

    if (actorRoleKey !== SYSTEM_ADMIN_ROLE_KEY) {
      const [actorRole] = await tx.select({ id: role.id }).from(role).where(eq(role.key, actorRoleKey)).limit(1);
      if (!actorRole || !currentRoleRow) {
        throw new UserManagementError("role_scope_forbidden");
      }
      const [actorPermissions, currentPermissions, nextPermissions] = await Promise.all([
        tx.select({ id: rolePermission.permissionId }).from(rolePermission).where(eq(rolePermission.roleId, actorRole.id)),
        tx.select({ id: rolePermission.permissionId }).from(rolePermission).where(eq(rolePermission.roleId, currentRoleRow.id)),
        tx.select({ id: rolePermission.permissionId }).from(rolePermission).where(eq(rolePermission.roleId, roleRow.id)),
      ]);
      if (!canManageRolePermissionSets({
        actorPermissionIds: actorPermissions.map((item) => item.id),
        currentPermissionIds: currentPermissions.map((item) => item.id),
        nextPermissionIds: nextPermissions.map((item) => item.id),
      })) {
        throw new UserManagementError("role_scope_forbidden");
      }
    }

    const admins = await tx
      .select({ id: user.id })
      .from(user)
      .where(and(eq(user.role, SYSTEM_ADMIN_ROLE_KEY), eq(user.banned, false)));

    if (!canChangeRole({ currentRole: target.role, nextRole: roleRow.key, adminCount: admins.length })) {
      throw new UserManagementError("last_admin");
    }

    await tx.update(user).set({ role: roleRow.key, updatedAt: new Date() }).where(eq(user.id, userId));
  });
}
