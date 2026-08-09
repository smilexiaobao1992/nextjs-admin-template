import { hashPassword, verifyPassword } from "better-auth/crypto";
import { and, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { account, role, rolePermission, session, user } from "@/lib/db/schema";
import { writeAuditLog, type WriteAuditLogInput } from "@/lib/audit/persistence";
import { DEFAULT_MEMBER_ROLE_KEY, SYSTEM_ADMIN_ROLE_KEY } from "@/lib/rbac/constants";
import { hasSystemAdminRole, parseRoleKeys, serializeRoleKeys } from "@/lib/rbac/role-keys";
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
      | "role_scope_forbidden"
      | "self_forbidden"
      | "wrong_password"
      | "no_credential",
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

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function getRoleRows(tx: Transaction, roleKeys: string[]) {
  const uniqueRoleKeys = parseRoleKeys(roleKeys.join(","));
  if (uniqueRoleKeys.length === 0) {
    throw new UserManagementError("invalid_role");
  }
  const rows = await tx
    .select({ id: role.id, key: role.key, isSystem: role.isSystem })
    .from(role)
    .where(inArray(role.key, uniqueRoleKeys))
    .for("key share");
  if (rows.length !== uniqueRoleKeys.length) {
    throw new UserManagementError("invalid_role");
  }
  return rows;
}

async function getPermissionIdsForRoles(tx: Transaction, roleIds: string[]) {
  if (roleIds.length === 0) {
    return [];
  }
  const rows = await tx
    .select({ id: rolePermission.permissionId })
    .from(rolePermission)
    .where(inArray(rolePermission.roleId, roleIds));
  return [...new Set(rows.map((item) => item.id))];
}

async function assertCanManageTargetRoles(tx: Transaction, actorRoleValue: string, targetRoleValue: string) {
  const targetRoles = await getRoleRows(tx, parseRoleKeys(targetRoleValue));
  const targetHasSystemRole = targetRoles.some(
    (item) => item.isSystem || item.key === SYSTEM_ADMIN_ROLE_KEY,
  );
  if (!canManageSystemRole({
    actorRole: actorRoleValue,
    currentRoleIsSystem: targetHasSystemRole,
    nextRoleIsSystem: targetHasSystemRole,
  })) {
    throw new UserManagementError("system_role_forbidden");
  }
  if (hasSystemAdminRole(actorRoleValue)) {
    return;
  }

  const actorRoles = await getRoleRows(tx, parseRoleKeys(actorRoleValue));
  const [actorPermissionIds, targetPermissionIds] = await Promise.all([
    getPermissionIdsForRoles(tx, actorRoles.map((item) => item.id)),
    getPermissionIdsForRoles(tx, targetRoles.map((item) => item.id)),
  ]);
  if (!canManageRolePermissionSets({
    actorPermissionIds: actorPermissionIds,
    currentPermissionIds: targetPermissionIds,
    nextPermissionIds: targetPermissionIds,
  })) {
    throw new UserManagementError("role_scope_forbidden");
  }
}

export async function createCredentialUser(input: {
  name: string;
  email: string;
  password: string;
  roles?: string[];
}, actorRoleKey: string, audit: WriteAuditLogInput) {
  const values = validateCredentialUserInput(input);
  const password = await hashPassword(values.password);

  return db.transaction(async (tx) => {
    let requestedRoleKeys = parseRoleKeys((input.roles ?? []).join(","));
    if (requestedRoleKeys.length === 0) {
      const [defaultRole] = await tx
        .select({ key: role.key })
        .from(role)
        .where(eq(role.isDefault, true))
        .limit(1);
      requestedRoleKeys = [defaultRole?.key ?? DEFAULT_MEMBER_ROLE_KEY];
    }

    const selectedRoles = await getRoleRows(tx, requestedRoleKeys);
    const selectedHasSystemRole = selectedRoles.some(
      (item) => item.isSystem || item.key === SYSTEM_ADMIN_ROLE_KEY,
    );
    if (!canManageSystemRole({
      actorRole: actorRoleKey,
      currentRoleIsSystem: false,
      nextRoleIsSystem: selectedHasSystemRole,
    })) {
      throw new UserManagementError("system_role_forbidden");
    }

    if (!hasSystemAdminRole(actorRoleKey)) {
      const actorRoles = await getRoleRows(tx, parseRoleKeys(actorRoleKey));
      const [actorPermissionIds, nextPermissionIds] = await Promise.all([
        getPermissionIdsForRoles(tx, actorRoles.map((item) => item.id)),
        getPermissionIdsForRoles(tx, selectedRoles.map((item) => item.id)),
      ]);
      if (!canManageRolePermissionSets({
        actorPermissionIds,
        nextPermissionIds,
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
      role: serializeRoleKeys(requestedRoleKeys),
    });
    await tx.insert(account).values({
      id: crypto.randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password,
    });
    await writeAuditLog({ ...audit, resourceId: userId }, tx);

    return userId;
  });
}

export async function setUserRoles(
  userId: string,
  nextRoles: string[],
  actorRoleKey: string,
  audit: WriteAuditLogInput,
) {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select id from "user" where ${SYSTEM_ADMIN_ROLE_KEY} = any(string_to_array(role, ',')) for update`,
    );

    const [target] = await tx.select({ id: user.id, role: user.role }).from(user).where(eq(user.id, userId)).limit(1);
    if (!target) {
      throw new UserManagementError("not_found");
    }

    const nextRoleKeys = parseRoleKeys(nextRoles.join(","));
    const [currentRoleRows, nextRoleRows] = await Promise.all([
      getRoleRows(tx, parseRoleKeys(target.role)),
      getRoleRows(tx, nextRoleKeys),
    ]);
    const currentHasSystemRole = currentRoleRows.some(
      (item) => item.isSystem || item.key === SYSTEM_ADMIN_ROLE_KEY,
    );
    const nextHasSystemRole = nextRoleRows.some(
      (item) => item.isSystem || item.key === SYSTEM_ADMIN_ROLE_KEY,
    );

    if (
      !canManageSystemRole({
        actorRole: actorRoleKey,
        currentRoleIsSystem: currentHasSystemRole,
        nextRoleIsSystem: nextHasSystemRole,
      })
    ) {
      throw new UserManagementError("system_role_forbidden");
    }

    if (!hasSystemAdminRole(actorRoleKey)) {
      const actorRoles = await getRoleRows(tx, parseRoleKeys(actorRoleKey));
      const [actorPermissionIds, currentPermissionIds, nextPermissionIds] = await Promise.all([
        getPermissionIdsForRoles(tx, actorRoles.map((item) => item.id)),
        getPermissionIdsForRoles(tx, currentRoleRows.map((item) => item.id)),
        getPermissionIdsForRoles(tx, nextRoleRows.map((item) => item.id)),
      ]);
      if (!canManageRolePermissionSets({
        actorPermissionIds,
        currentPermissionIds,
        nextPermissionIds,
      })) {
        throw new UserManagementError("role_scope_forbidden");
      }
    }

    const admins = await tx
      .select({ id: user.id })
      .from(user)
      .where(and(
        sql`${SYSTEM_ADMIN_ROLE_KEY} = any(string_to_array(${user.role}, ','))`,
        eq(user.banned, false),
      ));

    const serializedNextRoles = serializeRoleKeys(nextRoleKeys);
    if (!canChangeRole({ currentRole: target.role, nextRole: serializedNextRoles, adminCount: admins.length })) {
      throw new UserManagementError("last_admin");
    }

    await tx.update(user).set({ role: serializedNextRoles, updatedAt: new Date() }).where(eq(user.id, userId));
    await writeAuditLog(audit, tx);
  });
}

async function countActiveAdmins(tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) {
  const admins = await tx
    .select({ id: user.id })
    .from(user)
    .where(and(
      sql`${SYSTEM_ADMIN_ROLE_KEY} = any(string_to_array(${user.role}, ','))`,
      eq(user.banned, false),
    ));
  return admins.length;
}

export async function setUserBanned({
  userId,
  banned,
  banReason,
  actorUserId,
  actorRoleKey,
  audit,
}: {
  userId: string;
  banned: boolean;
  banReason?: string | null;
  actorUserId: string;
  actorRoleKey: string;
  audit: WriteAuditLogInput;
}) {
  if (userId === actorUserId) {
    throw new UserManagementError("self_forbidden");
  }

  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select id from "user" where ${SYSTEM_ADMIN_ROLE_KEY} = any(string_to_array(role, ',')) for update`,
    );

    const [target] = await tx
      .select({ id: user.id, role: user.role, banned: user.banned })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    if (!target) {
      throw new UserManagementError("not_found");
    }

    await assertCanManageTargetRoles(tx, actorRoleKey, target.role);

    if (banned && hasSystemAdminRole(target.role) && !target.banned) {
      const adminCount = await countActiveAdmins(tx);
      if (adminCount <= 1) {
        throw new UserManagementError("last_admin");
      }
    }

    const reason = banned ? (banReason?.trim().slice(0, 200) || null) : null;
    await tx
      .update(user)
      .set({
        banned,
        banReason: reason,
        banExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));

    if (banned) {
      await tx.delete(session).where(eq(session.userId, userId));
    }
    await writeAuditLog(audit, tx);
  });
}

