import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusNotice } from "@/components/ui/status-notice";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { changeOwnPasswordAction, revokeOwnSessionAction } from "@/features/users/actions";
import { profileNoticeMessages } from "@/features/users/messages";
import { listSessionsForUser } from "@/lib/auth/user-management";
import { requireSession } from "@/lib/auth/session";
import { listRolesForRoleValue } from "@/lib/rbac/permissions";
import { formatDateTime } from "@/lib/utils";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const session = await requireSession();
  const { notice } = await searchParams;
  const [sessions, roleRows] = await Promise.all([
    listSessionsForUser(session.user.id),
    listRolesForRoleValue(session.user.role ?? ""),
  ]);

  return (
    <div className="space-y-7">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">账号</p>
        <h1 className="text-3xl font-semibold tracking-[-0.022em]">个人中心</h1>
        <p className="mt-2 text-sm text-muted-foreground">修改密码，并管理当前账号的登录会话。</p>
      </div>

      <StatusNotice notice={notice} messages={profileNoticeMessages} />

      <section
        aria-labelledby="profile-info-title"
        className="rounded-xl bg-card p-5 shadow-[0_1px_2px_rgba(62,47,35,0.06),0_10px_28px_rgba(62,47,35,0.09)] sm:p-6"
      >
        <h2 id="profile-info-title" className="font-semibold">
          基本信息
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">姓名</dt>
            <dd className="mt-1 font-medium">{session.user.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">邮箱</dt>
            <dd className="mt-1 font-medium">{session.user.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">角色</dt>
            <dd className="mt-1 font-medium">
              {roleRows.map((item) => item.name).join("、") || session.user.role}
            </dd>
          </div>
        </dl>
      </section>

      <section
        aria-labelledby="change-password-title"
        className="rounded-xl bg-card p-5 shadow-[0_1px_2px_rgba(62,47,35,0.06),0_10px_28px_rgba(62,47,35,0.09)] sm:p-6"
      >
        <h2 id="change-password-title" className="font-semibold">
          修改密码
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">新密码至少 12 位，并同时包含字母和数字。</p>
        <form action={changeOwnPasswordAction} className="mt-5 grid max-w-xl gap-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">当前密码</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nextPassword">新密码</Label>
            <Input
              id="nextPassword"
              name="nextPassword"
              type="password"
              autoComplete="new-password"
              minLength={12}
              pattern="(?=.*[A-Za-z])(?=.*\d).{12,}"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">确认新密码</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={12}
              pattern="(?=.*[A-Za-z])(?=.*\d).{12,}"
              required
            />
          </div>
          <div>
            <SubmitButton pendingLabel="保存中…">更新密码</SubmitButton>
          </div>
        </form>
      </section>

      <section
        aria-labelledby="sessions-title"
        className="overflow-hidden rounded-xl bg-card shadow-[0_1px_2px_rgba(62,47,35,0.06),0_10px_28px_rgba(62,47,35,0.09)]"
      >
        <div className="border-b border-border/70 px-5 py-4">
          <h2 id="sessions-title" className="font-semibold">
            登录会话
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            共 <span className="tabular-nums">{sessions.length}</span> 个未过期会话。当前会话不可在此撤销，请使用退出登录。
          </p>
        </div>

        {sessions.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">没有活跃会话。</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>最近活动</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>设备</TableHead>
                <TableHead>过期时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((item) => {
                const isCurrent = item.id === session.session.id;
                return (
                  <TableRow key={item.id}>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {formatDateTime(item.updatedAt)}
                      {isCurrent ? (
                        <span className="ml-2 inline-flex rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          当前
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="tabular-nums text-sm">{item.ipAddress ?? "—"}</TableCell>
                    <TableCell className="max-w-56 truncate text-xs text-muted-foreground" title={item.userAgent ?? undefined}>
                      {item.userAgent ?? "—"}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {formatDateTime(item.expiresAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {isCurrent ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <form action={revokeOwnSessionAction}>
                          <input type="hidden" name="sessionId" value={item.id} />
                          <ConfirmSubmitButton
                            variant="outline"
                            size="sm"
                            confirmMessage="确认撤销该会话？对应设备将需要重新登录。"
                            confirmLabel="确认撤销"
                            pendingLabel="撤销中…"
                          >
                            撤销
                          </ConfirmSubmitButton>
                        </form>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
