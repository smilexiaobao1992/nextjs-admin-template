"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auditFor } from "@/lib/audit/log";
import { requirePermission, requireSession } from "@/lib/auth/session";
import {
  changeOwnPassword,
  createCredentialUser,
  resetUserPassword,
  revokeAllUserSessions,
  revokeSessionForUser,
  setUserBanned,
  setUserRoles,
  UserManagementError,
} from "@/lib/auth/user-management";

function noticeFor(error: unknown): string {
  if (error instanceof UserManagementError) {
    return error.code;
  }

  return "failed";
}

function revalidateUserSurfaces() {
  revalidatePath("/app");
  revalidatePath("/app/users");
  revalidatePath("/app/profile");
  revalidatePath("/app/audit");
}

export async function createUserAction(formData: FormData) {
  const session = await requirePermission("users:write");

  try {
    await createCredentialUser(
      {
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        roles: formData.getAll("roles").map(String),
      },
      session.user.role ?? "",
      await auditFor(session, {
        action: "user.create",
        resourceType: "user",
        summary: `创建用户 ${String(formData.get("email") ?? "").trim().toLowerCase()}`,
      }),
    );
  } catch (error) {
    redirect(`/app/users?notice=${noticeFor(error)}`);
  }

  revalidateUserSurfaces();
  redirect("/app/users?notice=created");
}

export async function setUserRolesAction(formData: FormData) {
  const session = await requirePermission("users:write");
  const userId = String(formData.get("userId") ?? "");
  const requestedRoles = formData.getAll("roles").map(String).filter(Boolean);

  if (!userId || requestedRoles.length === 0) {
    redirect("/app/users?notice=invalid_input");
  }

  try {
    await setUserRoles(userId, requestedRoles, session.user.role ?? "", await auditFor(session, {
      action: "user.role_update",
      resourceType: "user",
      resourceId: userId,
      summary: `更新用户角色为 ${requestedRoles.join(", ")}`,
      metadata: { roles: requestedRoles },
    }));
  } catch (error) {
    redirect(`/app/users?notice=${noticeFor(error)}`);
  }

  revalidateUserSurfaces();
  redirect("/app/users?notice=role_updated");
}

export async function setUserBannedAction(formData: FormData) {
  const session = await requirePermission("users:write");
  const userId = String(formData.get("userId") ?? "");
  const banned = String(formData.get("banned") ?? "") === "true";
  const banReason = String(formData.get("banReason") ?? "");

  if (!userId) {
    redirect("/app/users?notice=invalid_input");
  }

  try {
    await setUserBanned({
      userId,
      banned,
      banReason,
      actorUserId: session.user.id,
      actorRoleKey: session.user.role ?? "",
      audit: await auditFor(session, {
        action: banned ? "user.ban" : "user.unban",
        resourceType: "user",
        resourceId: userId,
        summary: banned ? "封禁用户" : "解封用户",
        metadata: banned && banReason ? { banReason } : null,
      }),
    });
  } catch (error) {
    redirect(`/app/users?notice=${noticeFor(error)}`);
  }

  revalidateUserSurfaces();
  redirect(`/app/users?notice=${banned ? "banned" : "unbanned"}`);
}

export async function resetUserPasswordAction(formData: FormData) {
  const session = await requirePermission("users:write");
  const userId = String(formData.get("userId") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!userId) {
    redirect("/app/users?notice=invalid_input");
  }

  try {
    await resetUserPassword({
      userId,
      password,
      actorUserId: session.user.id,
      actorRoleKey: session.user.role ?? "",
      revokeSessions: true,
      audit: await auditFor(session, {
        action: "user.password_reset",
        resourceType: "user",
        resourceId: userId,
        summary: "重置用户密码并撤销其会话",
      }),
    });
  } catch (error) {
    redirect(`/app/users?notice=${noticeFor(error)}`);
  }

  revalidateUserSurfaces();
  redirect("/app/users?notice=password_reset");
}

export async function revokeUserSessionsAction(formData: FormData) {
  const session = await requirePermission("users:write");
  const userId = String(formData.get("userId") ?? "");

  if (!userId) {
    redirect("/app/users?notice=invalid_input");
  }

  try {
    await revokeAllUserSessions({
      userId,
      actorUserId: session.user.id,
      actorRoleKey: session.user.role ?? "",
      audit: await auditFor(session, {
        action: "user.sessions_revoke",
        resourceType: "user",
        resourceId: userId,
        summary: "撤销用户全部会话",
      }),
    });
  } catch (error) {
    redirect(`/app/users?notice=${noticeFor(error)}`);
  }

  revalidateUserSurfaces();
  redirect("/app/users?notice=sessions_revoked");
}

export async function changeOwnPasswordAction(formData: FormData) {
  const session = await requireSession();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const nextPassword = String(formData.get("nextPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (nextPassword !== confirmPassword) {
    redirect("/app/profile?notice=password_mismatch");
  }

  try {
    await changeOwnPassword({
      userId: session.user.id,
      currentSessionId: session.session.id,
      currentPassword,
      nextPassword,
      audit: await auditFor(session, {
        action: "user.password_change",
        resourceType: "user",
        resourceId: session.user.id,
        summary: "修改本人密码并撤销其他会话",
      }),
    });
  } catch (error) {
    redirect(`/app/profile?notice=${noticeFor(error)}`);
  }

  revalidateUserSurfaces();
  redirect("/app/profile?notice=password_changed");
}

export async function revokeOwnSessionAction(formData: FormData) {
  const session = await requireSession();
  const sessionId = String(formData.get("sessionId") ?? "");

  if (!sessionId) {
    redirect("/app/profile?notice=invalid_input");
  }

  try {
    await revokeSessionForUser({
      sessionId,
      userId: session.user.id,
      currentSessionId: session.session.id,
      audit: await auditFor(session, {
        action: "session.revoke",
        resourceType: "session",
        resourceId: sessionId,
        summary: "撤销本人会话",
      }),
    });
  } catch (error) {
    redirect(`/app/profile?notice=${noticeFor(error)}`);
  }

  revalidateUserSurfaces();
  redirect("/app/profile?notice=session_revoked");
}