export async function resetUserPassword({
  userId,
  password,
  actorUserId,
  actorRoleKey,
  revokeSessions = true,
  audit,
}: {
  userId: string;
  password: string;
  actorUserId: string;
  actorRoleKey: string;
  revokeSessions?: boolean;
  audit: WriteAuditLogInput;
}) {
  if (!validateCredentialPassword(password)) {
    throw new UserManagementError("invalid_input");
  }
  if (userId === actorUserId) {
    throw new UserManagementError("self_forbidden");
  }

  const hashed = await hashPassword(password);

  return db.transaction(async (tx) => {
    const [target] = await tx.select({ id: user.id, role: user.role }).from(user).where(eq(user.id, userId)).limit(1);
    if (!target) {
      throw new UserManagementError("not_found");
    }
    await assertCanManageTargetRoles(tx, actorRoleKey, target.role);

    const [credential] = await tx
      .select({ id: account.id })
      .from(account)
      .where(and(eq(account.userId, userId), eq(account.providerId, "credential")))
      .limit(1);
    if (!credential) {
      throw new UserManagementError("no_credential");
    }

    await tx
      .update(account)
      .set({ password: hashed, updatedAt: new Date() })
      .where(eq(account.id, credential.id));

    if (revokeSessions) {
      await tx.delete(session).where(eq(session.userId, userId));
    }
    await writeAuditLog(audit, tx);
  });
}

