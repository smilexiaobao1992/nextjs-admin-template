import { CreateUserForm } from "@/features/users/components/create-user-form";
import { UserList } from "@/features/users/components/user-list";
import { userNoticeMessages } from "@/features/users/messages";
import { listUsers } from "@/features/users/queries";
import { requirePermission } from "@/lib/auth/session";
import { canManageRolePermissionSets } from "@/lib/auth/authorization";
import {
  isSystemAdminRole,
  listAllRoles,
  listPermissionIdsByRole,
  roleHasPermission,
} from "@/lib/rbac/permissions";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const session = await requirePermission("users:read");
  const { notice } = await searchParams;
  const [users, roles, permissionIdsByRole] = await Promise.all([
    listUsers(),
    listAllRoles(),
    listPermissionIdsByRole(),
  ]);
  const roleKey = session.user.role ?? "";
  const canWrite = await roleHasPermission(roleKey, "users:write");
  const canManageSystemRoles = isSystemAdminRole(roleKey);
  const actorRole = roles.find((item) => item.key === roleKey);
  const actorPermissionIds = actorRole ? permissionIdsByRole[actorRole.id] ?? [] : [];
  const assignableRoles = canManageSystemRoles
    ? roles
    : roles.filter((item) =>
        !item.isSystem && canManageRolePermissionSets({
          actorPermissionIds,
          nextPermissionIds: permissionIdsByRole[item.id] ?? [],
        }),
      );

  return (
    <div className="space-y-8">
      <div>
        <p className="mb-2 text-sm font-medium text-primary">用户</p>
        <h1 className="text-3xl font-semibold tracking-[-0.022em]">用户管理</h1>
        <p className="mt-2 text-sm text-muted-foreground">创建凭据账号，并分配动态角色。</p>
      </div>

      {notice && userNoticeMessages[notice] ? (
        <p role="status" className="rounded-lg border bg-card px-4 py-3 text-sm shadow-sm">
          {userNoticeMessages[notice]}
        </p>
      ) : null}

      {canWrite ? <CreateUserForm roles={assignableRoles} /> : null}
      <UserList
        users={users}
        roles={roles}
        assignableRoles={assignableRoles}
        canWrite={canWrite}
        canManageSystemRoles={canManageSystemRoles}
      />
    </div>
  );
}
