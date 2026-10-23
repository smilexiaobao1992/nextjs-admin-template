import { FileClock, Laptop, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { EmptyState } from "@/components/ui/empty-state";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuditDetailSheet } from "@/features/audit/components/audit-detail-sheet";
import {
  changeOwnPasswordAction,
  revokeOwnSessionAction,
  updateOwnProfileAction,
} from "@/features/users/actions";
import { profileNoticeMessages } from "@/features/users/messages";
import { listAuditLogsByActor } from "@/lib/audit/queries";
import { listSessionsForUser } from "@/lib/auth/user-management";
import { requireSession } from "@/lib/auth/session";
import { listRolesForRoleValue } from "@/lib/rbac/permissions";
import { formatDateTime, formatUserAgent } from "@/lib/utils";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const session = await requireSession();
  const { notice } = await searchParams;
  const [sessions, roleRows, myAuditLogs] = await Promise.all([
    listSessionsForUser(session.user.id),
    listRolesForRoleValue(session.user.role ?? ""),
    listAuditLogsByActor(session.user.id, 15),
  ]);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="账号"
        title="个人中心"
        description="维护个人显示资料、修改登录密码、管理在线设备会话并查看本人最近操作记录。"
      />

      <StatusNotice notice={notice} messages={profileNoticeMessages} />

      <Card aria-labelledby="profile-info-title" className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={session.user.name || session.user.email} size="lg" />
            <div className="min-w-0">
              <h2 id="profile-info-title" className="truncate text-lg font-semibold">
                {session.user.name}
              </h2>
              <p className="truncate text-sm text-muted-foreground">{session.user.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {roleRows.length > 0 ? (
              roleRows.map((item) => (
                <Badge key={item.id} variant="secondary" className="gap-1">
                  <ShieldCheck aria-hidden="true" className="size-3.5 text-primary" />
                  {item.name}
                </Badge>
              ))
            ) : (
              <Badge variant="secondary">{session.user.role}</Badge>
            )}
          </div>
        </div>
      </Card>

      <Tabs defaultValue="account" className="space-y-5">
        <TabsList>
          <TabsTrigger value="account">资料与密码</TabsTrigger>
          <TabsTrigger value="sessions">
            登录设备会话 ({sessions.length})
          </TabsTrigger>
          <TabsTrigger value="activity">
            我的操作记录 ({myAuditLogs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="grid gap-5 lg:grid-cols-2">
          <Card aria-labelledby="edit-profile-title" className="p-5 sm:p-6">
            <h2 id="edit-profile-title" className="font-semibold">
              个人资料
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              修改在管理后台顶栏、用户列表和审计记录中展示的姓名。
            </p>
            <form action={updateOwnProfileAction} className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">显示姓名</Label>
                <Input
                  id="profile-name"
                  name="name"
                  defaultValue={session.user.name}
                  autoComplete="name"
                  maxLength={100}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email">登录邮箱（只读）</Label>
                <Input
                  id="profile-email"
                  value={session.user.email}
                  disabled
                  readOnly
                />
              </div>
              <div>
                <SubmitButton variant="outline" pendingLabel="保存中…">
                  保存个人资料
                </SubmitButton>
              </div>
            </form>
          </Card>

          <Card aria-labelledby="change-password-title" className="p-5 sm:p-6">
            <h2 id="change-password-title" className="font-semibold">
              修改密码
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              新密码至少 12 位并同时包含字母和数字。修改成功后其他设备将自动退出。
            </p>
            <form action={changeOwnPasswordAction} className="mt-5 space-y-4">
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
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card aria-labelledby="sessions-title" className="overflow-hidden">
            <div className="border-b border-border/70 px-5 py-4">
              <h2 id="sessions-title" className="font-semibold">
                登录会话
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                共 <span className="tabular-nums">{sessions.length}</span> 个未过期会话。当前会话不可在此撤销，请使用右上角退出登录。
              </p>
            </div>

            {sessions.length === 0 ? (
              <EmptyState icon={Laptop} title="没有活跃会话" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>最近活动</TableHead>
                    <TableHead>设备与浏览器</TableHead>
                    <TableHead>IP</TableHead>
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
                          <div className="flex flex-wrap items-center gap-2">
                            <span>{formatDateTime(item.updatedAt)}</span>
                            {isCurrent ? <Badge variant="success">当前设备</Badge> : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium">{formatUserAgent(item.userAgent)}</p>
                            {item.userAgent ? (
                              <p
                                className="max-w-64 truncate text-xs text-muted-foreground"
                                title={item.userAgent}
                              >
                                {item.userAgent}
                              </p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="tabular-nums text-sm">{item.ipAddress ?? "—"}</TableCell>
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
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card aria-labelledby="my-activity-title" className="overflow-hidden">
            <div className="border-b border-border/70 px-5 py-4">
              <h2 id="my-activity-title" className="font-semibold">
                我的最近操作记录
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                展示当前账号最近 15 条关键写操作审计记录。
              </p>
            </div>

            {myAuditLogs.length === 0 ? (
              <EmptyState
                icon={FileClock}
                title="暂无操作记录"
                description="您执行的个人资料修改、用户管理或权限变更会记录在此。"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>时间</TableHead>
                    <TableHead>动作</TableHead>
                    <TableHead>摘要</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead className="text-right">详情</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myAuditLogs.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                        {formatDateTime(item.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono">
                          {item.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{item.summary}</TableCell>
                      <TableCell className="tabular-nums text-xs text-muted-foreground">
                        {item.ipAddress ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <AuditDetailSheet item={item} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
