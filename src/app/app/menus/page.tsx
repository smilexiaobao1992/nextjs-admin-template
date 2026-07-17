import { ChevronRight, PanelLeft, Plus } from "lucide-react";
import { MENU_ICON_OPTIONS } from "@/components/layout/menu-icons";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { GuardedDirectoryLink, GuardedEditForm } from "@/components/ui/guarded-edit-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { createMenuAction, deleteMenuAction, updateMenuAction } from "@/features/rbac/actions";
import { rbacNoticeMessages } from "@/features/rbac/messages";
import { requirePermission } from "@/lib/auth/session";
import { listAllMenus, listAllPermissions, roleHasPermission } from "@/lib/rbac/permissions";
import { cn } from "@/lib/utils";

export default async function MenusPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; selected?: string; mode?: string }>;
}) {
  const session = await requirePermission("menus:read");
  const { notice, selected: selectedId, mode } = await searchParams;
  const [menus, permissions, canWrite] = await Promise.all([
    listAllMenus(),
    listAllPermissions(),
    roleHasPermission(session.user.role ?? "", "menus:write"),
  ]);
  const selected = menus.find((item) => item.id === selectedId) ?? menus[0] ?? null;
  const createMode = canWrite && mode === "create";
  const roots = menus.filter((item) => !item.parentId);
  const childrenByParent = menus.reduce<Record<string, typeof menus>>((result, item) => {
    if (item.parentId) {
      (result[item.parentId] ??= []).push(item);
    }
    return result;
  }, {});
  const titleById = Object.fromEntries(menus.map((item) => [item.id, item.title]));
  const permissionById = Object.fromEntries(permissions.map((item) => [item.id, item]));
  const selectedHasChildren = selected ? (childrenByParent[selected.id]?.length ?? 0) > 0 : false;
  const parentOptions = selectedHasChildren
    ? []
    : roots.filter((item) => item.id !== selected?.id);

  const menuLink = (item: (typeof menus)[number], nested = false) => (
    <GuardedDirectoryLink
      key={item.id}
      href={`/app/menus?selected=${encodeURIComponent(item.id)}#rbac-detail`}
      className={cn(
        "flex min-h-10 min-w-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-[background-color,color,box-shadow,transform] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        nested && "ml-5",
        !createMode && selected?.id === item.id
          ? "bg-primary text-primary-foreground shadow-[0_7px_18px_rgba(126,47,24,0.2)]"
          : "text-muted-foreground hover:bg-secondary/75 hover:text-secondary-foreground",
      )}
    >
      {nested ? <ChevronRight aria-hidden="true" className="size-3.5 shrink-0" /> : null}
      <span className="min-w-0 flex-1 truncate font-medium">{item.title}</span>
      {!item.isVisible ? <span className="text-[10px] opacity-70">隐藏</span> : null}
    </GuardedDirectoryLink>
  );

  return (
    <div className="space-y-7">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">菜单</p>
        <h1 className="text-balance text-3xl font-semibold tracking-[-0.022em]">菜单管理</h1>
        <p className="mt-2 text-pretty text-sm text-muted-foreground">
          左侧维护导航树，右侧编辑选中菜单。只支持一级分组和二级菜单，菜单权限只控制可见性，页面仍需服务端鉴权。
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
              <h2 className="font-semibold">菜单树</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">{menus.length} 个菜单</p>
            </div>
            {canWrite ? (
              <GuardedDirectoryLink
                href="/app/menus?mode=create#rbac-detail"
                aria-label="新增菜单"
                className="inline-flex size-10 items-center justify-center rounded-lg bg-secondary/70 text-secondary-foreground transition-[background-color,color,transform] hover:bg-primary hover:text-primary-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Plus aria-hidden="true" className="size-4" />
              </GuardedDirectoryLink>
            ) : null}
          </div>

          {menus.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              {canWrite ? "点击右上角添加第一个菜单。" : "请联系管理员配置菜单。"}
            </div>
          ) : (
            <nav aria-label="菜单配置树" className="max-h-[60vh] space-y-1 overflow-y-auto p-2.5 lg:max-h-[calc(100vh-12rem)]">
              {roots.map((root) => (
                <div key={root.id} className="space-y-1">
                  {menuLink(root)}
                  {(childrenByParent[root.id] ?? []).map((child) => menuLink(child, true))}
                </div>
              ))}
            </nav>
          )}
        </aside>

        <section id="rbac-detail" className="min-w-0 scroll-mt-20 rounded-xl bg-card p-5 shadow-[0_1px_2px_rgba(62,47,35,0.06),0_10px_28px_rgba(62,47,35,0.09)] sm:p-6">
          {createMode ? (
            <>
              <div className="mb-6 flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/12 text-primary">
                  <PanelLeft aria-hidden="true" className="size-4" />
                </span>
                <div>
                  <h2 className="font-semibold">新增菜单</h2>
                  <p className="text-sm text-muted-foreground">分组路径可留空，二级菜单选择一个一级菜单作为上级。</p>
                </div>
              </div>
              <MenuForm
                action={createMenuAction}
                permissions={permissions}
                parentOptions={roots}
                submitLabel="创建菜单"
              />
            </>
          ) : selected ? (
            <>
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-primary">{selected.parentId ? "二级菜单" : "一级菜单"}</p>
                  <h2 className="mt-1 break-words text-xl font-semibold tracking-[-0.012em]">
                    {canWrite ? "编辑菜单" : selected.title}
                  </h2>
                  <p className="mt-2 break-words text-sm text-muted-foreground">
                    当前：{selected.title} · <span className="break-all font-mono text-xs">{selected.href || "分组菜单，无跳转路径"}</span>
                  </p>
                </div>
                {canWrite ? (
                  <form action={deleteMenuAction}>
                    <input type="hidden" name="id" value={selected.id} />
                    <ConfirmSubmitButton
                      size="sm"
                      variant="destructive"
                      pendingLabel="删除中…"
                      confirmMessage={`确认删除菜单“${selected.title}”？存在子菜单时需要先处理子菜单。`}
                    >
                      删除
                    </ConfirmSubmitButton>
                  </form>
                ) : null}
              </div>

              {canWrite ? (
                <MenuForm
                  action={updateMenuAction}
                  menu={selected}
                  permissions={permissions}
                  parentOptions={parentOptions}
                  submitLabel="保存菜单"
                />
              ) : (
                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                  <div><dt className="text-muted-foreground">上级</dt><dd className="mt-1 font-medium">{selected.parentId ? titleById[selected.parentId] ?? selected.parentId : "无"}</dd></div>
                  <div><dt className="text-muted-foreground">权限</dt><dd className="mt-1 font-medium">{selected.permissionId ? permissionById[selected.permissionId]?.name ?? selected.permissionId : "登录即可"}</dd></div>
                  <div><dt className="text-muted-foreground">图标</dt><dd className="mt-1 font-mono">{selected.icon || "无"}</dd></div>
                  <div><dt className="text-muted-foreground">状态</dt><dd className="mt-1 font-medium">{selected.isVisible ? "显示" : "隐藏"}</dd></div>
                </dl>
              )}
            </>
          ) : (
            <div className="py-16 text-center">
              <PanelLeft aria-hidden="true" className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-4 font-medium">请选择菜单</p>
              <p className="mt-2 text-sm text-muted-foreground">从左侧菜单树选择要查看的项目。</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

type MenuRow = Awaited<ReturnType<typeof listAllMenus>>[number];
type PermissionRow = Awaited<ReturnType<typeof listAllPermissions>>[number];

function MenuForm({
  action,
  menu,
  permissions,
  parentOptions,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  menu?: MenuRow;
  permissions: PermissionRow[];
  parentOptions: MenuRow[];
  submitLabel: string;
}) {
  const prefix = menu ? `menu-${menu.id}` : "menu-new";

  return (
    <GuardedEditForm action={action} className="space-y-5">
      {menu ? <input type="hidden" name="id" value={menu.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-title`}>标题</Label>
          <Input id={`${prefix}-title`} name="title" defaultValue={menu?.title} required maxLength={80} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-href`}>路径</Label>
          <Input id={`${prefix}-href`} name="href" defaultValue={menu?.href} placeholder="/app/orders 或留空" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-parent`}>上级菜单</Label>
          <Select id={`${prefix}-parent`} name="parentId" defaultValue={menu?.parentId ?? ""}>
            <option value="">无（一级）</option>
            {parentOptions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-permission`}>所需权限</Label>
          <Select id={`${prefix}-permission`} name="permissionId" defaultValue={menu?.permissionId ?? ""}>
            <option value="">登录即可</option>
            {permissions.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.key})</option>)}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-icon`}>图标</Label>
          <Select id={`${prefix}-icon`} name="icon" defaultValue={menu?.icon ?? "LayoutDashboard"}>
            {MENU_ICON_OPTIONS.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-sort`}>排序</Label>
          <Input id={`${prefix}-sort`} name="sortOrder" type="number" defaultValue={menu?.sortOrder ?? 100} />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/70 pt-4">
        <label className="flex min-h-10 items-center gap-2 text-sm">
          <input type="checkbox" name="isVisible" defaultChecked={menu?.isVisible ?? true} />
          在导航中显示
        </label>
        <SubmitButton pendingLabel="保存中…">{submitLabel}</SubmitButton>
      </div>
    </GuardedEditForm>
  );
}
