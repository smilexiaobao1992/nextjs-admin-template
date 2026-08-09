"use client";

import { useState } from "react";
import { KeyRound, LogOut, ShieldCheck, UserRoundCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  resetUserPasswordAction,
  revokeUserSessionsAction,
  setUserBannedAction,
  setUserRolesAction,
} from "@/features/users/actions";

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
  banReason: string | null;
};

type RoleOption = {
  id: string;
  key: string;
  name: string;
};

const sectionClassName = "space-y-4 border-b border-border/70 pb-6 last:border-b-0 last:pb-0";

export function UserManagementDialog({
  user,
  roles,
}: {
  user: ManagedUser;
  roles: RoleOption[];
}) {
  const [selectedRoles, setSelectedRoles] = useState(() =>
    user.role.split(",").map((role) => role.trim()).filter(Boolean),
  );

  function toggleRole(roleKey: string, checked: boolean) {
    setSelectedRoles((current) => checked
      ? Array.from(new Set([...current, roleKey]))
      : current.filter((key) => key !== roleKey));
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={`管理 ${user.email}`}
        >
          <UserRoundCog aria-hidden="true" />
          管理
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[calc(100vh-2rem)] max-w-2xl gap-0 overflow-y-auto p-0">
        <DialogHeader className="border-b border-border/70 bg-muted/35 px-6 py-5 pr-12 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle>{user.name}</DialogTitle>
            <span
              className={user.banned
                ? "inline-flex rounded-md bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive"
                : "inline-flex rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary"}
            >
              {user.banned ? "已封禁" : "正常"}
            </span>
          </div>
          <DialogDescription className="pt-1">{user.email}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-6 py-6">
          <section className={sectionClassName} aria-labelledby={`role-title-${user.id}`}>
            <div className="flex gap-3">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <h3 id={`role-title-${user.id}`} className="font-medium">角色权限</h3>
                <p className="mt-1 text-sm text-muted-foreground">调整该账号在管理后台中的访问范围。</p>
              </div>
            </div>
            <form action={setUserRolesAction} className="space-y-4">
              <input type="hidden" name="userId" value={user.id} />
              <fieldset>
                <legend className="text-sm font-medium">角色（可同时选择多个）</legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {roles.map((role) => (
                    <label
                      key={role.id}
                      className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border/80 px-3 py-2.5 text-sm transition-colors hover:bg-accent/45 has-checked:border-primary has-checked:bg-primary/8 has-checked:text-primary"
                    >
                      <input
                        type="checkbox"
                        name="roles"
                        value={role.key}
                        checked={selectedRoles.includes(role.key)}
                        onChange={(event) => toggleRole(role.key, event.currentTarget.checked)}
                        className="size-4 shrink-0"
                      />
                      <span>{role.name}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground">已选择 {selectedRoles.length} 个角色</p>
                <SubmitButton disabled={selectedRoles.length === 0} variant="outline" pendingLabel="保存中…">
                  保存多个角色
                </SubmitButton>
              </div>
            </form>
          </section>

          <section className={sectionClassName} aria-labelledby={`status-title-${user.id}`}>
            <div>
              <h3 id={`status-title-${user.id}`} className="font-medium">账号状态</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {user.banned ? "解封后该账号可以重新登录。" : "封禁会立即撤销该账号的全部登录会话。"}
              </p>
            </div>
            <form action={setUserBannedAction} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <input type="hidden" name="userId" value={user.id} />
              <input type="hidden" name="banned" value={user.banned ? "false" : "true"} />
              {user.banned ? (
                <div className="rounded-lg bg-muted/55 px-3 py-2.5 text-sm">
                  <span className="text-muted-foreground">封禁原因：</span>
                  {user.banReason || "未填写"}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor={`ban-reason-${user.id}`}>封禁原因</Label>
                  <Input
                    id={`ban-reason-${user.id}`}
                    name="banReason"
                    placeholder="可选，最多 200 字"
                    maxLength={200}
                  />
                </div>
              )}
              <ConfirmSubmitButton
                variant={user.banned ? "outline" : "destructive"}
                confirmTitle={user.banned ? "确认解封账号" : "确认封禁账号"}
                confirmMessage={
                  user.banned
                    ? `确认解封 ${user.email}？`
                    : `确认封禁 ${user.email}？封禁后其全部会话将立即失效。`
                }
                confirmLabel={user.banned ? "确认解封" : "确认封禁"}
                pendingLabel="处理中…"
              >
                {user.banned ? "解封账号" : "封禁账号"}
              </ConfirmSubmitButton>
            </form>
          </section>

          <section className="space-y-5" aria-labelledby={`security-title-${user.id}`}>
            <div className="flex gap-3">
              <KeyRound aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <h3 id={`security-title-${user.id}`} className="font-medium">安全操作</h3>
                <p className="mt-1 text-sm text-muted-foreground">重置密码或强制退出该账号的全部设备。</p>
              </div>
            </div>

            <form action={resetUserPasswordAction} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <input type="hidden" name="userId" value={user.id} />
              <div className="space-y-2">
                <Label htmlFor={`password-${user.id}`}>新密码</Label>
                <Input
                  id={`password-${user.id}`}
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="至少 12 位，包含字母和数字"
                  minLength={12}
                  pattern="(?=.*[A-Za-z])(?=.*\d).{12,}"
                  required
                />
              </div>
              <ConfirmSubmitButton
                variant="outline"
                confirmTitle="确认重置密码"
                confirmMessage={`确认重置 ${user.email} 的密码？对方需使用新密码重新登录。`}
                confirmLabel="确认重置"
                pendingLabel="重置中…"
              >
                重置密码
              </ConfirmSubmitButton>
            </form>

            <form action={revokeUserSessionsAction} className="flex flex-col gap-3 rounded-lg bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
              <input type="hidden" name="userId" value={user.id} />
              <div>
                <p className="text-sm font-medium">撤销全部会话</p>
                <p className="mt-1 text-xs text-muted-foreground">该账号需要在所有设备上重新登录。</p>
              </div>
              <ConfirmSubmitButton
                variant="ghost"
                size="sm"
                confirmTitle="确认撤销全部会话"
                confirmMessage={`确认撤销 ${user.email} 的全部登录会话？`}
                confirmLabel="确认撤销"
                pendingLabel="撤销中…"
              >
                <LogOut aria-hidden="true" />
                撤销会话
              </ConfirmSubmitButton>
            </form>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
