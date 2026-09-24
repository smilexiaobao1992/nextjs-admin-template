import { FileText, Folder, KeyRound, ListTree, Plus } from "lucide-react";
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
import { MENU_NODE_TYPES, type MenuNodeType } from "@/lib/db/schema";
import { listAllMenus, roleHasPermission, type MenuNode } from "@/lib/rbac/permissions";
import { cn } from "@/lib/utils";

const TYPE_META: Record<MenuNodeType, { label: string; icon: typeof Folder; hint: string }> = {
  directory: { label: "目录", icon: Folder, hint: "侧栏分组，只能放在顶级，本身不需要权限。" },
  page: { label: "页面", icon: FileText, hint: "侧栏入口。填写权限 key 后需要授权才能访问，留空则所有登录用户可见。" },
  action: { label: "操作", icon: KeyRound, hint: "页面内的按钮或接口权限，不会出现在侧栏，在代码中用 requirePermission 校验。" },
};

function byOrder(a: MenuNode, b: MenuNode) {
  return a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "zh-CN");
}

function createHref(type: MenuNodeType, parentId?: string) {
  const params = new URLSearchParams({ mode: "create", type });
  if (parentId) {
    params.set("parent", parentId);
  }
  return `/app/menus?${params.toString()}#rbac-detail`;
}

/** Parents a node of this type may be placed under (null = top level). */
function parentCandidates(nodes: MenuNode[], type: MenuNodeType, selfId?: string) {
  const allowed: MenuNodeType[] = type === "page" ? ["directory"] : type === "action" ? ["page", "directory"] : [];
  return nodes.filter((item) => allowed.includes(item.type) && item.id !== selfId).sort(byOrder);
}

/** Suggest `<resource>:write` for an action under a page guarded by `<resource>:read`. */
function suggestKey(parent: MenuNode | undefined) {
  const resource = parent?.permissionKey?.split(":")[0];
  return resource ? `${resource}:write` : "orders:export";
}

