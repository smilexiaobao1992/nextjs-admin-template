import { BookOpen, Database, LockKeyhole } from "lucide-react";

export default async function AppPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams;

  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <p className="mb-2 text-sm font-medium text-primary">工作区概览</p>
        <h1 className="text-balance text-3xl font-semibold tracking-[-0.022em] sm:text-4xl">后台基础已经就绪</h1>
        <p className="mt-3 text-pretty text-muted-foreground">
          从认证、权限和数据库迁移开始扩展你的业务，不需要先拆除示例业务代码。
        </p>
      </div>

      {notice === "forbidden" ? (
        <p role="alert" className="rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          当前账号没有访问该页面的权限。
        </p>
      ) : null}

      <section aria-labelledby="foundation-title">
        <h2 id="foundation-title" className="text-lg font-semibold tracking-[-0.012em]">模板基线</h2>
        <div className="mt-4 divide-y rounded-xl bg-card shadow-[0_1px_3px_rgba(0,0,0,0.10)]">
          {[
            { icon: LockKeyhole, title: "认证与动态 RBAC", detail: "Better Auth 会话 + 可管理的角色 / 权限 / 菜单" },
            { icon: Database, title: "数据层", detail: "Drizzle schema、版本化迁移、Supabase serverless 连接" },
            { icon: BookOpen, title: "工程规范", detail: "类型检查、自动化测试、CI 与 UI 规范文档" },
          ].map((item) => (
            <div key={item.title} className="flex gap-4 px-4 py-5 sm:px-5">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
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
