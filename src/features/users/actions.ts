"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { actorFromSession, getRequestIpAddress, writeAuditLog } from "@/lib/audit/log";
import { requirePermission, requireSession } from "@/lib/auth/session";
import {
  changeOwnPassword,
  createCredentialUser,
  resetUserPassword,
  revokeAllUserSessions,
  revokeSessionForUser,
  setUserBanned,
  setUserRole,
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
    const userId = await createCredentialUser(
      {
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        role: String(formData.get("role") ?? "") || undefined,
      },
      session.user.role ?? "",
    );
    await writeAuditLog({
      actor: actorFromSession(session),
      action: "user.create",
      resourceType: "user",
      resourceId: userId,
      summary: `创建用户 ${String(formData.get("email") ?? "").trim().toLowerCase()}`,
      ipAddress: await getRequestIpAddress(),
    });
  } catch (error) {
    redirect(`/app/users?notice=${noticeFor(error)}`);
  }

  revalidateUserSurfaces();
  redirect("/app/users?notice=created");
}

export async function setUserRoleAction(formData: FormData) {
  const session = await requirePermission("users:write");
  const userId = String(formData.get("userId") ?? "");
  const requestedRole = String(formData.get("role") ?? "");

  if (!userId || !requestedRole) {
    redirect("/app/users?notice=invalid_input");
  }

  try {
    await setUserRole(userId, requestedRole, session.user.role ?? "");
    await writeAuditLog({
      actor: actorFromSession(session),
      action: "user.role_update",
      resourceType: "user",
      resourceId: userId,
      summary: `将用户角色更新为 ${requestedRole}`,
      metadata: { role: requestedRole },
      ipAddress: await getRequestIpAddress(),
    });
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
    });
    await writeAuditLog({
      actor: actorFromSession(session),
      action: banned ? "user.ban" : "user.unban",
      resourceType: "user",
      resourceId: userId,
      summary: banned ? "封禁用户" : "解封用户",
      metadata: banned && banReason ? { banReason } : null,
      ipAddress: await getRequestIpAddress(),
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
      revokeSessions: true,
    });
    await writeAuditLog({
      actor: actorFromSession(session),
      action: "user.password_reset",
      resourceType: "user",
      resourceId: userId,
      summary: "重置用户密码并撤销其会话",
      ipAddress: await getRequestIpAddress(),
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
    await revokeAllUserSessions(userId);
    await writeAuditLog({
      actor: actorFromSession(session),
      action: "user.sessions_revoke",
      resourceType: "user",
      resourceId: userId,
      summary: "撤销用户全部会话",
      ipAddress: await getRequestIpAddress(),
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
      currentPassword,
      nextPassword,
    });
    await writeAuditLog({
      actor: actorFromSession(session),
      action: "user.password_change",
      resourceType: "user",
      resourceId: session.user.id,
      summary: "修改本人密码",
      ipAddress: await getRequestIpAddress(),
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
    });
    await writeAuditLog({
      actor: actorFromSession(session),
      action: "session.revoke",
      resourceType: "session",
      resourceId: sessionId,
      summary: "撤销本人会话",
      ipAddress: await getRequestIpAddress(),
    });
  } catch (error) {
    redirect(`/app/profile?notice=${noticeFor(error)}`);
  }

  revalidateUserSurfaces();
  redirect("/app/profile?notice=session_revoked");
}
