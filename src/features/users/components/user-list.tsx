import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { setUserRoleAction } from "@/features/users/actions";
import type { ListedUser } from "@/features/users/queries";
import type { Role } from "@/lib/db/schema";

export function UserList({
  users,
  roles,
  assignableRoles: allowedRoles,
  canWrite,
  canManageSystemRoles = false,
}: {
  users: ListedUser[];
  roles: Role[];
  assignableRoles?: Role[];
  canWrite: boolean;
  canManageSystemRoles?: boolean;
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
        <p className="mt-1 text-sm text-muted-foreground">共 {users.length} 个账号</p>
      </div>

      {users.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="font-medium">还没有账号</p>
          <p className="mt-2 text-sm text-muted-foreground">点击上方“创建用户”添加账号。若没有操作权限，请联系系统管理员。</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <p className="font-medium">{item.name}</p>
                  <p className="max-w-72 truncate text-xs text-muted-foreground">{item.email}</p>
                </TableCell>
                <TableCell>{roleNameByKey[item.role] ?? item.role}</TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  {item.createdAt.toLocaleDateString("zh-CN")}
                </TableCell>
                <TableCell className="text-right">
                  {canWrite && (canManageSystemRoles || !systemRoleKeys.has(item.role)) ? (
                    <form action={setUserRoleAction} className="flex justify-end gap-2">
                      <input type="hidden" name="userId" value={item.id} />
                      <Select
                        name="role"
                        defaultValue={item.role}
                        aria-label={`调整 ${item.email} 的角色`}
                        className="w-auto min-w-28"
                      >
                        {assignableRoles.map((role) => (
                          <option key={role.id} value={role.key}>
                            {role.name}
                          </option>
                        ))}
                      </Select>
                      <SubmitButton variant="outline" pendingLabel="保存中…">
                        保存
                      </SubmitButton>
                    </form>
                  ) : (
                    <span className="text-xs text-muted-foreground">只读</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
