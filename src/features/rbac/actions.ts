"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { actorFromSession, getRequestIpAddress, type WriteAuditLogInput } from "@/lib/audit/log";
import { requirePermission } from "@/lib/auth/session";
import {
  createMenu,
  createPermission,
  createRole,
  deleteMenu,
  deletePermission,
  deleteRole,
  RbacError,
  updateMenu,
  updatePermission,
  updateRole,
} from "@/lib/rbac/manage";

function noticeFor(error: unknown): string {
  if (error instanceof RbacError) {
    return error.code;
  }
  return "failed";
}

function revalidateRbac() {
  revalidatePath("/app");
  revalidatePath("/app/roles");
  revalidatePath("/app/permissions");
  revalidatePath("/app/menus");
  revalidatePath("/app/users");
  revalidatePath("/app/audit");
}

async function auditFor(
  session: { user: { id: string; email: string } },
  input: Omit<WriteAuditLogInput, "actor" | "ipAddress">,
): Promise<WriteAuditLogInput> {
  return {
    ...input,
    actor: actorFromSession(session),
    ipAddress: await getRequestIpAddress(),
  };
}

// --- Permissions ---

export async function createPermissionAction(formData: FormData) {
  const session = await requirePermission("permissions:write");
  let id = "";
  const key = String(formData.get("key") ?? "");
  try {
    id = await createPermission({
      key,
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
    }, await auditFor(session, {
      action: "permission.create",
      resourceType: "permission",
      summary: `创建权限 ${key.trim().toLowerCase()}`,
    }));
  } catch (error) {
    redirect(`/app/permissions?mode=create&notice=${noticeFor(error)}`);
  }
  revalidateRbac();
  redirect(`/app/permissions?selected=${encodeURIComponent(id)}&notice=created`);
}

export async function updatePermissionAction(formData: FormData) {
  const session = await requirePermission("permissions:write");
  const id = String(formData.get("id") ?? "");
  try {
    await updatePermission({
      id,
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
    }, await auditFor(session, {
      action: "permission.update",
      resourceType: "permission",
      resourceId: id,
      summary: "更新权限",
    }));
  } catch (error) {
    redirect(`/app/permissions?notice=${noticeFor(error)}`);
  }
  revalidateRbac();
  redirect(`/app/permissions?selected=${encodeURIComponent(id)}&notice=updated`);
}

export async function deletePermissionAction(formData: FormData) {
  const session = await requirePermission("permissions:write");
  const id = String(formData.get("id") ?? "");
  try {
    await deletePermission(id, await auditFor(session, {
      action: "permission.delete",
      resourceType: "permission",
      resourceId: id,
      summary: "删除权限",
    }));
  } catch (error) {
    redirect(`/app/permissions?notice=${noticeFor(error)}`);
  }
  revalidateRbac();
  redirect("/app/permissions?notice=deleted");
}

// --- Roles ---

export async function createRoleAction(formData: FormData) {
  const session = await requirePermission("roles:write");
  let id = "";
  const key = String(formData.get("key") ?? "");
  try {
    id = await createRole({
      key,
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      permissionIds: formData.getAll("permissionIds").map(String),
      isDefault: formData.get("isDefault") === "on",
    }, session.user.role ?? "", await auditFor(session, {
      action: "role.create",
      resourceType: "role",
      summary: `创建角色 ${key.trim().toLowerCase()}`,
    }));
  } catch (error) {
    redirect(`/app/roles?mode=create&notice=${noticeFor(error)}`);
  }
  revalidateRbac();
  redirect(`/app/roles?selected=${encodeURIComponent(id)}&notice=created`);
}

export async function updateRoleAction(formData: FormData) {
  const session = await requirePermission("roles:write");
  const id = String(formData.get("id") ?? "");
  try {
    await updateRole(
      {
        id,
        name: String(formData.get("name") ?? ""),
        description: String(formData.get("description") ?? ""),
        permissionIds: formData.getAll("permissionIds").map(String),
        isDefault: formData.get("isDefault") === "on",
      },
      session.user.role ?? "",
      await auditFor(session, {
        action: "role.update",
        resourceType: "role",
        resourceId: id,
        summary: "更新角色",
      }),
    );
  } catch (error) {
    redirect(`/app/roles?notice=${noticeFor(error)}`);
  }
  revalidateRbac();
  redirect(`/app/roles?selected=${encodeURIComponent(id)}&notice=updated`);
}

export async function deleteRoleAction(formData: FormData) {
  const session = await requirePermission("roles:write");
  const id = String(formData.get("id") ?? "");
  try {
    await deleteRole(id, session.user.role ?? "", await auditFor(session, {
      action: "role.delete",
      resourceType: "role",
      resourceId: id,
      summary: "删除角色",
    }));
  } catch (error) {
    redirect(`/app/roles?notice=${noticeFor(error)}`);
  }
  revalidateRbac();
  redirect("/app/roles?notice=deleted");
}

// --- Menus ---

export async function createMenuAction(formData: FormData) {
  const session = await requirePermission("menus:write");
  let id = "";
  const title = String(formData.get("title") ?? "");
  try {
    id = await createMenu({
      title,
      href: String(formData.get("href") ?? ""),
      icon: String(formData.get("icon") ?? ""),
      sortOrder: Number(formData.get("sortOrder") ?? 0),
      parentId: String(formData.get("parentId") ?? "") || null,
      permissionId: String(formData.get("permissionId") ?? "") || null,
      isVisible: formData.get("isVisible") === "on",
    }, await auditFor(session, {
      action: "menu.create",
      resourceType: "menu",
      summary: `创建菜单 ${title.trim()}`,
    }));
  } catch (error) {
    redirect(`/app/menus?mode=create&notice=${noticeFor(error)}`);
  }
  revalidateRbac();
  redirect(`/app/menus?selected=${encodeURIComponent(id)}&notice=created`);
}

export async function updateMenuAction(formData: FormData) {
  const session = await requirePermission("menus:write");
  const id = String(formData.get("id") ?? "");
  try {
    await updateMenu({
      id,
      title: String(formData.get("title") ?? ""),
      href: String(formData.get("href") ?? ""),
      icon: String(formData.get("icon") ?? ""),
      sortOrder: Number(formData.get("sortOrder") ?? 0),
      parentId: String(formData.get("parentId") ?? "") || null,
      permissionId: String(formData.get("permissionId") ?? "") || null,
      isVisible: formData.get("isVisible") === "on",
    }, await auditFor(session, {
      action: "menu.update",
      resourceType: "menu",
      resourceId: id,
      summary: "更新菜单",
    }));
  } catch (error) {
    redirect(`/app/menus?notice=${noticeFor(error)}`);
  }
  revalidateRbac();
  redirect(`/app/menus?selected=${encodeURIComponent(id)}&notice=updated`);
}

export async function deleteMenuAction(formData: FormData) {
  const session = await requirePermission("menus:write");
  const id = String(formData.get("id") ?? "");
  try {
    await deleteMenu(id, await auditFor(session, {
      action: "menu.delete",
      resourceType: "menu",
      resourceId: id,
      summary: "删除菜单",
    }));
  } catch (error) {
    redirect(`/app/menus?notice=${noticeFor(error)}`);
  }
  revalidateRbac();
  redirect("/app/menus?notice=deleted");
}
