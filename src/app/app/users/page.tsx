import { PageHeader } from "@/components/layout/page-header";
import { ListPagination } from "@/components/ui/list-pagination";
import { ListSearchForm } from "@/components/ui/list-search-form";
import { StatusNotice } from "@/components/ui/status-notice";
import { CreateUserForm } from "@/features/users/components/create-user-form";
import { UserList } from "@/features/users/components/user-list";
import { userNoticeMessages } from "@/features/users/messages";
import { listUsersPage } from "@/features/users/queries";
import { can, requirePermission } from "@/lib/auth/session";
import { canManageRolePermissionSets } from "@/lib/auth/authorization";
import { parseListQuery } from "@/lib/list/pagination";
import {
  isSystemAdminRole,
  listAllRoles,
  listMenuIdsByRole,
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
  const [usersPage, roles, menuIdsByRole] = await Promise.all([
    listUsersPage(listQuery),
    listAllRoles(),
    listMenuIdsByRole(),
  ]);
  const roleKey = session.user.role ?? "";
  const canWrite = await can(session, "users:write");
  const canManageSystemRoles = isSystemAdminRole(roleKey);
  const actorRoleKeys = new Set(parseRoleKeys(roleKey));
  const actorPermissionIds = roles
    .filter((item) => actorRoleKeys.has(item.key))
    .flatMap((item) => menuIdsByRole[item.id] ?? []);
  const assignableRoles = canManageSystemRoles
    ? roles
    : roles.filter((item) =>
        !item.isSystem && canManageRolePermissionSets({
          actorPermissionIds,
          nextPermissionIds: menuIdsByRole[item.id] ?? [],
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
          (role) => menuIdsByRole[role.id] ?? [],
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
      <PageHeader
        eyebrow="用户"
        title="用户管理"
        description="查看系统账号，创建用户、调整角色、封禁账号、重置密码并管理会话。"
      />

      <StatusNotice notice={params.notice} messages={userNoticeMessages} />

      {canWrite ? <CreateUserForm roles={assignableRoles} /> : null}

      <div className="rounded-xl bg-card p-5 shadow-card">
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
        <div className="rounded-b-xl bg-card shadow-card">
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
