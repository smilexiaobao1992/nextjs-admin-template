import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { Input } from "@/components/ui/input";
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
import {
  resetUserPasswordAction,
  revokeUserSessionsAction,
  setUserBannedAction,
  setUserRoleAction,
} from "@/features/users/actions";
import type { ListedUser } from "@/features/users/queries";
import type { Role } from "@/lib/db/schema";

export function UserList({
  users,
  roles,
  assignableRoles: allowedRoles,
  canWrite,
  canManageSystemRoles = false,
  currentUserId,
  total,
}: {
  users: ListedUser[];
  roles: Role[];
  assignableRoles?: Role[];
  canWrite: boolean;
  canManageSystemRoles?: boolean;
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
              const canMutate =
                canWrite && (canManageSystemRoles || !systemRoleKeys.has(item.role)) && !isSelf;

              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="font-medium">{item.name}</p>
                    <p className="max-w-72 truncate text-xs text-muted-foreground">{item.email}</p>
                    {isSelf ? <p className="mt-1 text-xs text-muted-foreground">当前登录账号</p> : null}
                  </TableCell>
                  <TableCell>
                    {canMutate ? (
                      <form action={setUserRoleAction} className="flex flex-wrap items-center gap-2">
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
                        <SubmitButton variant="outline" size="sm" pendingLabel="保存中…">
                          保存角色
                        </SubmitButton>
                      </form>
                    ) : (
                      <span>{roleNameByKey[item.role] ?? item.role}</span>
                    )}
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
                    {item.createdAt.toLocaleDateString("zh-CN")}
                  </TableCell>
                  <TableCell className="text-right">
                    {canMutate ? (
                      <div className="flex flex-col items-end gap-2">
                        <form action={setUserBannedAction} className="flex flex-wrap items-center justify-end gap-2">
                          <input type="hidden" name="userId" value={item.id} />
                          <input type="hidden" name="banned" value={item.banned ? "false" : "true"} />
                          {!item.banned ? (
                            <Input
                              name="banReason"
                              placeholder="封禁原因（可选）"
                              maxLength={200}
                              className="h-9 w-36 text-xs"
                              aria-label={`封禁 ${item.email} 的原因`}
                            />
                          ) : null}
                          <ConfirmSubmitButton
                            variant={item.banned ? "outline" : "destructive"}
                            size="sm"
                            confirmMessage={
                              item.banned
                                ? `确认解封 ${item.email}？`
                                : `确认封禁 ${item.email}？封禁后其全部会话将立即失效。`
                            }
                            confirmLabel={item.banned ? "确认解封" : "确认封禁"}
                            pendingLabel="处理中…"
                          >
                            {item.banned ? "解封" : "封禁"}
                          </ConfirmSubmitButton>
                        </form>

                        <form action={resetUserPasswordAction} className="flex flex-wrap items-center justify-end gap-2">
                          <input type="hidden" name="userId" value={item.id} />
                          <Input
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            placeholder="新密码"
                            minLength={12}
                            pattern="(?=.*[A-Za-z])(?=.*\d).{12,}"
                            required
                            className="h-9 w-36 text-xs"
                            aria-label={`重置 ${item.email} 的密码`}
                          />
                          <ConfirmSubmitButton
                            variant="outline"
                            size="sm"
                            confirmMessage={`确认重置 ${item.email} 的密码？对方需使用新密码重新登录。`}
                            confirmLabel="确认重置"
                            pendingLabel="重置中…"
                          >
                            重置密码
                          </ConfirmSubmitButton>
                        </form>

                        <form action={revokeUserSessionsAction}>
                          <input type="hidden" name="userId" value={item.id} />
                          <ConfirmSubmitButton
                            variant="ghost"
                            size="sm"
                            confirmMessage={`确认撤销 ${item.email} 的全部登录会话？`}
                            confirmLabel="确认撤销"
                            pendingLabel="撤销中…"
                          >
                            撤销会话
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">只读</span>
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
