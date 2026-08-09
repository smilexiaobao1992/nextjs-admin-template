import { and, eq, inArray } from "drizzle-orm";
import { db, dbClient } from "../src/lib/db";
import { account, auditLog, permission, role, rolePermission, session, user } from "../src/lib/db/schema";
import { resetUserPassword, revokeAllUserSessions, UserManagementError } from "../src/lib/auth/user-management";
import { createPermission, createRole, deleteRole, RbacError, updateRole } from "../src/lib/rbac/manage";

const actorRoleId = "verify_security_actor_role";
const actorRoleKey = "verify-security-actor";
const actorUserId = "verify_security_actor_user";
const targetUserId = "verify_security_admin_user";
const targetSessionId = "verify_security_admin_session";
const candidateRoleId = "verify_security_candidate_role";
const candidateRoleKey = "verify-security-candidate";
const protectedRoleId = "verify_security_protected_role";
const protectedRoleKey = "verify-security-protected";
const rollbackPermissionKey = "verify_security:write";
const verificationAudit = {
  actor: { userId: actorUserId, email: "verify-security-actor@example.invalid" },
  action: "security.verify",
  resourceType: "verification",
  summary: "Verify rejected authorization path",
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function expectDomainError(
  label: string,
  code: string,
  operation: () => Promise<unknown>,
) {
  try {
    await operation();
  } catch (error) {
    if (
      (error instanceof RbacError || error instanceof UserManagementError) &&
      error.code === code
    ) {
      return;
    }
    throw error;
  }

  throw new Error(`${label}: expected ${code}`);
}

async function cleanup() {
  await db.delete(auditLog).where(
    inArray(auditLog.resourceId, [
      actorRoleId,
      candidateRoleId,
      protectedRoleId,
      actorUserId,
      targetUserId,
    ]),
  );
  await db.delete(session).where(eq(session.id, targetSessionId));
  await db.delete(account).where(inArray(account.userId, [actorUserId, targetUserId]));
  await db.delete(user).where(inArray(user.id, [actorUserId, targetUserId]));
  await db.delete(rolePermission).where(
    inArray(rolePermission.roleId, [actorRoleId, candidateRoleId, protectedRoleId]),
  );
  await db.delete(role).where(inArray(role.id, [actorRoleId, candidateRoleId, protectedRoleId]));
  await db.delete(permission).where(eq(permission.key, rollbackPermissionKey));
}

async function main() {
  await cleanup();

  const permissions = await db
    .select({ id: permission.id, key: permission.key })
    .from(permission)
    .where(inArray(permission.key, ["roles:write", "users:write"]));
  const rolesWriteId = permissions.find((item) => item.key === "roles:write")?.id;
  const usersWriteId = permissions.find((item) => item.key === "users:write")?.id;
  assert(rolesWriteId && usersWriteId, "seeded roles:write and users:write permissions are required");

  await db.transaction(async (tx) => {
    await tx.insert(role).values({
      id: actorRoleId,
      key: actorRoleKey,
      name: "Security verification actor",
    });
    await tx.insert(role).values({
      id: protectedRoleId,
      key: protectedRoleKey,
      name: "Security verification protected role",
    });
    await tx.insert(rolePermission).values({ roleId: actorRoleId, permissionId: rolesWriteId });
    await tx.insert(user).values([
      {
        id: actorUserId,
        name: "Security verification actor",
        email: "verify-security-actor@example.invalid",
        role: actorRoleKey,
      },
      {
        id: targetUserId,
        name: "Security verification admin",
        email: "verify-security-admin@example.invalid",
        role: `member,admin,${protectedRoleKey}`,
      },
    ]);
    await tx.insert(account).values({
      id: "verify_security_admin_account",
      accountId: targetUserId,
      providerId: "credential",
      userId: targetUserId,
      password: "not-used",
    });
    await tx.insert(session).values({
      id: targetSessionId,
      token: "verify_security_admin_token",
      userId: targetUserId,
      expiresAt: new Date(Date.now() + 60_000),
    });
  });

  await expectDomainError("delegated role self-escalation", "role_scope_forbidden", () =>
    updateRole(
      {
        id: actorRoleId,
        name: "Security verification actor",
        permissionIds: [rolesWriteId, usersWriteId],
      },
      actorRoleKey,
      verificationAudit,
    ),
  );

  await expectDomainError("delegated privileged role creation", "role_scope_forbidden", () =>
    createRole(
      {
        key: candidateRoleKey,
        name: "Security verification candidate",
        permissionIds: [usersWriteId],
      },
      actorRoleKey,
      verificationAudit,
    ),
  );

  await expectDomainError("delegated admin password reset", "system_role_forbidden", () =>
    resetUserPassword({
      userId: targetUserId,
      password: "VerifyPassword123!",
      actorUserId,
      actorRoleKey,
      audit: verificationAudit,
    }),
  );

  await expectDomainError("delegated admin session revocation", "system_role_forbidden", () =>
    revokeAllUserSessions({
      userId: targetUserId,
      actorUserId,
      actorRoleKey,
      audit: verificationAudit,
    }),
  );

  await expectDomainError("multi-role user prevents role deletion", "in_use", () =>
    deleteRole(protectedRoleId, actorRoleKey, verificationAudit),
  );

  const [remainingSession] = await db
    .select({ id: session.id })
    .from(session)
    .where(eq(session.id, targetSessionId));
  assert(remainingSession, "forbidden session revocation must leave the target session intact");

  let auditWriteFailed = false;
  try {
    await createPermission(
      { key: rollbackPermissionKey, name: "Security rollback verification" },
      {
        actor: { userId: "verify_security_missing_actor", email: null },
        action: "permission.create",
        resourceType: "permission",
        summary: "Force audit foreign-key failure",
      },
    );
    throw new Error("atomic audit verification: expected the audit insert to fail");
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("atomic audit verification:")) {
      throw error;
    }
    auditWriteFailed = true;
  }
  assert(auditWriteFailed, "atomic audit verification must fail while writing its audit row");

  const [rolledBackPermission] = await db
    .select({ id: permission.id })
    .from(permission)
    .where(eq(permission.key, rollbackPermissionKey));
  assert(!rolledBackPermission, "failed audit insert must roll back the protected mutation");

  const [unexpectedBinding] = await db
    .select({ permissionId: rolePermission.permissionId })
    .from(rolePermission)
    .where(
      and(
        eq(rolePermission.roleId, actorRoleId),
        eq(rolePermission.permissionId, usersWriteId),
      ),
    );
  assert(!unexpectedBinding, "delegated role must not gain a permission it does not hold");

  process.stdout.write("Security authorization boundaries and atomic audit writes verified.\n");
}

main()
  .finally(cleanup)
  .finally(async () => {
    await dbClient.end();
  });