export default async function MenusPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; selected?: string; mode?: string; type?: string; parent?: string }>;
}) {
  const session = await requirePermission("menus:read");
  const params = await searchParams;
  const [nodes, canWrite] = await Promise.all([
    listAllMenus(),
    roleHasPermission(session.user.role ?? "", "menus:write"),
  ]);
  const byId = new Map(nodes.map((item) => [item.id, item]));
  const childrenOf = (parentId: string | null) => nodes.filter((item) => item.parentId === parentId).sort(byOrder);
  const createType = MENU_NODE_TYPES.find((type) => type === params.type) ?? "page";
  const createMode = canWrite && params.mode === "create";
  const createParent = params.parent ? byId.get(params.parent) : undefined;
  const selected = byId.get(params.selected ?? "") ?? childrenOf(null)[0] ?? null;

  function treeRow(node: MenuNode, depth: number) {
    const Icon = TYPE_META[node.type].icon;
    const active = !createMode && selected?.id === node.id;
    return (
      <div key={node.id}>
        <GuardedDirectoryLink
          href={`/app/menus?selected=${encodeURIComponent(node.id)}#rbac-detail`}
          style={{ paddingLeft: `${0.75 + depth * 1.25}rem` }}
          className={cn(
            "flex min-h-10 min-w-0 items-center gap-2 rounded-lg py-2 pr-3 text-sm transition-[background-color,color,transform] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            active ? "bg-primary text-primary-foreground" : "hover:bg-secondary/75 hover:text-secondary-foreground",
          )}
        >
          <Icon aria-hidden="true" className={cn("size-3.5 shrink-0", active ? "" : "text-muted-foreground")} />
          <span className={cn("min-w-0 truncate", node.type === "action" ? "" : "font-medium")}>{node.title}</span>
          {node.permissionKey ? (
            <span className={cn("ml-auto shrink-0 truncate font-mono text-[11px]", active ? "text-primary-foreground/75" : "text-muted-foreground")}>
              {node.permissionKey}
            </span>
          ) : null}
          {!node.isVisible && node.type !== "action" ? (
            <span className={cn("shrink-0 text-[10px]", node.permissionKey ? "" : "ml-auto", active ? "text-primary-foreground/75" : "text-muted-foreground")}>隐藏</span>
          ) : null}
        </GuardedDirectoryLink>
        {childrenOf(node.id).map((child) => treeRow(child, depth + 1))}
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">菜单与权限</p>
        <h1 className="text-balance text-3xl font-semibold tracking-[-0.022em]">菜单与权限</h1>
        <p className="mt-2 text-pretty text-sm text-muted-foreground">
          在一棵树里维护侧栏菜单和权限点：目录用于分组，页面是侧栏入口，操作是页面内的按钮权限。建好后到「角色」中勾选授权。
        </p>
      </div>

      {params.notice && rbacNoticeMessages[params.notice] ? (
        <p role="status" className="rounded-lg bg-card px-4 py-3 text-sm shadow-[0_1px_2px_rgba(62,47,35,0.06),0_8px_22px_rgba(62,47,35,0.07)]">
          {rbacNoticeMessages[params.notice]}
        </p>
      ) : null}

      <div className="grid min-w-0 gap-5 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
        <aside className="overflow-hidden rounded-xl bg-card shadow-[0_1px_2px_rgba(62,47,35,0.06),0_10px_28px_rgba(62,47,35,0.09)] lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
            <div>
              <h2 className="font-semibold">结构</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {nodes.filter((item) => item.permissionKey).length} 个权限点 · {nodes.length} 个节点
              </p>
            </div>
            {canWrite ? (
              <div className="flex gap-1.5">
                <GuardedDirectoryLink
                  href={createHref("directory")}
                  className="inline-flex h-9 items-center gap-1 rounded-lg bg-secondary/70 px-2.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Plus aria-hidden="true" className="size-3.5" />目录
                </GuardedDirectoryLink>
                <GuardedDirectoryLink
                  href={createHref("page")}
                  className="inline-flex h-9 items-center gap-1 rounded-lg bg-secondary/70 px-2.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Plus aria-hidden="true" className="size-3.5" />页面
                </GuardedDirectoryLink>
              </div>
            ) : null}
          </div>

          {nodes.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              {canWrite ? "点击右上角添加第一个目录或页面。" : "请联系管理员配置菜单。"}
            </div>
          ) : (
            <nav aria-label="菜单与权限结构" className="max-h-[60vh] space-y-0.5 overflow-y-auto p-2.5 lg:max-h-[calc(100vh-12rem)]">
              {childrenOf(null).map((node) => treeRow(node, 0))}
            </nav>
          )}
        </aside>

        <section
          key={createMode ? `create-${createType}-${params.parent ?? ""}` : selected?.id ?? "empty"}
          id="rbac-detail"
          className="min-w-0 scroll-mt-20 rounded-xl bg-card p-5 shadow-[0_1px_2px_rgba(62,47,35,0.06),0_10px_28px_rgba(62,47,35,0.09)] sm:p-6"
        >
          {createMode ? (
            <>
              <DetailHeading type={createType} title={`新增${TYPE_META[createType].label}`} subtitle={TYPE_META[createType].hint} />
              <MenuNodeForm
                action={createMenuAction}
                type={createType}
                parents={parentCandidates(nodes, createType)}
                defaultParentId={createParent?.id}
                keyPlaceholder={createType === "action" ? suggestKey(createParent) : "orders:read"}
                submitLabel={`创建${TYPE_META[createType].label}`}
              />
            </>
          ) : selected ? (
            <>
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <DetailHeading
                  type={selected.type}
                  title={canWrite ? `编辑${TYPE_META[selected.type].label}` : selected.title}
                  subtitle={selected.isSystem ? "系统内置：只能修改名称、图标、排序和显示状态。" : TYPE_META[selected.type].hint}
                />
                {canWrite ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {selected.type === "directory" ? (
                      <GuardedDirectoryLink href={createHref("page", selected.id)} className="inline-flex h-9 items-center gap-1 rounded-lg border border-input/80 bg-card px-3 text-xs font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <Plus aria-hidden="true" className="size-3.5" />新增页面
                      </GuardedDirectoryLink>
                    ) : null}
                    {selected.type !== "action" ? (
                      <GuardedDirectoryLink href={createHref("action", selected.id)} className="inline-flex h-9 items-center gap-1 rounded-lg border border-input/80 bg-card px-3 text-xs font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <Plus aria-hidden="true" className="size-3.5" />新增操作
                      </GuardedDirectoryLink>
                    ) : null}
                    {!selected.isSystem ? (
                      <form action={deleteMenuAction}>
                        <input type="hidden" name="id" value={selected.id} />
                        <ConfirmSubmitButton
                          size="sm"
                          variant="destructive"
                          pendingLabel="删除中…"
                          confirmLabel="确认删除"
                          confirmMessage={`确认删除“${selected.title}”？存在子节点或已授权给角色时无法删除。`}
                        >
                          删除
                        </ConfirmSubmitButton>
                      </form>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {canWrite ? (
                <MenuNodeForm
                  action={updateMenuAction}
                  type={selected.type}
                  node={selected}
                  parents={parentCandidates(nodes, selected.type, selected.id)}
                  defaultParentId={selected.parentId ?? undefined}
                  keyPlaceholder={selected.type === "action" ? suggestKey(byId.get(selected.parentId ?? "")) : "orders:read"}
                  submitLabel="保存"
                />
              ) : (
                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                  <div><dt className="text-muted-foreground">上级</dt><dd className="mt-1 font-medium">{byId.get(selected.parentId ?? "")?.title ?? "顶级"}</dd></div>
                  <div><dt className="text-muted-foreground">权限 key</dt><dd className="mt-1 font-mono">{selected.permissionKey ?? (selected.type === "page" ? "登录即可访问" : "无")}</dd></div>
                  {selected.type === "page" ? <div><dt className="text-muted-foreground">路径</dt><dd className="mt-1 font-mono">{selected.href}</dd></div> : null}
                  {selected.type !== "action" ? <div><dt className="text-muted-foreground">状态</dt><dd className="mt-1 font-medium">{selected.isVisible ? "显示" : "隐藏"}</dd></div> : null}
                </dl>
              )}
            </>
          ) : (
            <div className="py-16 text-center">
              <ListTree aria-hidden="true" className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-4 font-medium">请选择节点</p>
              <p className="mt-2 text-sm text-muted-foreground">从左侧结构中选择要查看的目录、页面或操作。</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function DetailHeading({ type, title, subtitle }: { type: MenuNodeType; title: string; subtitle: string }) {
  const Icon = TYPE_META[type].icon;
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <div className="min-w-0">
        <h2 className="break-words font-semibold">{title}</h2>
        <p className="mt-0.5 max-w-xl text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function MenuNodeForm({
  action,
  type,
  node,
  parents,
  defaultParentId,
  keyPlaceholder,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  type: MenuNodeType;
  node?: MenuNode;
  parents: MenuNode[];
  defaultParentId?: string;
  keyPlaceholder: string;
  submitLabel: string;
}) {
  const prefix = node ? `menu-${node.id}` : "menu-new";
  const locked = Boolean(node?.isSystem);
  const parentRequired = type === "action";

  return (
    <GuardedEditForm action={action} className={cn("space-y-5", !node && "mt-6")}>
      {node ? <input type="hidden" name="id" value={node.id} /> : <input type="hidden" name="type" value={type} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-title`}>名称</Label>
          <Input id={`${prefix}-title`} name="title" defaultValue={node?.title} required maxLength={80} placeholder={type === "action" ? "导出订单" : "订单"} />
        </div>

        {type !== "directory" ? (
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-parent`}>上级</Label>
            <Select id={`${prefix}-parent`} name="parentId" defaultValue={defaultParentId ?? ""} disabled={locked} required={parentRequired}>
              {parentRequired ? null : <option value="">顶级</option>}
              {parents.map((item) => (
                <option key={item.id} value={item.id}>
                  {TYPE_META[item.type].label} · {item.title}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        {type === "page" ? (
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-href`}>路径</Label>
            <Input id={`${prefix}-href`} name="href" defaultValue={node?.href} required disabled={locked} placeholder="/app/orders" pattern="/.*" />
          </div>
        ) : null}

        {type !== "directory" ? (
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-key`}>权限 key{type === "page" ? "（可选）" : ""}</Label>
            <Input
              id={`${prefix}-key`}
              name="permissionKey"
              defaultValue={node?.permissionKey ?? ""}
              required={type === "action"}
              disabled={locked}
              placeholder={keyPlaceholder}
              pattern="[a-z][a-z0-9_]*:[a-z][a-z0-9_]*"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">格式为 资源:动作，代码中用 requirePermission(&quot;{keyPlaceholder}&quot;) 校验。</p>
          </div>
        ) : null}

        {type !== "action" ? (
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-icon`}>图标</Label>
            <Select id={`${prefix}-icon`} name="icon" defaultValue={node?.icon ?? (type === "directory" ? "Settings" : "LayoutDashboard")}>
              {MENU_ICON_OPTIONS.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
            </Select>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor={`${prefix}-sort`}>排序</Label>
          <Input id={`${prefix}-sort`} name="sortOrder" type="number" defaultValue={node?.sortOrder ?? 100} />
        </div>
      </div>

      {locked ? (
        <>
          {/* Disabled inputs are not submitted; the server keeps the locked values. */}
          <input type="hidden" name="parentId" value={node?.parentId ?? ""} />
          <input type="hidden" name="href" value={node?.href ?? ""} />
          <input type="hidden" name="permissionKey" value={node?.permissionKey ?? ""} />
        </>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/70 pt-4">
        {type !== "action" ? (
          <label className="flex min-h-10 items-center gap-2 text-sm">
            <input type="checkbox" name="isVisible" defaultChecked={node?.isVisible ?? true} />
            在侧栏中显示
          </label>
        ) : (
          <input type="hidden" name="isVisible" value="on" />
        )}
        <SubmitButton pendingLabel="保存中…">{submitLabel}</SubmitButton>
      </div>
    </GuardedEditForm>
  );
}
