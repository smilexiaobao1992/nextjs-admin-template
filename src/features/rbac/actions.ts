"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
}

// --- Permissions ---

export async function createPermissionAction(formData: FormData) {
  await requirePermission("permissions:write");
  let id = "";
  try {
    id = await createPermission({
      key: String(formData.get("key") ?? ""),
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
    });
  } catch (error) {
    redirect(`/app/permissions?mode=create&notice=${noticeFor(error)}`);
  }
  revalidateRbac();
  redirect(`/app/permissions?selected=${encodeURIComponent(id)}&notice=created`);
}

export async function updatePermissionAction(formData: FormData) {
  await requirePermission("permissions:write");
  const id = String(formData.get("id") ?? "");
  try {
    await updatePermission({
      id,
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
    });
  } catch (error) {
    redirect(`/app/permissions?notice=${noticeFor(error)}`);
  }
  revalidateRbac();
  redirect(`/app/permissions?selected=${encodeURIComponent(id)}&notice=updated`);
}

export async function deletePermissionAction(formData: FormData) {
  await requirePermission("permissions:write");
  try {
    await deletePermission(String(formData.get("id") ?? ""));
  } catch (error) {
    redirect(`/app/permissions?notice=${noticeFor(error)}`);
  }
  revalidateRbac();
  redirect("/app/permissions?notice=deleted");
}

// --- Roles ---

export async function createRoleAction(formData: FormData) {
  await requirePermission("roles:write");
  let id = "";
  try {
    id = await createRole({
      key: String(formData.get("key") ?? ""),
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      permissionIds: formData.getAll("permissionIds").map(String),
      isDefault: formData.get("isDefault") === "on",
    });
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
    );
  } catch (error) {
    redirect(`/app/roles?notice=${noticeFor(error)}`);
  }
  revalidateRbac();
  redirect(`/app/roles?selected=${encodeURIComponent(id)}&notice=updated`);
}

export async function deleteRoleAction(formData: FormData) {
  await requirePermission("roles:write");
  try {
    await deleteRole(String(formData.get("id") ?? ""));
  } catch (error) {
    redirect(`/app/roles?notice=${noticeFor(error)}`);
  }
  revalidateRbac();
  redirect("/app/roles?notice=deleted");
}

// --- Menus ---

export async function createMenuAction(formData: FormData) {
  await requirePermission("menus:write");
  let id = "";
  try {
    id = await createMenu({
      title: String(formData.get("title") ?? ""),
      href: String(formData.get("href") ?? ""),
      icon: String(formData.get("icon") ?? ""),
      sortOrder: Number(formData.get("sortOrder") ?? 0),
      parentId: String(formData.get("parentId") ?? "") || null,
      permissionId: String(formData.get("permissionId") ?? "") || null,
      isVisible: formData.get("isVisible") === "on",
    });
  } catch (error) {
    redirect(`/app/menus?mode=create&notice=${noticeFor(error)}`);
  }
  revalidateRbac();
  redirect(`/app/menus?selected=${encodeURIComponent(id)}&notice=created`);
}

export async function updateMenuAction(formData: FormData) {
  await requirePermission("menus:write");
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
    });
  } catch (error) {
    redirect(`/app/menus?notice=${noticeFor(error)}`);
  }
  revalidateRbac();
  redirect(`/app/menus?selected=${encodeURIComponent(id)}&notice=updated`);
}

export async function deleteMenuAction(formData: FormData) {
  await requirePermission("menus:write");
  try {
    await deleteMenu(String(formData.get("id") ?? ""));
  } catch (error) {
    redirect(`/app/menus?notice=${noticeFor(error)}`);
  }
  revalidateRbac();
  redirect("/app/menus?notice=deleted");
}
