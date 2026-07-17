import { Plus, Shield, ShieldCheck } from "lucide-react";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { GuardedDirectoryLink, GuardedEditForm } from "@/components/ui/guarded-edit-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { createRoleAction, deleteRoleAction, updateRoleAction } from "@/features/rbac/actions";
import { rbacNoticeMessages } from "@/features/rbac/messages";
import { requirePermission } from "@/lib/auth/session";
import { SYSTEM_ADMIN_ROLE_KEY } from "@/lib/rbac/constants";
import {
  isSystemAdminRole,
  listAllPermissions,
  listAllRoles,
  listPermissionIdsByRole,
  roleHasPermission,
} from "@/lib/rbac/permissions";
import { cn } from "@/lib/utils";

export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; selected?: string; mode?: string }>;
}) {
  const session = await requirePermission("roles:read");
  const { notice, selected: selectedId, mode } = await searchParams;
  const roleKey = session.user.role ?? "";
  const [roles, permissions, rolePermissions, canWrite] = await Promise.all([
    listAllRoles(),
    listAllPermissions(),
    listPermissionIdsByRole(),
    roleHasPermission(roleKey, "roles:write"),
  ]);
  const selectedRole = roles.find((item) => item.id === selectedId) ?? roles[0] ?? null;
  const createMode = canWrite && mode === "create";
  const canManageSystemRoles = isSystemAdminRole(roleKey);

  return (
    <div className="space-y-7">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">角色</p>
        <h1 className="text-balance text-3xl font-semibold tracking-[-0.022em]">角色管理</h1>
        <p className="mt-2 text-pretty text-sm text-muted-foreground">
          左侧选择角色，右侧按资源分配操作权限。系统管理员自动拥有所有权限。
        </p>
      </div>

      {notice && rbacNoticeMessages[notice] ? (
        <p role="status" className="rounded-lg bg-card px-4 py-3 text-sm shadow-[0_1px_2px_rgba(62,47,35,0.06),0_8px_22px_rgba(62,47,35,0.07)]">
          {rbacNoticeMessages[notice]}
        </p>
      ) : null}

      <div className="grid min-w-0 gap-5 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
        <aside className="overflow-hidden rounded-xl bg-card shadow-[0_1px_2px_rgba(62,47,35,0.06),0_10px_28px_rgba(62,47,35,0.09)] lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
            <div>
              <h2 className="font-semibold">角色列表</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">{roles.length} 个角色</p>
            </div>
            {canWrite ? (
              <GuardedDirectoryLink
                href="/app/roles?mode=create#rbac-detail"
                aria-label="新增角色"
                className="inline-flex size-10 items-center justify-center rounded-lg bg-secondary/70 text-secondary-foreground transition-[background-color,color,transform] hover:bg-primary hover:text-primary-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Plus aria-hidden="true" className="size-4" />
              </GuardedDirectoryLink>
            ) : null}
          </div>
          {roles.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">还没有角色。</div>
          ) : (
            <nav aria-label="角色列表" className="max-h-[60vh] space-y-1 overflow-y-auto p-2.5 lg:max-h-[calc(100vh-12rem)]">
              {roles.map((item) => (
                <GuardedDirectoryLink
                  key={item.id}
                  href={`/app/roles?selected=${encodeURIComponent(item.id)}#rbac-detail`}
                  className={cn(
                    "flex min-h-12 min-w-0 items-center gap-3 rounded-lg px-3 py-2 transition-[background-color,color,box-shadow,transform] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    !createMode && selectedRole?.id === item.id
                      ? "bg-primary text-primary-foreground shadow-[0_7px_18px_rgba(126,47,24,0.2)]"
                      : "hover:bg-secondary/75 hover:text-secondary-foreground",
                  )}
                >
                  {item.isSystem ? <ShieldCheck aria-hidden="true" className="size-4 shrink-0" /> : <Shield aria-hidden="true" className="size-4 shrink-0" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{item.name}</span>
                    <span className={cn("block truncate font-mono text-[11px]", !createMode && selectedRole?.id === item.id ? "text-primary-foreground/75" : "text-muted-foreground")}>
                      {item.key}{item.isDefault ? " · 默认" : ""}
                    </span>
                  </span>
                </GuardedDirectoryLink>
              ))}
            </nav>
          )}
        </aside>

        <section id="rbac-detail" className="min-w-0 scroll-mt-20 rounded-xl bg-card p-5 shadow-[0_1px_2px_rgba(62,47,35,0.06),0_10px_28px_rgba(62,47,35,0.09)] sm:p-6">
          {createMode ? (
            <>
              <div className="mb-6 flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/12 text-primary">
                  <Shield aria-hidden="true" className="size-4" />
                </span>
                <div>
                  <h2 className="font-semibold">新增角色</h2>
                  <p className="text-sm text-muted-foreground">Key 创建后不可修改，用于用户和服务端授权。</p>
                </div>
              </div>
              <GuardedEditForm action={createRoleAction} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="role-key">Key</Label>
                    <Input id="role-key" name="key" placeholder="ops" required pattern="[a-z][a-z0-9_-]{1,63}" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role-name">名称</Label>
                    <Input id="role-name" name="name" required maxLength={100} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="role-description">说明</Label>
                    <Input id="role-description" name="description" maxLength={200} />
                  </div>
                </div>
                <PermissionMatrix permissions={permissions} selectedIds={new Set()} />
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/70 pt-4">
                  <label className="flex min-h-10 items-center gap-2 text-sm">
                    <input type="checkbox" name="isDefault" />
                    设为新用户默认角色
                  </label>
                  <SubmitButton pendingLabel="创建中…">创建角色</SubmitButton>
                </div>
              </GuardedEditForm>
            </>
          ) : selectedRole ? (
            <RoleDetail
              role={selectedRole}
              permissions={permissions}
              selectedIds={new Set(rolePermissions[selectedRole.id] ?? [])}
              canEdit={canWrite && (!selectedRole.isSystem || canManageSystemRoles)}
            />
          ) : (
            <div className="py-16 text-center">
              <Shield aria-hidden="true" className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-4 font-medium">请选择角色</p>
              <p className="mt-2 text-sm text-muted-foreground">从左侧列表选择要查看的角色。</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

type RoleRow = Awaited<ReturnType<typeof listAllRoles>>[number];
type PermissionRow = Awaited<ReturnType<typeof listAllPermissions>>[number];

function RoleDetail({
  role,
  permissions,
  selectedIds,
  canEdit,
}: {
  role: RoleRow;
  permissions: PermissionRow[];
  selectedIds: Set<string>;
  canEdit: boolean;
}) {
  const isAdmin = role.key === SYSTEM_ADMIN_ROLE_KEY;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-xs text-primary">{role.key}</p>
          <h2 className="mt-1 break-words text-xl font-semibold tracking-[-0.012em]">
            {canEdit ? "编辑角色" : role.name}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {role.isSystem ? "系统角色" : "自定义角色"}{role.isDefault ? " · 默认角色" : ""}{isAdmin ? " · 自动拥有全部权限" : ""}
          </p>
        </div>
        {canEdit && !role.isSystem ? (
          <form action={deleteRoleAction}>
            <input type="hidden" name="id" value={role.id} />
            <ConfirmSubmitButton
              size="sm"
              variant="destructive"
              pendingLabel="删除中…"
              confirmMessage={`确认删除角色“${role.name}”？请先确认没有用户使用该角色。`}
            >
              删除
            </ConfirmSubmitButton>
          </form>
        ) : null}
      </div>

      {canEdit ? (
        <GuardedEditForm action={updateRoleAction} className="space-y-6">
          <input type="hidden" name="id" value={role.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`role-name-${role.id}`}>名称</Label>
              <Input id={`role-name-${role.id}`} name="name" defaultValue={role.name} required maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`role-description-${role.id}`}>说明</Label>
              <Input id={`role-description-${role.id}`} name="description" defaultValue={role.description ?? ""} maxLength={200} />
            </div>
          </div>
          {isAdmin ? (
            <div className="rounded-lg bg-secondary/70 px-4 py-3 text-sm text-secondary-foreground">
              系统管理员不需要逐项勾选，新增权限也会自动生效。
            </div>
          ) : (
            <PermissionMatrix permissions={permissions} selectedIds={selectedIds} />
          )}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/70 pt-4">
            <label className="flex min-h-10 items-center gap-2 text-sm">
              <input type="checkbox" name="isDefault" defaultChecked={role.isDefault} disabled={role.isSystem} />
              设为新用户默认角色
            </label>
            <SubmitButton pendingLabel="保存中…">保存角色</SubmitButton>
          </div>
        </GuardedEditForm>
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium">说明</h3>
            <p className="mt-2 break-words text-sm text-muted-foreground">{role.description || "无说明"}</p>
          </div>
          {isAdmin ? (
            <p className="rounded-lg bg-secondary/70 px-4 py-3 text-sm text-secondary-foreground">系统管理员自动拥有全部权限。</p>
          ) : (
            <PermissionMatrix permissions={permissions} selectedIds={selectedIds} readOnly />
          )}
        </div>
      )}
    </>
  );
}

function PermissionMatrix({
  permissions,
  selectedIds,
  readOnly = false,
}: {
  permissions: PermissionRow[];
  selectedIds: Set<string>;
  readOnly?: boolean;
}) {
  const groups = permissions.reduce<Record<string, PermissionRow[]>>((result, permission) => {
    const resource = permission.key.split(":", 1)[0] || "other";
    (result[resource] ??= []).push(permission);
    return result;
  }, {});
  const actionLabels: Record<string, string> = {
    view: "访问",
    read: "查看",
    write: "管理",
    create: "创建",
    update: "编辑",
    delete: "删除",
  };
  const visibleGroups = Object.entries(groups)
    .map(([resource, items]) => [
      resource,
      readOnly ? items.filter((item) => selectedIds.has(item.id)) : items,
    ] as const)
    .filter(([, items]) => items.length > 0);

  return (
    <fieldset>
      <legend className="mb-3 text-sm font-medium">权限范围</legend>
      {visibleGroups.length === 0 ? (
        <p className="rounded-lg bg-secondary/45 px-4 py-6 text-center text-sm text-muted-foreground">
          未分配任何权限
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg bg-secondary/35">
          {visibleGroups.map(([resource, items], index) => (
            <div key={resource} className={cn("grid gap-3 px-4 py-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-center", index > 0 && "border-t border-border/70")}>
              <div className="min-w-0">
                <p className="truncate font-mono text-sm font-medium">{resource}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{items[0]?.name.replace(/^(查看|管理|访问|创建|编辑|删除)/, "") || resource}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {items.map((permission) => {
                  const action = permission.key.split(":")[1] || permission.key;
                  const checked = selectedIds.has(permission.id);
                  if (readOnly) {
                    return (
                      <span key={permission.id} className="flex min-h-10 items-center rounded-lg bg-card/80 px-3 text-sm shadow-[0_1px_2px_rgba(62,47,35,0.05)]">
                        {actionLabels[action] ?? action}
                      </span>
                    );
                  }
                  return (
                    <label key={permission.id} className="flex min-h-10 items-center gap-2 rounded-lg border border-border/70 bg-card/70 px-3 text-sm transition-colors hover:bg-accent">
                      <input type="checkbox" name="permissionIds" value={permission.id} defaultChecked={checked} />
                      <span>{actionLabels[action] ?? action}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </fieldset>
  );
}
