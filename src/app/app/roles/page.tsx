import { Plus, Shield, ShieldCheck } from "lucide-react";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { GuardedDirectoryLink, GuardedEditForm } from "@/components/ui/guarded-edit-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { createRoleAction, deleteRoleAction, updateRoleAction } from "@/features/rbac/actions";
import { rbacNoticeMessages } from "@/features/rbac/messages";
import { requirePermission } from "@/lib/auth/session";
import { canManageRolePermissionSets } from "@/lib/auth/authorization";
import { SYSTEM_ADMIN_ROLE_KEY } from "@/lib/rbac/constants";
import { MenuGrantTree, type GrantTreeNode } from "@/features/rbac/components/menu-grant-tree";
import {
  isSystemAdminRole,
  listAllMenus,
  listAllRoles,
  listMenuIdsByRole,
  roleHasPermission,
} from "@/lib/rbac/permissions";
import { parseRoleKeys } from "@/lib/rbac/role-keys";
import { cn } from "@/lib/utils";

export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; selected?: string; mode?: string }>;
}) {
  const session = await requirePermission("roles:read");
  const { notice, selected: selectedId, mode } = await searchParams;
  const roleKey = session.user.role ?? "";
  const [roles, menus, roleMenuIds, canWrite] = await Promise.all([
    listAllRoles(),
    listAllMenus(),
    listMenuIdsByRole(),
    roleHasPermission(roleKey, "roles:write"),
  ]);
  const selectedRole = roles.find((item) => item.id === selectedId) ?? roles[0] ?? null;
  const createMode = canWrite && mode === "create";
  const canManageSystemRoles = isSystemAdminRole(roleKey);
  const actorRoleKeys = new Set(parseRoleKeys(roleKey));
  const actorMenuIds = roles
    .filter((item) => actorRoleKeys.has(item.key))
    .flatMap((item) => roleMenuIds[item.id] ?? []);
  const editableMenuIds = canManageSystemRoles ? null : [...new Set(actorMenuIds)];
  const treeNodes: GrantTreeNode[] = menus.map(({ id, parentId, type, title, permissionKey, sortOrder }) => ({
    id,
    parentId,
    type,
    title,
    permissionKey,
    sortOrder,
  }));
  const canManageSelectedRole = canManageSystemRoles || (selectedRole
    ? canManageRolePermissionSets({
        actorPermissionIds: actorMenuIds,
        currentPermissionIds: roleMenuIds[selectedRole.id] ?? [],
        nextPermissionIds: roleMenuIds[selectedRole.id] ?? [],
      })
    : false);

  return (
    <div className="space-y-7">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">角色</p>
        <h1 className="text-balance text-3xl font-semibold tracking-[-0.022em]">角色管理</h1>
        <p className="mt-2 text-pretty text-sm text-muted-foreground">
          为不同岗位设置菜单和操作权限。系统管理员始终拥有全部权限。
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

        <section
          key={createMode ? "create" : selectedRole?.id ?? "empty"}
          id="rbac-detail"
          className="min-w-0 scroll-mt-20 rounded-xl bg-card p-5 shadow-[0_1px_2px_rgba(62,47,35,0.06),0_10px_28px_rgba(62,47,35,0.09)] sm:p-6"
        >
          {createMode ? (
            <>
              <div className="mb-6 flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/12 text-primary">
                  <Shield aria-hidden="true" className="size-4" />
                </span>
                <div>
                  <h2 className="font-semibold">新增角色</h2>
                  <p className="text-sm text-muted-foreground">角色标识创建后不可修改，请使用简短、稳定的英文名称。</p>
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
                <MenuGrantTree nodes={treeNodes} grantedIds={[]} editableIds={editableMenuIds} />
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
              nodes={treeNodes}
              grantedIds={roleMenuIds[selectedRole.id] ?? []}
              editableIds={editableMenuIds}
              canEdit={canWrite && canManageSelectedRole && (!selectedRole.isSystem || canManageSystemRoles)}
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
function RoleDetail({
  role,
  nodes,
  grantedIds,
  editableIds,
  canEdit,
}: {
  role: RoleRow;
  nodes: GrantTreeNode[];
  grantedIds: string[];
  editableIds: string[] | null;
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
              confirmLabel="确认删除"
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
              系统管理员始终拥有全部权限，无需逐项配置。
            </div>
          ) : (
            <MenuGrantTree nodes={nodes} grantedIds={grantedIds} editableIds={editableIds} />
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
            <MenuGrantTree nodes={nodes} grantedIds={grantedIds} editableIds={editableIds} readOnly />
          )}
        </div>
      )}
    </>
  );
}
