import Link from "next/link";
import { Activity, ShieldCheck, Users, UserRoundCog } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { getDashboardStats } from "@/features/dashboard/queries";
import { listRecentUsers } from "@/features/users/queries";
import { isSystemAdminRole, listAllRoles, listPermissionKeysForRoleKey } from "@/lib/rbac/permissions";
import { parseRoleKeys } from "@/lib/rbac/role-keys";

export default async function AppPage() {
  const session = await requirePermission("dashboard:view");
  const roleKey = session.user.role ?? "";
  const permissionKeys = await listPermissionKeysForRoleKey(roleKey);
  const isAdmin = isSystemAdminRole(roleKey);
  const canReadUsers = isAdmin || permissionKeys.has("users:read");
  const canReadRoles = isAdmin || permissionKeys.has("roles:read");
  const canReadAudit = isAdmin || permissionKeys.has("audit:read");

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 7);
  const [summary, recentUsers, roles] = await Promise.all([
    getDashboardStats({
      includeUsers: canReadUsers,
      includeRoles: canReadRoles,
      includeAudit: canReadAudit,
      auditSince: since,
    }),
    canReadUsers ? listRecentUsers(5) : Promise.resolve([]),
    canReadUsers ? listAllRoles() : Promise.resolve([]),
  ]);

  const roleNameByKey = Object.fromEntries(roles.map((item) => [item.key, item.name]));

  const stats = [
    ...(canReadUsers ? [
      { label: "用户总数", value: summary.userCount, detail: Number(summary.bannedCount) > 0 ? `其中 ${summary.bannedCount} 个已封禁` : "全部正常", href: "/app/users" },
      { label: "活跃会话", value: summary.sessionCount, detail: "未过期的登录会话", href: "/app/users" },
    ] : []),
    ...(canReadRoles ? [
      { label: "角色数", value: summary.roleCount, detail: "含系统与自定义角色", href: "/app/roles" },
    ] : []),
    ...(canReadAudit ? [
      { label: "近 7 日审计", value: summary.recentAuditCount, detail: "关键写操作记录", href: "/app/audit" },
    ] : []),
  ];

  return (
    <div className="space-y-7">
      <div className="max-w-2xl">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">工作台</p>
        <h1 className="text-balance text-3xl font-semibold tracking-[-0.022em] sm:text-4xl">欢迎使用管理中心</h1>
        <p className="mt-3 text-pretty text-muted-foreground">
          以下为当前环境的真实聚合数据。通过左侧导航进入可用模块，系统会根据你的角色显示对应功能。
        </p>
      </div>

      {stats.length > 0 ? <section aria-labelledby="workspace-stats-title">
        <h2 id="workspace-stats-title" className="text-lg font-semibold tracking-[-0.012em]">
          环境概览
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-xl bg-card p-5 shadow-[0_1px_2px_rgba(62,47,35,0.06),0_10px_28px_rgba(62,47,35,0.09)] transition-[transform,box-shadow] hover:shadow-[0_1px_2px_rgba(62,47,35,0.08),0_14px_32px_rgba(62,47,35,0.12)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums tracking-[-0.022em]">{item.value}</p>
              <p className="mt-2 text-xs text-muted-foreground">{item.detail}</p>
            </Link>
          ))}
        </div>
      </section> : null}

      <div className="grid gap-5 lg:grid-cols-2">
        {canReadUsers ? <div className="rounded-xl bg-card shadow-[0_1px_2px_rgba(62,47,35,0.06),0_10px_28px_rgba(62,47,35,0.09)]">
          <div className="border-b border-border/70 px-5 py-4">
            <h2 id="recent-users-title" className="font-semibold">
              最近创建的账号
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">按创建时间倒序，最多 5 条</p>
          </div>
          {recentUsers.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">还没有账号。</p>
          ) : (
            <ul className="divide-y divide-border/70">
              {recentUsers.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.email}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm">
                      {parseRoleKeys(item.role).map((key) => roleNameByKey[key] ?? key).join("、")}
                    </p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {item.createdAt.toLocaleDateString("zh-CN")}
                      {item.banned ? " · 已封禁" : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div> : null}

        <section aria-labelledby="workspace-guide-title">
          <h2 id="workspace-guide-title" className="text-lg font-semibold tracking-[-0.012em]">
            使用提示
          </h2>
          <div className="mt-4 divide-y divide-border/70 rounded-xl bg-card shadow-[0_1px_2px_rgba(62,47,35,0.06),0_10px_28px_rgba(62,47,35,0.09)]">
            {[
              { icon: ShieldCheck, title: "权限范围", detail: "可见菜单和操作由角色决定，如需调整请联系系统管理员。" },
              { icon: UserRoundCog, title: "账号安全", detail: "可在「个人中心」修改密码并管理本人会话；管理员可封禁或重置他人密码。" },
              { icon: Activity, title: "操作审计", detail: "关键写操作会写入审计日志，具备 audit:read 权限的角色可查阅。" },
              { icon: Users, title: "扩展业务", detail: "在 features 下新增域模块，并用权限与菜单绑定入口；不要只靠隐藏菜单做授权。" },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 px-4 py-5 sm:px-5">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
                  <item.icon aria-hidden="true" className="size-4" />
                </span>
                <div>
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
