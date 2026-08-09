import { ListPagination } from "@/components/ui/list-pagination";
import { ListSearchForm } from "@/components/ui/list-search-form";
import { StatusNotice } from "@/components/ui/status-notice";
import { CreateUserForm } from "@/features/users/components/create-user-form";
import { UserList } from "@/features/users/components/user-list";
import { userNoticeMessages } from "@/features/users/messages";
import { listUsersPage } from "@/features/users/queries";
import { requirePermission } from "@/lib/auth/session";
import { canManageRolePermissionSets } from "@/lib/auth/authorization";
import { parseListQuery } from "@/lib/list/pagination";
import {
  isSystemAdminRole,
  listAllRoles,
  listPermissionIdsByRole,
  roleHasPermission,
} from "@/lib/rbac/permissions";
import { parseRoleKeys } from "@/lib/rbac/role-keys";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; page?: string; q?: string; pageSize?: string }>;
}) {
  const session = await requirePermission("users:read");
  const params = await searchParams;
  const listQuery = parseListQuery(params);
  const [usersPage, roles, permissionIdsByRole] = await Promise.all([
    listUsersPage(listQuery),
    listAllRoles(),
    listPermissionIdsByRole(),
  ]);
  const roleKey = session.user.role ?? "";
  const canWrite = await roleHasPermission(roleKey, "users:write");
  const canManageSystemRoles = isSystemAdminRole(roleKey);
  const actorRoleKeys = new Set(parseRoleKeys(roleKey));
  const actorPermissionIds = roles
    .filter((item) => actorRoleKeys.has(item.key))
    .flatMap((item) => permissionIdsByRole[item.id] ?? []);
  const assignableRoles = canManageSystemRoles
    ? roles
    : roles.filter((item) =>
        !item.isSystem && canManageRolePermissionSets({
          actorPermissionIds,
          nextPermissionIds: permissionIdsByRole[item.id] ?? [],
        }),
      );
  const manageableUserIds = new Set(
    usersPage.items
      .filter((item) => {
        if (canManageSystemRoles) {
          return true;
        }

        const targetRoleKeys = new Set(parseRoleKeys(item.role));
        const targetRoles = roles.filter((role) => targetRoleKeys.has(role.key));
        if (targetRoles.length !== targetRoleKeys.size || targetRoles.some((role) => role.isSystem)) {
          return false;
        }

        const targetPermissionIds = targetRoles.flatMap(
          (role) => permissionIdsByRole[role.id] ?? [],
        );
        return canManageRolePermissionSets({
          actorPermissionIds,
          currentPermissionIds: targetPermissionIds,
          nextPermissionIds: targetPermissionIds,
        });
      })
      .map((item) => item.id),
  );

  return (
    <div className="space-y-7">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">用户</p>
        <h1 className="text-3xl font-semibold tracking-[-0.022em]">用户管理</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          查看系统账号，创建用户、调整角色、封禁账号、重置密码并管理会话。
        </p>
      </div>

      <StatusNotice notice={params.notice} messages={userNoticeMessages} />

      {canWrite ? <CreateUserForm roles={assignableRoles} /> : null}

      <div className="rounded-xl bg-card p-5 shadow-[0_1px_2px_rgba(62,47,35,0.06),0_10px_28px_rgba(62,47,35,0.09)]">
        <ListSearchForm
          action="/app/users"
          defaultQuery={usersPage.q}
          placeholder="按姓名、邮箱或角色搜索"
          label="搜索用户"
        />
      </div>

      <div className="space-y-0 overflow-hidden rounded-xl">
        <UserList
          users={usersPage.items}
          roles={roles}
          assignableRoles={assignableRoles}
          canWrite={canWrite}
          canManageSystemRoles={canManageSystemRoles}
          manageableUserIds={manageableUserIds}
          currentUserId={session.user.id}
          total={usersPage.total}
        />
        <div className="rounded-b-xl bg-card shadow-[0_1px_2px_rgba(62,47,35,0.06),0_10px_28px_rgba(62,47,35,0.09)]">
          <ListPagination
            pathname="/app/users"
            page={usersPage.page}
            pageSize={usersPage.pageSize}
            total={usersPage.total}
            q={usersPage.q}
          />
        </div>
      </div>
    </div>
  );
}
