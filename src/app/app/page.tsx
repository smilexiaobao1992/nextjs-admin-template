import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  FileClock,
  ListTree,
  Shield,
  ShieldCheck,
  UserRoundCog,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import {
  getDashboardStats,
  getRecentAuditDailySeries,
} from "@/features/dashboard/queries";
import { listRecentUsers } from "@/features/users/queries";
import { can, requirePermission } from "@/lib/auth/session";
import { listAllRoles } from "@/lib/rbac/permissions";
import { parseRoleKeys } from "@/lib/rbac/role-keys";
import { formatDate } from "@/lib/utils";

export default async function AppPage() {
  const session = await requirePermission("dashboard:view");
  const [canReadUsers, canReadRoles, canReadMenus, canReadAudit] = await Promise.all([
    can(session, "users:read"),
    can(session, "roles:read"),
    can(session, "menus:read"),
    can(session, "audit:read"),
  ]);

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 7);
  const [summary, recentUsers, roles, auditSeries] = await Promise.all([
    getDashboardStats({
      includeUsers: canReadUsers,
      includeRoles: canReadRoles,
      includeAudit: canReadAudit,
      auditSince: since,
    }),
    canReadUsers ? listRecentUsers(5) : Promise.resolve([]),
    canReadUsers ? listAllRoles() : Promise.resolve([]),
    canReadAudit ? getRecentAuditDailySeries(7) : Promise.resolve([]),
  ]);

  const roleNameByKey = Object.fromEntries(roles.map((item) => [item.key, item.name]));

  const stats = [
    ...(canReadUsers
      ? [
          {
            label: "用户总数",
            value: summary.userCount,
            detail:
              Number(summary.bannedCount) > 0
                ? `其中 ${summary.bannedCount} 个已封禁`
                : "全部正常",
            href: "/app/users",
            icon: Users,
          },
          {
            label: "活跃会话",
            value: summary.sessionCount,
            detail: "未过期的登录会话",
            href: "/app/users",
            icon: UserRoundCog,
          },
        ]
      : []),
    ...(canReadRoles
      ? [
          {
            label: "角色数",
            value: summary.roleCount,
            detail: "含系统与自定义角色",
            href: "/app/roles",
            icon: Shield,
          },
        ]
      : []),
    ...(canReadAudit
      ? [
          {
            label: "近 7 日审计",
            value: summary.recentAuditCount,
            detail: "关键写操作记录",
            href: "/app/audit",
            icon: FileClock,
          },
        ]
      : []),
  ];

  const quickLinks = [
    ...(canReadUsers
      ? [{ title: "用户管理", desc: "创建账号、批量封禁或导出名单", href: "/app/users", icon: Users }]
      : []),
    ...(canReadRoles
      ? [{ title: "角色授权", desc: "按职位分配菜单与按钮权限", href: "/app/roles", icon: ShieldCheck }]
      : []),
    ...(canReadMenus
      ? [{ title: "菜单配置", desc: "管理侧栏分组、页面与按钮节点", href: "/app/menus", icon: ListTree }]
      : []),
    ...(canReadAudit
      ? [{ title: "审计检索", desc: "追踪写操作流水与导出 CSV", href: "/app/audit", icon: Activity }]
      : []),
    { title: "个人中心", desc: "修改资料、密码与管理登录设备", href: "/app/profile", icon: UserRoundCog },
  ];

  const maxDailyAudit = Math.max(1, ...auditSeries.map((point) => point.count));

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="工作台"
        title="欢迎使用管理中心"
        description="以下为当前环境的真实聚合数据。通过左侧导航或下方快捷入口进入可用模块。"
      />

      {stats.length > 0 ? (
        <section aria-labelledby="workspace-stats-title">
          <h2 id="workspace-stats-title" className="text-lg font-semibold tracking-[-0.012em]">
            环境概览
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((item) => (
              <StatCard
                key={item.label}
                label={item.label}
                value={item.value}
                detail={item.detail}
                icon={item.icon}
                href={item.href}
              />
            ))}
          </div>
        </section>
      ) : null}

      {canReadAudit && auditSeries.length > 0 ? (
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold">近 7 日系统操作活跃趋势</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                按日期统计关键写操作审计记录数（含用户、角色、菜单变更）
              </p>
            </div>
            <Badge variant="secondary" className="tabular-nums">
              近 7 日共 {summary.recentAuditCount ?? 0} 次操作
            </Badge>
          </div>

          <div className="mt-6 grid grid-cols-7 items-end gap-2 sm:gap-4" role="img" aria-label="近 7 日审计趋势柱状图">
            {auditSeries.map((point) => {
              const heightPct = point.count === 0 ? 6 : Math.max(14, Math.round((point.count / maxDailyAudit) * 100));
              return (
                <div key={point.key} className="flex flex-col items-center gap-2">
                  <span className="text-xs font-medium tabular-nums text-muted-foreground">
                    {point.count}
                  </span>
                  <div className="flex h-28 w-full items-end justify-center rounded-lg bg-muted/45 p-1.5">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={
                        point.count > 0
                          ? "w-full rounded-md bg-primary/85 transition-all"
                          : "w-full rounded-md bg-border/70"
                      }
                    />
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {point.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        {canReadUsers ? (
          <Card className="overflow-hidden">
            <div className="border-b border-border/70 px-5 py-4">
              <h2 id="recent-users-title" className="font-semibold">
                最近创建的账号
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">按创建时间倒序，最多 5 条</p>
            </div>
            {recentUsers.length === 0 ? (
              <EmptyState icon={Users} title="还没有账号" description="前往用户管理创建第一个系统账号。" />
            ) : (
              <ul className="divide-y divide-border/70">
                {recentUsers.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={item.name} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{item.email}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-sm">
                          {parseRoleKeys(item.role)
                            .map((key) => roleNameByKey[key] ?? key)
                            .join("、")}
                        </span>
                        {item.banned ? <Badge variant="destructive">已封禁</Badge> : null}
                      </div>
                      <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ) : null}

        <section aria-labelledby="workspace-quicklinks-title" className="space-y-4">
          <h2 id="workspace-quicklinks-title" className="text-lg font-semibold tracking-[-0.012em]">
            快捷功能入口
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col justify-between gap-3 rounded-xl bg-card p-4 shadow-card transition-[transform,box-shadow] hover:shadow-card-raised active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <item.icon aria-hidden="true" className="size-4" />
                  </span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
                  />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{item.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
