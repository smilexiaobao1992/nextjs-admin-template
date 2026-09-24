import { and, eq, inArray } from "drizzle-orm";
import { db, dbClient } from "../src/lib/db";
import { account, auditLog, menu, role, roleMenu, session, user } from "../src/lib/db/schema";
import { resetUserPassword, revokeAllUserSessions, UserManagementError } from "../src/lib/auth/user-management";
import { createMenu, createRole, deleteRole, RbacError, updateRole } from "../src/lib/rbac/manage";

const actorRoleId = "verify_security_actor_role";
const actorRoleKey = "verify-security-actor";
const actorUserId = "verify_security_actor_user";
const targetUserId = "verify_security_admin_user";
const targetSessionId = "verify_security_admin_session";
const candidateRoleKey = "verify-security-candidate";
const protectedRoleId = "verify_security_protected_role";
const protectedRoleKey = "verify-security-protected";
const rollbackPermissionKey = "verify_security:rollback";
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
      protectedRoleId,
      actorUserId,
      targetUserId,
    ]),
  );
  await db.delete(auditLog).where(eq(auditLog.actorUserId, actorUserId));
  await db.delete(session).where(eq(session.id, targetSessionId));
  await db.delete(account).where(inArray(account.userId, [actorUserId, targetUserId]));
  await db.delete(user).where(inArray(user.id, [actorUserId, targetUserId]));
  // role_menu rows cascade with their role.
  await db.delete(role).where(inArray(role.key, [actorRoleKey, candidateRoleKey, protectedRoleKey]));
  await db.delete(menu).where(eq(menu.permissionKey, rollbackPermissionKey));
}

async function main() {
  await cleanup();

  const nodes = await db
    .select({ id: menu.id, key: menu.permissionKey })
    .from(menu)
    .where(inArray(menu.permissionKey, ["roles:read", "roles:write", "users:write"]));
  const rolesReadId = nodes.find((item) => item.key === "roles:read")?.id;
  const rolesWriteId = nodes.find((item) => item.key === "roles:write")?.id;
  const usersWriteId = nodes.find((item) => item.key === "users:write")?.id;
  assert(rolesReadId && rolesWriteId && usersWriteId, "seeded roles:read, roles:write and users:write nodes are required");

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
    await tx.insert(roleMenu).values([
      { roleId: actorRoleId, menuId: rolesReadId },
      { roleId: actorRoleId, menuId: rolesWriteId },
    ]);
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
        menuIds: [rolesReadId, rolesWriteId, usersWriteId],
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
        menuIds: [usersWriteId],
      },
      actorRoleKey,
      verificationAudit,
    ),
  );

  // Granting an action implicitly grants its page, and stays within the actor's scope.
  await createRole(
    { key: candidateRoleKey, name: "Security verification candidate", menuIds: [rolesWriteId] },
    actorRoleKey,
    { ...verificationAudit, actor: { userId: actorUserId, email: "verify-security-actor@example.invalid" } },
  );
  const candidateGrants = await db
    .select({ menuId: roleMenu.menuId })
    .from(roleMenu)
    .innerJoin(role, eq(role.id, roleMenu.roleId))
    .where(eq(role.key, candidateRoleKey));
  assert(
    candidateGrants.length === 2 && candidateGrants.some((item) => item.menuId === rolesReadId),
    "granting an action must also grant its parent page",
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
    await createMenu(
      { type: "action", parentId: rolesReadId, title: "Security rollback verification", permissionKey: rollbackPermissionKey },
      {
        actor: { userId: "verify_security_missing_actor", email: null },
        action: "menu.create",
        resourceType: "menu",
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

  const [rolledBackNode] = await db
    .select({ id: menu.id })
    .from(menu)
    .where(eq(menu.permissionKey, rollbackPermissionKey));
  assert(!rolledBackNode, "failed audit insert must roll back the protected mutation");

  const [unexpectedBinding] = await db
    .select({ menuId: roleMenu.menuId })
    .from(roleMenu)
    .where(
      and(
        eq(roleMenu.roleId, actorRoleId),
        eq(roleMenu.menuId, usersWriteId),
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
