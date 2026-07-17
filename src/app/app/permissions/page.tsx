import { KeyRound, Plus } from "lucide-react";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { GuardedDirectoryLink, GuardedEditForm } from "@/components/ui/guarded-edit-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  createPermissionAction,
  deletePermissionAction,
  updatePermissionAction,
} from "@/features/rbac/actions";
import { rbacNoticeMessages } from "@/features/rbac/messages";
import { requirePermission } from "@/lib/auth/session";
import { listAllPermissions, roleHasPermission } from "@/lib/rbac/permissions";
import { cn } from "@/lib/utils";

export default async function PermissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; selected?: string; mode?: string }>;
}) {
  const session = await requirePermission("permissions:read");
  const { notice, selected: selectedId, mode } = await searchParams;
  const [permissions, canWrite] = await Promise.all([
    listAllPermissions(),
    roleHasPermission(session.user.role ?? "", "permissions:write"),
  ]);
  const selected = permissions.find((item) => item.id === selectedId) ?? permissions[0] ?? null;
  const createMode = canWrite && mode === "create";
  const groups = permissions.reduce<Record<string, typeof permissions>>((result, item) => {
    const resource = item.key.split(":", 1)[0] || "other";
    (result[resource] ??= []).push(item);
    return result;
  }, {});

  return (
    <div className="space-y-7">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">权限</p>
        <h1 className="text-balance text-3xl font-semibold tracking-[-0.022em]">权限管理</h1>
        <p className="mt-2 text-pretty text-sm text-muted-foreground">
          按资源维护系统权限，控制不同角色可访问的页面和操作。
        </p>
      </div>

      {notice && rbacNoticeMessages[notice] ? (
        <p role="status" className="rounded-lg bg-card px-4 py-3 text-sm shadow-[0_1px_2px_rgba(62,47,35,0.06),0_8px_22px_rgba(62,47,35,0.07)]">
          {rbacNoticeMessages[notice]}
        </p>
      ) : null}

      <div className="grid min-w-0 gap-5 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
        <aside className="overflow-hidden rounded-xl bg-card shadow-[0_1px_2px_rgba(62,47,35,0.06),0_10px_28px_rgba(62,47,35,0.09)] lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
            <div>
              <h2 className="font-semibold">权限目录</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">{permissions.length} 个权限点</p>
            </div>
            {canWrite ? (
              <GuardedDirectoryLink
                href="/app/permissions?mode=create#rbac-detail"
                aria-label="新增权限"
                className="inline-flex size-10 items-center justify-center rounded-lg bg-secondary/70 text-secondary-foreground transition-[background-color,color,transform] hover:bg-primary hover:text-primary-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Plus aria-hidden="true" className="size-4" />
              </GuardedDirectoryLink>
            ) : null}
          </div>

          {permissions.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              {canWrite ? "点击右上角添加第一个权限点。" : "请联系管理员配置权限。"}
            </div>
          ) : (
            <nav aria-label="权限目录" className="max-h-[60vh] space-y-4 overflow-y-auto p-2.5 lg:max-h-[calc(100vh-12rem)]">
              {Object.entries(groups).map(([resource, items]) => (
                <section key={resource} aria-labelledby={`permission-group-${resource}`}>
                  <h3 id={`permission-group-${resource}`} className="px-2 pb-1 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                    {resource}
                  </h3>
                  <div className="space-y-1">
                    {items.map((item) => (
                      <GuardedDirectoryLink
                        key={item.id}
                        href={`/app/permissions?selected=${encodeURIComponent(item.id)}#rbac-detail`}
                        className={cn(
                          "block min-h-10 rounded-lg px-3 py-2 transition-[background-color,color,box-shadow,transform] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          !createMode && selected?.id === item.id
                            ? "bg-primary text-primary-foreground shadow-[0_7px_18px_rgba(126,47,24,0.2)]"
                            : "hover:bg-secondary/75 hover:text-secondary-foreground",
                        )}
                      >
                        <span className="block truncate text-sm font-medium">{item.name}</span>
                        <span className={cn("block truncate font-mono text-[11px]", !createMode && selected?.id === item.id ? "text-primary-foreground/75" : "text-muted-foreground")}>
                          {item.key}
                        </span>
                      </GuardedDirectoryLink>
                    ))}
                  </div>
                </section>
              ))}
            </nav>
          )}
        </aside>

        <section id="rbac-detail" className="min-w-0 scroll-mt-20 rounded-xl bg-card p-5 shadow-[0_1px_2px_rgba(62,47,35,0.06),0_10px_28px_rgba(62,47,35,0.09)] sm:p-6">
          {createMode ? (
            <>
              <div className="mb-6 flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/12 text-primary">
                  <KeyRound aria-hidden="true" className="size-4" />
                </span>
                <div>
                  <h2 className="font-semibold">新增权限</h2>
                  <p className="text-sm text-muted-foreground">新建权限会自动授予系统管理员。</p>
                </div>
              </div>
              <GuardedEditForm action={createPermissionAction} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="perm-key">Key</Label>
                  <Input id="perm-key" name="key" placeholder="orders:read" required pattern="[a-z][a-z0-9_]*:[a-z][a-z0-9_]*" />
                  <p className="text-xs text-muted-foreground">使用 resource:action，例如 orders:read。</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perm-name">名称</Label>
                  <Input id="perm-name" name="name" required maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perm-desc">说明</Label>
                  <Input id="perm-desc" name="description" maxLength={200} />
                </div>
                <SubmitButton pendingLabel="创建中…">创建权限</SubmitButton>
              </GuardedEditForm>
            </>
          ) : selected ? (
            <>
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-primary">{selected.key}</p>
                  <h2 className="mt-1 break-words text-xl font-semibold tracking-[-0.012em]">
                    {canWrite ? "编辑权限" : selected.name}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">{selected.isSystem ? "系统权限，key 不可修改" : "自定义权限，key 创建后不可修改"}</p>
                </div>
                {canWrite && !selected.isSystem ? (
                  <form action={deletePermissionAction}>
                    <input type="hidden" name="id" value={selected.id} />
                    <ConfirmSubmitButton
                      size="sm"
                      variant="destructive"
                      pendingLabel="删除中…"
                      confirmMessage={`确认删除权限“${selected.name}（${selected.key}）”？请先解除所有角色和菜单引用。`}
                    >
                      删除
                    </ConfirmSubmitButton>
                  </form>
                ) : null}
              </div>

              {canWrite ? (
                <GuardedEditForm action={updatePermissionAction} className="space-y-4">
                  <input type="hidden" name="id" value={selected.id} />
                  <div className="space-y-2">
                    <Label htmlFor={`permission-name-${selected.id}`}>名称</Label>
                    <Input id={`permission-name-${selected.id}`} name="name" defaultValue={selected.name} required maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`permission-description-${selected.id}`}>说明</Label>
                    <Input id={`permission-description-${selected.id}`} name="description" defaultValue={selected.description ?? ""} maxLength={200} />
                  </div>
                  <SubmitButton pendingLabel="保存中…">保存权限</SubmitButton>
                </GuardedEditForm>
              ) : (
                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                  <div><dt className="text-muted-foreground">名称</dt><dd className="mt-1 break-words font-medium">{selected.name}</dd></div>
                  <div><dt className="text-muted-foreground">说明</dt><dd className="mt-1 break-words">{selected.description || "无说明"}</dd></div>
                </dl>
              )}
            </>
          ) : (
            <div className="py-16 text-center">
              <KeyRound aria-hidden="true" className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-4 font-medium">请选择权限</p>
              <p className="mt-2 text-sm text-muted-foreground">从左侧目录选择要查看的权限点。</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
