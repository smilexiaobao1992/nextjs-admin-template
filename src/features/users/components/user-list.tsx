"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  SortableTableHead,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { batchSetUsersBannedAction } from "@/features/users/actions";
import type { ListedUser } from "@/features/users/queries";
import type { Role } from "@/lib/db/schema";
import type { SortOrder } from "@/lib/list/pagination";
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
  q = "",
  pageSize,
  sort,
  order,
}: {
  users: ListedUser[];
  roles: Role[];
  assignableRoles?: Role[];
  canWrite: boolean;
  canManageSystemRoles?: boolean;
  manageableUserIds?: ReadonlySet<string> | readonly string[];
  currentUserId?: string;
  total: number;
  q?: string;
  pageSize?: number;
  sort?: string;
  order?: SortOrder;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const roleNameByKey = Object.fromEntries(roles.map((item) => [item.key, item.name]));
  const systemRoleKeys = new Set(roles.filter((item) => item.isSystem).map((item) => item.key));
  const assignableRoles =
    allowedRoles ?? (canManageSystemRoles ? roles : roles.filter((item) => !item.isSystem));
  const manageableSet = manageableUserIds ? new Set(manageableUserIds) : null;

  function canMutateRow(item: ListedUser): boolean {
    const isSelf = currentUserId === item.id;
    const itemRoleKeys = parseRoleKeys(item.role);
    const targetIsManageable = manageableSet
      ? manageableSet.has(item.id)
      : canManageSystemRoles || !itemRoleKeys.some((key) => systemRoleKeys.has(key));
    return canWrite && targetIsManageable && !isSelf;
  }

  const selectableIds = users.filter(canMutateRow).map((item) => item.id);
  const validSelectedIds = selectedIds.filter((id) => selectableIds.includes(id));
  const allSelected =
    selectableIds.length > 0 && validSelectedIds.length === selectableIds.length;

  function toggleRow(userId: string, checked: boolean) {
    setSelectedIds((prev) =>
      checked ? Array.from(new Set([...prev, userId])) : prev.filter((id) => id !== userId),
    );
  }

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? selectableIds : []);
  }

  return (
    <Card
      aria-labelledby="user-list-title"
      className="overflow-hidden rounded-b-none"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
        <div>
          <h2 id="user-list-title" className="font-semibold">账号列表</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            共 <span className="tabular-nums">{total}</span> 个账号
          </p>
        </div>

        {canWrite && validSelectedIds.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/60 px-3 py-1.5">
            <span className="text-xs font-medium tabular-nums">
              已选 {validSelectedIds.length} 项
            </span>
            <form action={batchSetUsersBannedAction} className="inline-flex">
              {validSelectedIds.map((id) => (
                <input key={id} type="hidden" name="userIds" value={id} />
              ))}
              <input type="hidden" name="banned" value="true" />
              <ConfirmSubmitButton
                variant="destructive"
                size="sm"
                className="h-8 px-2.5 text-xs"
                confirmTitle="确认批量封禁"
                confirmMessage={`确认批量封禁已选的 ${validSelectedIds.length} 个账号？封禁后其全部登录会话将立即失效。`}
                confirmLabel="确认封禁"
                pendingLabel="封禁中…"
              >
                批量封禁
              </ConfirmSubmitButton>
            </form>
            <form action={batchSetUsersBannedAction} className="inline-flex">
              {validSelectedIds.map((id) => (
                <input key={id} type="hidden" name="userIds" value={id} />
              ))}
              <input type="hidden" name="banned" value="false" />
              <ConfirmSubmitButton
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs"
                confirmTitle="确认批量解封"
                confirmMessage={`确认批量解封已选的 ${validSelectedIds.length} 个账号？`}
                confirmLabel="确认解封"
                pendingLabel="解封中…"
              >
                批量解封
              </ConfirmSubmitButton>
            </form>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground"
              onClick={() => setSelectedIds([])}
            >
              取消
            </Button>
          </div>
        ) : null}
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="没有匹配的账号"
          description="调整搜索条件，或点击上方“创建用户”添加账号。若没有操作权限，请联系系统管理员。"
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {canWrite && selectableIds.length > 0 ? (
                <TableHead className="w-10">
                  <Checkbox
                    aria-label="全选当前页可管理账号"
                    checked={allSelected}
                    onChange={(event) => toggleAll(event.currentTarget.checked)}
                  />
                </TableHead>
              ) : null}
              <SortableTableHead
                column="name"
                currentSort={sort}
                currentOrder={order}
                pathname="/app/users"
                q={q}
                pageSize={pageSize}
              >
                用户
              </SortableTableHead>
              <SortableTableHead
                column="role"
                currentSort={sort}
                currentOrder={order}
                pathname="/app/users"
                q={q}
                pageSize={pageSize}
              >
                角色
              </SortableTableHead>
              <TableHead>状态</TableHead>
              <SortableTableHead
                column="createdAt"
                currentSort={sort}
                currentOrder={order}
                pathname="/app/users"
                q={q}
                pageSize={pageSize}
              >
                创建时间
              </SortableTableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((item) => {
              const isSelf = currentUserId === item.id;
              const itemRoleKeys = parseRoleKeys(item.role);
              const canMutate = canMutateRow(item);

              return (
                <TableRow
                  key={item.id}
                  data-state={validSelectedIds.includes(item.id) ? "selected" : undefined}
                >
                  {canWrite && selectableIds.length > 0 ? (
                    <TableCell className="w-10">
                      {canMutate ? (
                        <Checkbox
                          aria-label={`选择账号 ${item.email}`}
                          checked={validSelectedIds.includes(item.id)}
                          onChange={(event) => toggleRow(item.id, event.currentTarget.checked)}
                        />
                      ) : null}
                    </TableCell>
                  ) : null}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={item.name} size="sm" />
                      <div className="min-w-0">
                        <p className="font-medium">{item.name}</p>
                        <p className="max-w-72 truncate text-xs text-muted-foreground">{item.email}</p>
                        {isSelf ? (
                          <p className="mt-1 text-xs text-muted-foreground">当前登录账号</p>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span>{itemRoleKeys.map((key) => roleNameByKey[key] ?? key).join("、")}</span>
                  </TableCell>
                  <TableCell>
                    {item.banned ? (
                      <Badge variant="destructive">已封禁</Badge>
                    ) : (
                      <Badge variant="success">正常</Badge>
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
    </Card>
  );
}
