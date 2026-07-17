import { BellRing, ShieldCheck, UserRoundCog } from "lucide-react";

export default async function AppPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams;

  return (
    <div className="space-y-7">
      <div className="max-w-2xl">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">工作台</p>
        <h1 className="text-balance text-3xl font-semibold tracking-[-0.022em] sm:text-4xl">欢迎使用管理中心</h1>
        <p className="mt-3 text-pretty text-muted-foreground">
          通过左侧导航进入可用模块，系统会根据你的角色显示对应功能。
        </p>
      </div>

      {notice === "forbidden" ? (
        <p role="alert" className="rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          当前账号没有访问该页面的权限。
        </p>
      ) : null}

      <section aria-labelledby="workspace-guide-title">
        <h2 id="workspace-guide-title" className="text-lg font-semibold tracking-[-0.012em]">使用提示</h2>
        <div className="mt-4 divide-y divide-border/70 rounded-xl bg-card shadow-[0_1px_2px_rgba(62,47,35,0.06),0_10px_28px_rgba(62,47,35,0.09)]">
          {[
            { icon: ShieldCheck, title: "权限范围", detail: "可见菜单和操作由角色决定，如需调整请联系系统管理员。" },
            { icon: UserRoundCog, title: "账号信息", detail: "请使用本人账号处理工作，不要与他人共享登录凭据。" },
            { icon: BellRing, title: "操作提醒", detail: "重要修改提交后会立即生效，保存前请确认当前选择。" },
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
  );
}
