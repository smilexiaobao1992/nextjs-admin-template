import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ListedUser } from "@/features/users/queries";
import type { Role } from "@/lib/db/schema";
import { parseRoleKeys } from "@/lib/rbac/role-keys";
import { formatDate } from "@/lib/utils";
import { UserManagementDialog } from "./user-management-dialog";

export function UserList({
  users,
  roles,
  assignableRoles: allowedRoles,
  canWrite,
  canManageSystemRoles = false,
  manageableUserIds,
  currentUserId,
  total,
}: {
  users: ListedUser[];
  roles: Role[];
  assignableRoles?: Role[];
  canWrite: boolean;
  canManageSystemRoles?: boolean;
  manageableUserIds?: Set<string>;
  currentUserId?: string;
  total: number;
}) {
  const roleNameByKey = Object.fromEntries(roles.map((item) => [item.key, item.name]));
  const systemRoleKeys = new Set(roles.filter((item) => item.isSystem).map((item) => item.key));
  const assignableRoles = allowedRoles ?? (canManageSystemRoles ? roles : roles.filter((item) => !item.isSystem));

  return (
    <section
      aria-labelledby="user-list-title"
      className="overflow-hidden rounded-xl bg-card shadow-[0_1px_2px_rgba(62,47,35,0.06),0_10px_28px_rgba(62,47,35,0.09)]"
    >
      <div className="border-b border-border/70 px-5 py-4">
        <h2 id="user-list-title" className="font-semibold">账号列表</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          共 <span className="tabular-nums">{total}</span> 个账号
        </p>
      </div>

      {users.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="font-medium">没有匹配的账号</p>
          <p className="mt-2 text-sm text-muted-foreground">
            调整搜索条件，或点击上方“创建用户”添加账号。若没有操作权限，请联系系统管理员。
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((item) => {
              const isSelf = currentUserId === item.id;
              const itemRoleKeys = parseRoleKeys(item.role);
              const targetIsManageable = manageableUserIds
                ? manageableUserIds.has(item.id)
                : canManageSystemRoles || !itemRoleKeys.some((key) => systemRoleKeys.has(key));
              const canMutate =
                canWrite && targetIsManageable && !isSelf;

              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="font-medium">{item.name}</p>
                    <p className="max-w-72 truncate text-xs text-muted-foreground">{item.email}</p>
                    {isSelf ? <p className="mt-1 text-xs text-muted-foreground">当前登录账号</p> : null}
                  </TableCell>
                  <TableCell>
                    <span>{itemRoleKeys.map((key) => roleNameByKey[key] ?? key).join("、")}</span>
                  </TableCell>
                  <TableCell>
                    {item.banned ? (
                      <span className="inline-flex rounded-md bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                        已封禁
                      </span>
                    ) : (
                      <span className="inline-flex rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        正常
                      </span>
                    )}
                    {item.banned && item.banReason ? (
                      <p className="mt-1 max-w-40 truncate text-xs text-muted-foreground" title={item.banReason}>
                        {item.banReason}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {formatDate(item.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {canMutate ? (
                      <UserManagementDialog
                        user={{
                          id: item.id,
                          name: item.name,
                          email: item.email,
                          role: item.role,
                          banned: item.banned,
                          banReason: item.banReason,
                        }}
                        roles={assignableRoles.map((role) => ({
                          id: role.id,
                          key: role.key,
                          name: role.name,
                        }))}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">{isSelf ? "当前账号" : "只读"}</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
