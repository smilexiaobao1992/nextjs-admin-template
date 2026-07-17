"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import {
  createCredentialUser,
  setUserRole,
  UserManagementError,
} from "@/lib/auth/user-management";

function noticeFor(error: unknown): string {
  if (error instanceof UserManagementError) {
    return error.code;
  }

  return "failed";
}

export async function createUserAction(formData: FormData) {
  const session = await requirePermission("users:write");

  try {
    await createCredentialUser(
      {
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        role: String(formData.get("role") ?? "") || undefined,
      },
      session.user.role ?? "",
    );
  } catch (error) {
    redirect(`/app/users?notice=${noticeFor(error)}`);
  }

  revalidatePath("/app/users");
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
  } catch (error) {
    redirect(`/app/users?notice=${noticeFor(error)}`);
  }

  revalidatePath("/app/users");
  redirect("/app/users?notice=role_updated");
}
