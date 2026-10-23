import { PageHeader } from "@/components/layout/page-header";
import { Plus, Shield, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { GuardedDirectoryLink, GuardedEditForm } from "@/components/ui/guarded-edit-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusNotice } from "@/components/ui/status-notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { createRoleAction, deleteRoleAction, updateRoleAction } from "@/features/rbac/actions";
import { rbacNoticeMessages } from "@/features/rbac/messages";
import { can, requirePermission } from "@/lib/auth/session";
import { canManageRolePermissionSets } from "@/lib/auth/authorization";
import { SYSTEM_ADMIN_ROLE_KEY } from "@/lib/rbac/constants";
import { MenuGrantTree, type GrantTreeNode } from "@/features/rbac/components/menu-grant-tree";
import {
  isSystemAdminRole,
  listAllMenus,
  listAllRoles,
  listMenuIdsByRole,
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
    can(session, "roles:write"),
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
      <PageHeader
        eyebrow="角色与授权"
        title="角色管理"
        description="按岗位分配可访问的菜单页面与页面内操作权限。创建角色只需填写中文名称并勾选权限即可。"
      />

      <StatusNotice notice={notice} messages={rbacNoticeMessages} />

      <div className="grid min-w-0 gap-5 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
        <aside className="overflow-hidden rounded-xl bg-card shadow-card lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
            <div>
              <h2 className="font-semibold">角色列表</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">共 {roles.length} 个岗位角色</p>
            </div>
            {canWrite ? (
              <GuardedDirectoryLink
                href="/app/roles?mode=create#rbac-detail"
                aria-label="新增角色"
                className="inline-flex h-9 items-center gap-1 rounded-lg bg-secondary/70 px-2.5 text-xs font-medium text-secondary-foreground transition-[background-color,color,transform] hover:bg-primary hover:text-primary-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Plus aria-hidden="true" className="size-3.5" />
                新增角色
              </GuardedDirectoryLink>
            ) : null}
          </div>
          {roles.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">还没有角色。</div>
          ) : (
            <nav aria-label="角色列表" className="max-h-[60vh] space-y-1 overflow-y-auto p-2.5 lg:max-h-[calc(100vh-12rem)]">
              {roles.map((item) => {
                const active = !createMode && selectedRole?.id === item.id;
                const roleHint =
                  item.key === SYSTEM_ADMIN_ROLE_KEY
                    ? "系统超管 · 全部权限"
                    : item.isDefault
                      ? "新用户默认角色"
                      : item.description || (item.isSystem ? "系统内置角色" : "自定义角色");

                return (
                  <GuardedDirectoryLink
                    key={item.id}
                    href={`/app/roles?selected=${encodeURIComponent(item.id)}#rbac-detail`}
                    className={cn(
                      "flex min-h-12 min-w-0 items-center gap-3 rounded-lg px-3 py-2 transition-[background-color,color,transform] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-secondary/75 hover:text-secondary-foreground",
                    )}
                  >
                    {item.isSystem ? <ShieldCheck aria-hidden="true" className="size-4 shrink-0" /> : <Shield aria-hidden="true" className="size-4 shrink-0" />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{item.name}</span>
                      <span className={cn("block truncate text-xs", active ? "text-primary-foreground/80" : "text-muted-foreground")}>
                        {roleHint}
                      </span>
                    </span>
                  </GuardedDirectoryLink>
                );
              })}
            </nav>
          )}
        </aside>

        <section
          key={createMode ? "create" : selectedRole?.id ?? "empty"}
          id="rbac-detail"
          className="min-w-0 scroll-mt-20 rounded-xl bg-card p-5 shadow-card sm:p-6"
        >
          {createMode ? (
            <>
              <div className="mb-6 flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/12 text-primary">
                  <Shield aria-hidden="true" className="size-4" />
                </span>
                <div>
                  <h2 className="font-semibold">新增岗位角色</h2>
                  <p className="text-sm text-muted-foreground">填写角色名称并在下方勾选该角色可访问的菜单与可执行的操作。</p>
                </div>
              </div>
              <GuardedEditForm action={createRoleAction} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="role-name">角色名称</Label>
                    <Input id="role-name" name="name" placeholder="例如：运营主管、财务专员" required maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role-description">职责说明（可选）</Label>
                    <Input id="role-description" name="description" placeholder="例如：负责日常内容审核与报表查看" maxLength={200} />
                  </div>
                </div>

                <MenuGrantTree nodes={treeNodes} grantedIds={[]} editableIds={editableMenuIds} />

                <details className="rounded-lg border border-border/70 bg-muted/25 px-4 py-2.5 text-xs">
                  <summary className="cursor-pointer font-medium text-muted-foreground select-none hover:text-foreground">
                    开发者高级选项（可选：自定义角色编码，留空将自动生成）
                  </summary>
                  <div className="mt-3 max-w-sm space-y-1.5 pb-1">
                    <Label htmlFor="role-key" className="text-xs">角色编码（仅在代码需硬编码引用该角色时填写）</Label>
                    <Input
                      id="role-key"
                      name="key"
                      placeholder="留空自动生成，如填写请用英文如 finance"
                      pattern="[a-z][a-z0-9_-]{1,63}"
                      className="h-9 font-mono text-xs"
                    />
                  </div>
                </details>

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
              <p className="mt-2 text-sm text-muted-foreground">从左侧列表选择要查看或配置权限的角色。</p>
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
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="break-words text-xl font-semibold tracking-[-0.012em]">
              {role.name}
            </h2>
            <Badge variant={role.isSystem ? "default" : "secondary"}>
              {role.isSystem ? "系统内置" : "自定义角色"}
            </Badge>
            {role.isDefault ? <Badge variant="success">默认角色</Badge> : null}
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {isAdmin
              ? "系统超级管理员自动拥有所有菜单与操作权限，无需逐项勾选。"
              : role.description || "勾选下方矩阵以控制该角色成员能看到的侧栏页面与页面内按钮。"}
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
              删除角色
            </ConfirmSubmitButton>
          </form>
        ) : null}
      </div>

      {canEdit ? (
        <GuardedEditForm action={updateRoleAction} className="space-y-6">
          <input type="hidden" name="id" value={role.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`role-name-${role.id}`}>角色名称</Label>
              <Input id={`role-name-${role.id}`} name="name" defaultValue={role.name} required maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`role-description-${role.id}`}>职责说明</Label>
              <Input id={`role-description-${role.id}`} name="description" defaultValue={role.description ?? ""} placeholder="可选角色职责备注" maxLength={200} />
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
            <SubmitButton pendingLabel="保存中…">保存角色权限</SubmitButton>
          </div>
        </GuardedEditForm>
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium">职责说明</h3>
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
