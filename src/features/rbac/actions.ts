"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auditFor } from "@/lib/audit/log";
import { requirePermission } from "@/lib/auth/session";
import { MENU_NODE_TYPES, type MenuNodeType } from "@/lib/db/schema";
import {
  createMenu,
  createRole,
  deleteMenu,
  deleteRole,
  RbacError,
  updateMenu,
  updateRole,
} from "@/lib/rbac/manage";
import { derivePagePermissionKeyFromHref } from "@/lib/rbac/standard-actions";

function noticeFor(error: unknown): string {
  if (error instanceof RbacError) {
    return error.code;
  }
  return "failed";
}

function revalidateRbac() {
  revalidatePath("/app");
  revalidatePath("/app/roles");
  revalidatePath("/app/menus");
  revalidatePath("/app/users");
  revalidatePath("/app/audit");
}

function menuFieldsFrom(formData: FormData, type?: MenuNodeType) {
  const href = String(formData.get("href") ?? "");
  const rawKey = String(formData.get("permissionKey") ?? "").trim();
  const accessMode = String(formData.get("accessMode") ?? "protected");
  const resourcePrefix = String(formData.get("resourcePrefix") ?? "custom")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "") || "custom";

  let permissionKey: string | null = null;
  if (type === "page") {
    permissionKey =
      accessMode === "public"
        ? null
        : rawKey || derivePagePermissionKeyFromHref(href);
  } else if (type === "action") {
    permissionKey =
      rawKey ||
      `${resourcePrefix}:act_${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
  }

  return {
    title: String(formData.get("title") ?? ""),
    href,
    icon: String(formData.get("icon") ?? ""),
    sortOrder: Number(formData.get("sortOrder") ?? 0),
    parentId: String(formData.get("parentId") ?? "") || null,
    permissionKey,
    isVisible: formData.get("isVisible") === "on",
  };
}

// --- Roles ---

export async function createRoleAction(formData: FormData) {
  const session = await requirePermission("roles:write");
  let id = "";
  const key = String(formData.get("key") ?? "");
  const name = String(formData.get("name") ?? "");
  try {
    id = await createRole({
      key,
      name,
      description: String(formData.get("description") ?? ""),
      menuIds: formData.getAll("menuIds").map(String),
      isDefault: formData.get("isDefault") === "on",
    }, session.user.role ?? "", await auditFor(session, {
      action: "role.create",
      resourceType: "role",
      summary: `创建角色 ${name.trim() || key.trim().toLowerCase()}`,
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
        menuIds: formData.getAll("menuIds").map(String),
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

// --- Menu tree ---

export async function createMenuAction(formData: FormData) {
  const session = await requirePermission("menus:write");
  const type = String(formData.get("type") ?? "") as MenuNodeType;
  const fields = menuFieldsFrom(formData, type);
  const retryHref = `/app/menus?mode=create&type=${encodeURIComponent(type)}&parent=${encodeURIComponent(fields.parentId ?? "")}`;
  if (!MENU_NODE_TYPES.includes(type)) {
    redirect(`${retryHref}&notice=invalid_input`);
  }

  let id = "";
  try {
    id = await createMenu({ type, ...fields }, await auditFor(session, {
      action: "menu.create",
      resourceType: "menu",
      summary: `创建菜单节点 ${fields.title.trim()}${fields.permissionKey ? `（${fields.permissionKey}）` : ""}`,
      metadata: { type, permissionKey: fields.permissionKey },
    }), { standardActions: formData.getAll("standardActions").map(String) });
  } catch (error) {
    redirect(`${retryHref}&notice=${noticeFor(error)}`);
  }
  revalidateRbac();
  const returnTo = String(formData.get("returnTo") ?? "");
  const selectedId = returnTo || (type === "action" && fields.parentId ? fields.parentId : id);
  redirect(`/app/menus?selected=${encodeURIComponent(selectedId)}&notice=created`);
}

export async function updateMenuAction(formData: FormData) {
  const session = await requirePermission("menus:write");
  const id = String(formData.get("id") ?? "");
  const type = (String(formData.get("nodeType") ?? "") as MenuNodeType) || undefined;
  try {
    await updateMenu({ id, ...menuFieldsFrom(formData, type) }, await auditFor(session, {
      action: "menu.update",
      resourceType: "menu",
      resourceId: id,
      summary: "更新菜单节点",
    }));
  } catch (error) {
    redirect(`/app/menus?selected=${encodeURIComponent(id)}&notice=${noticeFor(error)}`);
  }
  revalidateRbac();
  redirect(`/app/menus?selected=${encodeURIComponent(id)}&notice=updated`);
}

export async function deleteMenuAction(formData: FormData) {
  const session = await requirePermission("menus:write");
  const id = String(formData.get("id") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "");
  try {
    await deleteMenu(id, await auditFor(session, {
      action: "menu.delete",
      resourceType: "menu",
      resourceId: id,
      summary: "删除菜单节点",
    }));
  } catch (error) {
    redirect(`/app/menus?selected=${encodeURIComponent(returnTo || id)}&notice=${noticeFor(error)}`);
  }
  revalidateRbac();
  if (returnTo) {
    redirect(`/app/menus?selected=${encodeURIComponent(returnTo)}&notice=deleted`);
  }
  redirect("/app/menus?notice=deleted");
}