export async function changeOwnPassword({
  userId,
  currentPassword,
  nextPassword,
  audit,
}: {
  userId: string;
  currentPassword: string;
  nextPassword: string;
  audit: WriteAuditLogInput;
}) {
  if (!currentPassword || !validateCredentialPassword(nextPassword)) {
    throw new UserManagementError("invalid_input");
  }
  if (currentPassword === nextPassword) {
    throw new UserManagementError("invalid_input");
  }

  const [credential] = await db
    .select({ id: account.id, password: account.password })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "credential")))
    .limit(1);

  if (!credential?.password) {
    throw new UserManagementError("no_credential");
  }

  const valid = await verifyPassword({ hash: credential.password, password: currentPassword });
  if (!valid) {
    throw new UserManagementError("wrong_password");
  }

  const hashed = await hashPassword(nextPassword);
  await db.transaction(async (tx) => {
    await tx
      .update(account)
      .set({ password: hashed, updatedAt: new Date() })
      .where(eq(account.id, credential.id));
    await writeAuditLog(audit, tx);
  });
}

export async function revokeAllUserSessions({
  userId,
  actorUserId,
  actorRoleKey,
  audit,
}: {
  userId: string;
  actorUserId: string;
  actorRoleKey: string;
  audit: WriteAuditLogInput;
}) {
  if (userId === actorUserId) {
    throw new UserManagementError("self_forbidden");
  }
  return db.transaction(async (tx) => {
    const [target] = await tx.select({ id: user.id, role: user.role }).from(user).where(eq(user.id, userId)).limit(1);
    if (!target) {
      throw new UserManagementError("not_found");
    }
    await assertCanManageTargetRoles(tx, actorRoleKey, target.role);
    await tx.delete(session).where(eq(session.userId, userId));
    await writeAuditLog(audit, tx);
  });
}

export async function revokeSessionForUser({
  sessionId,
  userId,
  currentSessionId,
  audit,
}: {
  sessionId: string;
  userId: string;
  currentSessionId?: string;
  audit: WriteAuditLogInput;
}) {
  if (currentSessionId && sessionId === currentSessionId) {
    throw new UserManagementError("self_forbidden");
  }

  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ id: session.id, userId: session.userId })
      .from(session)
      .where(eq(session.id, sessionId))
      .limit(1);

    if (!row || row.userId !== userId) {
      throw new UserManagementError("not_found");
    }

    await tx.delete(session).where(eq(session.id, sessionId));
    await writeAuditLog(audit, tx);
  });
}

export async function listSessionsForUser(userId: string) {
  return db
    .select({
      id: session.id,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    })
    .from(session)
    .where(and(eq(session.userId, userId), gt(session.expiresAt, new Date())))
    .orderBy(desc(session.updatedAt));
}
